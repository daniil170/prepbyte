import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

/**
 * Authoritatively calculates exam scores from protected question definitions.
 *
 * @param {object} answers - User submitted answer map { [questionId]: [selectedOptionIndices] }
 * @param {Array<object>} protectedQuestions - Questions with topic and correctAnswers
 * @returns {object} Evaluation result with score, breakdown, and pass status
 */
export function evaluateAnswers(answers = {}, protectedQuestions = []) {
  let totalScore = 0;
  let maxPossibleScore = 0;
  let correctAnswersCount = 0;
  const byTopicBreakdown = {};
  const questionsList = Array.isArray(protectedQuestions) ? protectedQuestions : [];

  for (const question of questionsList) {
    if (!question || !question.id) continue;
    const userAnswers = Array.isArray(answers[question.id]) ? answers[question.id] : [];
    const userSet = new Set(userAnswers);
    const correctAnswers = Array.isArray(question.correctAnswers) ? question.correctAnswers : [];
    const correctSet = new Set(correctAnswers);
    const isMultipleChoice = correctSet.size > 1;
    const maxPoints = isMultipleChoice ? 2 : 1;

    let pointsAwarded = 0;
    if (!isMultipleChoice) {
      if (userSet.size === 1 && userSet.has(correctAnswers[0])) {
        pointsAwarded = 1;
      }
    } else {
      let omissions = 0;
      for (const ans of correctSet) {
        if (!userSet.has(ans)) omissions++;
      }
      let falsePositives = 0;
      for (const ans of userSet) {
        if (!correctSet.has(ans)) falsePositives++;
      }
      const totalErrors = omissions + falsePositives;
      if (totalErrors === 0) pointsAwarded = 2;
      else if (totalErrors === 1) pointsAwarded = 1;
      else pointsAwarded = 0;
    }

    if (pointsAwarded === maxPoints) correctAnswersCount++;
    totalScore += pointsAwarded;
    maxPossibleScore += maxPoints;

    const topic = question.topic || 'unknown';
    if (!byTopicBreakdown[topic]) {
      byTopicBreakdown[topic] = {
        topic,
        score: 0,
        maxScore: 0,
        percentage: 0,
        totalQuestions: 0,
      };
    }
    byTopicBreakdown[topic].score += pointsAwarded;
    byTopicBreakdown[topic].maxScore += maxPoints;
    byTopicBreakdown[topic].totalQuestions += 1;
  }

  for (const topic of Object.keys(byTopicBreakdown)) {
    const entry = byTopicBreakdown[topic];
    entry.percentage = entry.maxScore > 0 ? Math.round((entry.score / entry.maxScore) * 100) : 0;
  }

  const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  const passed = percentage >= 50;

  return {
    totalScore,
    maxPossibleScore,
    percentage,
    passed,
    correctAnswersCount,
    byTopicBreakdown,
  };
}

/**
 * Sanitizes student answers by ensuring:
 * 1. Only questions in authorized question list are processed.
 * 2. Option indices are strictly non-negative integers within allowed options count.
 * 3. Malformed structures, strings, nulls, and duplicate values are filtered out.
 */
export function sanitizeStudentAnswers(rawAnswers, authorizedQuestionIds, questionOptionsMap = new Map()) {
  const sanitized = {};
  const answersObj = (rawAnswers && typeof rawAnswers === 'object' && !Array.isArray(rawAnswers))
    ? rawAnswers
    : {};

  for (const qid of authorizedQuestionIds) {
    const maxOptions = questionOptionsMap.get(qid) || 10;
    const rawVal = answersObj[qid];

    if (Array.isArray(rawVal)) {
      const validIndices = rawVal.filter(
        (idx) => typeof idx === 'number' && Number.isInteger(idx) && idx >= 0 && idx < maxOptions
      );
      sanitized[qid] = [...new Set(validIndices)].sort((a, b) => a - b);
    } else if (typeof rawVal === 'number' && Number.isInteger(rawVal) && rawVal >= 0 && rawVal < maxOptions) {
      sanitized[qid] = [rawVal];
    } else {
      sanitized[qid] = [];
    }
  }

  return sanitized;
}

/**
 * Callable Cloud Function: startExamSession
 *
 * Server-authoritative session creation and initialization:
 * - Validates caller authentication
 * - Verifies student belongs to the exam's assigned group
 * - Checks exam status ('waiting' or 'active')
 * - Server-authoritatively computes startedAt, durationSeconds, expiresAt, and questionOrder
 * - Creates/returns the ExamSession document without trusting client-supplied timestamps or order
 */
