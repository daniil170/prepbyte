import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { evaluateExamAnswers } from '../domain/examSession';
import { chunk } from '@shared/lib/chunk';
import { functions as defaultFunctions } from '@infrastructure/firebase/functions';

export class SubmitExamSessionError extends Error {
  constructor(message, code = 'INTERNAL') {
    super(message);
    this.name = 'SubmitExamSessionError';
    this.code = code;
  }
}

/**
 * Client submission transport that invokes the Callable Cloud Function.
 * The Cloud Function runs on the secure backend with Admin SDK privileges,
 * verifies authentication, loads protected answers, scores server-authoritatively,
 * and writes immutable results to Firestore.
 *
 * @param {object} payload - Submission payload ({ sessionId, answers })
 * @param {object} functionsInstance - Optional Firebase Functions instance
 * @returns {Promise<object>} Safe score result summary
 */
export async function submitExamSessionClient(
  { sessionId, answers = {} } = {},
  functionsInstance = defaultFunctions,
  { callableFactory = httpsCallable } = {}
) {
  if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
    throw new SubmitExamSessionError(
      'Идентификатор сессии (sessionId) обязателен.',
      'INVALID_ARGUMENT'
    );
  }

  try {
    const callable = callableFactory(functionsInstance, 'submitExamSession');
    const response = await callable({
      sessionId: sessionId.trim(),
      answers,
    });
    return response.data;
  } catch (err) {
    const message = err.message || 'Ошибка отправки экзамена на сервер.';
    const code = err.code || 'UNKNOWN';
    throw new SubmitExamSessionError(message, code);
  }
}

/**
 * Server-authoritative submission service for online exams (used in server / test environments).
 *
 * Validates authentication, loads protected correct answers from question_answers,
 * calculates the score on the trusted server/service, and writes immutable results to Firestore.
 *
 * @param {object} firestore - Firestore instance.
 * @param {object} authUser - Authenticated user context ({ uid, role, ... }).
 * @param {object} payload - Submission payload ({ sessionId, answers }).
 * @returns {Promise<object>} Safe score result summary without exposing correct answers.
 */
export async function submitExamSessionService(
  firestore,
  authUser,
  { sessionId, answers = {} } = {}
) {
  // 1. Authentication check
  if (!authUser || !authUser.uid) {
    throw new SubmitExamSessionError(
      'Для отправки экзамена требуется аутентификация.',
      'UNAUTHENTICATED'
    );
  }

  if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
    throw new SubmitExamSessionError(
      'Идентификатор сессии (sessionId) обязателен.',
      'INVALID_ARGUMENT'
    );
  }

  const cleanSessionId = sessionId.trim();

  // 2. Load Exam Session
  const sessionDocRef = doc(firestore, 'exam_sessions', cleanSessionId);
  const sessionSnap = await getDoc(sessionDocRef);

  if (!sessionSnap.exists()) {
    throw new SubmitExamSessionError(
      `Сессия экзамена [id=${cleanSessionId}] не найдена.`,
      'NOT_FOUND'
    );
  }

  const sessionData = sessionSnap.data();

  // 3. Verify student ownership
  if (sessionData.studentId !== authUser.uid) {
    throw new SubmitExamSessionError(
      'Вы не являетесь владельцем этой экзаменационной сессии.',
      'PERMISSION_DENIED'
    );
  }

  // 4. Idempotency check: if already submitted, return the existing authoritative score
  if (sessionData.status === 'submitted') {
    return {
      sessionId: cleanSessionId,
      status: 'submitted',
      score: sessionData.score ?? sessionData.totalScore ?? 0,
      totalScore: sessionData.totalScore ?? 0,
      maxPossibleScore: sessionData.maxPossibleScore ?? 0,
      percentage: sessionData.percentage ?? 0,
      correctAnswersCount: sessionData.correctAnswersCount ?? 0,
      passed: Boolean(sessionData.passed),
      byTopicBreakdown: sessionData.byTopicBreakdown || {},
      alreadySubmitted: true,
    };
  }

  if (sessionData.status !== 'waiting' && sessionData.status !== 'in_progress') {
    throw new SubmitExamSessionError(
      `Невозможно отправить сессию со статусом [${sessionData.status}].`,
      'FAILED_PRECONDITION'
    );
  }

  // 5. Load Exam
  const examId = sessionData.examId;
  const examDocRef = doc(firestore, 'exams', examId);
  const examSnap = await getDoc(examDocRef);

  if (!examSnap.exists()) {
    throw new SubmitExamSessionError(
      `Экзамен [id=${examId}] не найден.`,
      'NOT_FOUND'
    );
  }

  const examData = examSnap.data();
  const questionIds = Array.isArray(examData.questionIds) ? examData.questionIds : [];

  if (questionIds.length === 0) {
    throw new SubmitExamSessionError(
      'В экзамене отсутствуют вопросы для оценивания.',
      'FAILED_PRECONDITION'
    );
  }

  // 6. Load protected correct answers from question_answers and topics from questions
  const uniqueIds = [...new Set(questionIds)];
  const chunks = chunk(uniqueIds, 30);
  const answersRef = collection(firestore, 'question_answers');
  const questionsRef = collection(firestore, 'questions');

  const [answersResults, questionsResults] = await Promise.all([
    Promise.all(
      chunks.map(async (idChunk) => {
        const q = query(answersRef, where(documentId(), 'in', idChunk));
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      })
    ),
    Promise.all(
      chunks.map(async (idChunk) => {
        const q = query(questionsRef, where(documentId(), 'in', idChunk));
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, topic: d.data().topic || 'unknown' }));
      })
    ),
  ]);

  const answerDocsMap = new Map(answersResults.flat().map((a) => [a.id, a]));
  const questionDocsMap = new Map(questionsResults.flat().map((q) => [q.id, q]));

  // Build protected question items for pure domain evaluation
  const protectedQuestions = uniqueIds.map((id) => {
    const ansData = answerDocsMap.get(id);
    const qData = questionDocsMap.get(id);
    return {
      id,
      topic: qData?.topic || 'unknown',
      correctAnswers: Array.isArray(ansData?.correctAnswers) ? ansData.correctAnswers : [],
    };
  });

  // 7. Execute pure server-side evaluation (ignoring any client-supplied scores)
  const sanitizedAnswers = answers && typeof answers === 'object' && !Array.isArray(answers)
    ? answers
    : sessionData.answers || {};

  const evaluationResult = evaluateExamAnswers(sanitizedAnswers, protectedQuestions);

  // 8. Write authoritative immutable result to Firestore
  const patch = {
    status: 'submitted',
    submittedAt: serverTimestamp(),
    answers: sanitizedAnswers,
    score: evaluationResult.totalScore,
    totalScore: evaluationResult.totalScore,
    maxPossibleScore: evaluationResult.maxPossibleScore,
    percentage: evaluationResult.percentage,
    correctAnswersCount: evaluationResult.correctAnswersCount,
    passed: evaluationResult.passed,
    byTopicBreakdown: evaluationResult.byTopicBreakdown,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(sessionDocRef, patch);

  // 9. Return safe result WITHOUT correctAnswers
  return {
    sessionId: cleanSessionId,
    status: 'submitted',
    score: evaluationResult.totalScore,
    totalScore: evaluationResult.totalScore,
    maxPossibleScore: evaluationResult.maxPossibleScore,
    percentage: evaluationResult.percentage,
    correctAnswersCount: evaluationResult.correctAnswersCount,
    passed: evaluationResult.passed,
    byTopicBreakdown: evaluationResult.byTopicBreakdown,
    alreadySubmitted: false,
  };
}
