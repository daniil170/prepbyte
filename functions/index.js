import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

function evaluateAnswers(answers = {}, protectedQuestions = []) {
  let totalScore = 0;
  let maxPossibleScore = 0;
  let correctAnswersCount = 0;
  const byTopicBreakdown = {};

  for (const question of protectedQuestions) {
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

export const submitExamSession = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'Для отправки экзамена требуется аутентификация.');
  }

  const { sessionId, answers = {} } = request.data || {};
  if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
    throw new HttpsError('invalid-argument', 'Идентификатор сессии (sessionId) обязателен.');
  }

  const cleanSessionId = sessionId.trim();
  const sessionDocRef = db.collection('exam_sessions').doc(cleanSessionId);
  const sessionSnap = await sessionDocRef.get();

  if (!sessionSnap.exists) {
    throw new HttpsError('not-found', `Сессия экзамена [${cleanSessionId}] не найдена.`);
  }

  const sessionData = sessionSnap.data();

  if (sessionData.studentId !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'Вы не являетесь владельцем этой экзаменационной сессии.');
  }

  // Idempotency: return existing result if already submitted
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
    throw new HttpsError('failed-precondition', `Невозможно отправить сессию со статусом [${sessionData.status}].`);
  }

  const examId = sessionData.examId;
  const examDocRef = db.collection('exams').doc(examId);
  const examSnap = await examDocRef.get();

  if (!examSnap.exists) {
    throw new HttpsError('not-found', `Экзамен [${examId}] не найден.`);
  }

  const examData = examSnap.data();
  const questionIds = Array.isArray(examData.questionIds) ? examData.questionIds : [];

  if (questionIds.length === 0) {
    throw new HttpsError('failed-precondition', 'В экзамене отсутствуют вопросы для оценивания.');
  }

  // Load protected correct answers from question_answers collection (admin access)
  const uniqueIds = [...new Set(questionIds)];
  const answerSnaps = await Promise.all(
    uniqueIds.map((qid) => db.collection('question_answers').doc(qid).get())
  );
  const questionSnaps = await Promise.all(
    uniqueIds.map((qid) => db.collection('questions').doc(qid).get())
  );

  const answerMap = new Map();
  answerSnaps.forEach((snap) => {
    if (snap.exists) answerMap.set(snap.id, snap.data());
  });

  const questionMap = new Map();
  questionSnaps.forEach((snap) => {
    if (snap.exists) questionMap.set(snap.id, snap.data());
  });

  const protectedQuestions = uniqueIds.map((id) => {
    const ansData = answerMap.get(id);
    const qData = questionMap.get(id);
    return {
      id,
      topic: qData?.topic || 'unknown',
      correctAnswers: Array.isArray(ansData?.correctAnswers) ? ansData.correctAnswers : [],
    };
  });

  // Calculate authoritative result
  const sanitizedAnswers = answers && typeof answers === 'object' && !Array.isArray(answers)
    ? answers
    : sessionData.answers || {};

  const evaluation = evaluateAnswers(sanitizedAnswers, protectedQuestions);

  // Write immutable result to Firestore using Admin SDK
  await sessionDocRef.update({
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

  // Return safe summary WITHOUT exposing correct answers
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