export const startExamSession = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'Для начала экзамена требуется аутентификация.');
  }

  const { examId } = request.data || {};
  if (!examId || typeof examId !== 'string' || !examId.trim()) {
    throw new HttpsError('invalid-argument', 'Идентификатор экзамена (examId) обязателен.');
  }

  const cleanExamId = examId.trim();
  const studentId = request.auth.uid;
  const sessionId = `${cleanExamId}_${studentId}`;

  const sessionDocRef = db.collection('exam_sessions').doc(sessionId);

  return await db.runTransaction(async (transaction) => {
    const sessionSnap = await transaction.get(sessionDocRef);

    if (sessionSnap.exists) {
      const data = sessionSnap.data();
      return {
        id: sessionId,
        examId: cleanExamId,
        studentId,
        ...data,
      };
    }

    const examDocRef = db.collection('exams').doc(cleanExamId);
    const examSnap = await transaction.get(examDocRef);

    if (!examSnap.exists) {
      throw new HttpsError('not-found', `Экзамен [${cleanExamId}] не найден.`);
    }

    const examData = examSnap.data();

    if (examData.status !== 'waiting' && examData.status !== 'active') {
      throw new HttpsError(
        'failed-precondition',
        `Экзамен находится в статусе [${examData.status}] и недоступен для сдачи.`
      );
    }

    const groupId = examData.groupId;
    if (!groupId) {
      throw new HttpsError('failed-precondition', 'У экзамена отсутствует привязка к группе.');
    }

    const groupDocRef = db.collection('groups').doc(groupId);
    const groupSnap = await transaction.get(groupDocRef);

    if (!groupSnap.exists) {
      throw new HttpsError('not-found', `Группа [${groupId}] не найдена.`);
    }

    const groupData = groupSnap.data();
    const studentIds = Array.isArray(groupData.studentIds) ? groupData.studentIds : [];

    if (!studentIds.includes(studentId)) {
      throw new HttpsError(
        'permission-denied',
        'Вы не состоите в группе, для которой назначен этот экзамен.'
      );
    }

    const questionIds = Array.isArray(examData.questionIds) ? examData.questionIds : [];
    if (questionIds.length === 0) {
      throw new HttpsError('failed-precondition', 'В экзамене отсутствуют вопросы.');
    }

    const durationSeconds = Number(examData.durationSeconds) || (Number(examData.durationMinutes) || 60) * 60;
    const initialStatus = examData.status === 'active' ? 'in_progress' : 'waiting';
    const serverNowMs = Date.now();
    const startedAt = initialStatus === 'in_progress' ? serverNowMs : null;
    const expiresAt = startedAt ? startedAt + durationSeconds * 1000 : null;

    const sessionDocData = {
      examId: cleanExamId,
      studentId,
      studentName: request.auth.token?.name || request.auth.token?.email || studentId,
      groupId,
      questionOrder: [...questionIds],
      status: initialStatus,
      durationSeconds,
      startedAt: startedAt ? FieldValue.serverTimestamp() : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      submittedAt: null,
      answers: {},
      flagged: [],
      currentIndex: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    transaction.set(sessionDocRef, sessionDocData);

    return {
      id: sessionId,
      examId: cleanExamId,
      studentId,
      studentName: sessionDocData.studentName,
      groupId,
      questionOrder: questionIds,
      status: initialStatus,
      durationSeconds,
      startedAt,
      expiresAt,
      answers: {},
      flagged: [],
      currentIndex: 0,
    };
  });
});

/**
 * Callable Cloud Function: submitExamSession
 *
 * Implements server-authoritative submission with:
 * - Authentication & Session ownership validation
 * - Transactional execution for atomicity and race-condition prevention
 * - Idempotent response for already-submitted sessions
 * - Protected answer loading (strictly hidden from clients)
 * - Safe sanitization of student answers
 */
export const submitExamSession = onCall(async (request) => {
  // 1. Authentication validation
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'Для отправки экзамена требуется аутентификация.');
  }

  const { sessionId, answers = {} } = request.data || {};
  if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
    throw new HttpsError('invalid-argument', 'Идентификатор сессии (sessionId) обязателен.');
  }

  const cleanSessionId = sessionId.trim();
  const sessionDocRef = db.collection('exam_sessions').doc(cleanSessionId);

  // 2. Transactional execution for atomicity and race-condition prevention
  return await db.runTransaction(async (transaction) => {
    const sessionSnap = await transaction.get(sessionDocRef);

    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', `Сессия экзамена [${cleanSessionId}] не найдена.`);
    }

    const sessionData = sessionSnap.data();

    // 3. Ownership verification: request.auth.uid MUST match session.studentId
    if (sessionData.studentId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Вы не являетесь владельцем этой экзаменационной сессии.');
    }

    // 4. Idempotency: Return existing authoritative score if already submitted
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

    // 5. Lifecycle precondition check
    if (sessionData.status !== 'waiting' && sessionData.status !== 'in_progress') {
      throw new HttpsError('failed-precondition', `Невозможно отправить сессию со статусом [${sessionData.status}].`);
    }

    const examId = sessionData.examId;
    if (!examId) {
      throw new HttpsError('failed-precondition', 'В сессии отсутствует идентификатор экзамена.');
    }

    const examDocRef = db.collection('exams').doc(examId);
    const examSnap = await transaction.get(examDocRef);

    if (!examSnap.exists) {
      throw new HttpsError('not-found', `Экзамен [${examId}] не найден.`);
    }

    const examData = examSnap.data();

    // 6. Authoritative question order
    const questionIds = Array.isArray(sessionData.questionOrder) && sessionData.questionOrder.length > 0
      ? sessionData.questionOrder
      : (Array.isArray(examData.questionIds) ? examData.questionIds : []);

    if (questionIds.length === 0) {
      throw new HttpsError('failed-precondition', 'В экзамене отсутствуют вопросы для оценивания.');
    }

    const uniqueIds = [...new Set(questionIds)];

    // 7. Load protected correct answers and question metadata within transaction
    const answerRefs = uniqueIds.map((qid) => db.collection('question_answers').doc(qid));
    const questionRefs = uniqueIds.map((qid) => db.collection('questions').doc(qid));

    const answerSnaps = await Promise.all(answerRefs.map((ref) => transaction.get(ref)));
    const questionSnaps = await Promise.all(questionRefs.map((ref) => transaction.get(ref)));

    const answerMap = new Map();
    answerSnaps.forEach((snap) => {
      if (snap.exists) answerMap.set(snap.id, snap.data());
    });

    const questionMap = new Map();
    const optionsCountMap = new Map();
    questionSnaps.forEach((snap) => {
      if (snap.exists) {
        const data = snap.data();
        questionMap.set(snap.id, data);
        optionsCountMap.set(snap.id, Array.isArray(data?.options) ? data.options.length : 10);
      }
    });

    // 8. Sanitize client submitted answers
    const sanitizedAnswers = sanitizeStudentAnswers(
      answers && typeof answers === 'object' ? answers : sessionData.answers,
      uniqueIds,
      optionsCountMap
    );

    const protectedQuestions = uniqueIds.map((id) => {
      const ansData = answerMap.get(id);
      const qData = questionMap.get(id);
      return {
        id,
        topic: qData?.topic || 'unknown',
        correctAnswers: Array.isArray(ansData?.correctAnswers) ? ansData.correctAnswers : [],
      };
    });

    // 9. Authoritative server scoring
    const evaluation = evaluateAnswers(sanitizedAnswers, protectedQuestions);

    // 10. Write immutable result inside transaction
    transaction.update(sessionDocRef, {
      status: 'submitted',
      submittedAt: FieldValue.serverTimestamp(),
      answers: sanitizedAnswers,
      score: evaluation.totalScore,
      totalScore: evaluation.totalScore,
      maxPossibleScore: evaluation.maxPossibleScore,
      percentage: evaluation.percentage,
      correctAnswersCount: evaluation.correctAnswersCount,
      passed: evaluation.passed,
      byTopicBreakdown: evaluation.byTopicBreakdown,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 11. Return safe summary WITHOUT exposing correct answers
    return {
      sessionId: cleanSessionId,
      status: 'submitted',
      score: evaluation.totalScore,
      totalScore: evaluation.totalScore,
      maxPossibleScore: evaluation.maxPossibleScore,
      percentage: evaluation.percentage,
      correctAnswersCount: evaluation.correctAnswersCount,
      passed: evaluation.passed,
      byTopicBreakdown: evaluation.byTopicBreakdown,
      alreadySubmitted: false,
    };
  });
});
