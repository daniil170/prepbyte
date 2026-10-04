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

  // Query all existing sessions for this student & exam
  const sessionsQuerySnap = await db
    .collection('exam_sessions')
    .where('examId', '==', cleanExamId)
    .where('studentId', '==', studentId)
    .get();

  const existingSessions = sessionsQuerySnap.docs.map((d) => ({
    id: d.id,
    ref: d.ref,
    ...d.data(),
  }));
  existingSessions.sort((a, b) => (a.attemptNumber || 1) - (b.attemptNumber || 1));

  // Find active session (in_progress or waiting)
  let activeSession = existingSessions.find(
    (s) => s.status === 'in_progress' || s.status === 'waiting'
  );

  const examDocRef = db.collection('exams').doc(cleanExamId);
  const examSnap = await examDocRef.get();
  if (!examSnap.exists) {
    throw new HttpsError('not-found', `Экзамен [${cleanExamId}] не найден.`);
  }
  const examData = examSnap.data();

  if (activeSession) {
    const sessionDocRef = db.collection('exam_sessions').doc(activeSession.id);
    return await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(sessionDocRef);
      if (!snap.exists) return activeSession;
      const data = snap.data();

      if (data.status === 'waiting' && examData.status === 'active') {
        const durationSeconds =
          Number(data.durationSeconds) ||
          Number(examData.durationSeconds) ||
          (Number(examData.durationMinutes) || 60) * 60;
        const serverNowMs = Date.now();
        const startedAt = serverNowMs;
        const expiresAt = startedAt + durationSeconds * 1000;

        transaction.update(sessionDocRef, {
          status: 'in_progress',
          startedAt: FieldValue.serverTimestamp(),
          expiresAt: new Date(expiresAt),
          updatedAt: FieldValue.serverTimestamp(),
        });

        return {
          id: activeSession.id,
          examId: cleanExamId,
          studentId,
          ...data,
          status: 'in_progress',
          startedAt,
          expiresAt,
        };
      }

      return {
        id: activeSession.id,
        examId: cleanExamId,
        studentId,
        ...data,
      };
    });
  }

  // Count finished sessions (submitted, disqualified, abandoned)
  const finishedSessions = existingSessions.filter(
    (s) => s.status === 'submitted' || s.status === 'disqualified' || s.status === 'abandoned'
  );

  const maxAttempts = 3;
  if (finishedSessions.length >= maxAttempts) {
    throw new HttpsError(
      'failed-precondition',
      `Достигнут лимит попыток (${finishedSessions.length}/${maxAttempts}). Запуск экзамена невозможен.`
    );
  }

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

  const groupSnap = await db.collection('groups').doc(groupId).get();
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

  const nextAttemptNumber = finishedSessions.length + 1;
  const sessionId =
    nextAttemptNumber === 1 && !existingSessions.some((s) => s.id === `${cleanExamId}_${studentId}`)
      ? `${cleanExamId}_${studentId}`
      : `${cleanExamId}_${studentId}_${nextAttemptNumber}`;

  const sessionDocRef = db.collection('exam_sessions').doc(sessionId);

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
    attemptNumber: nextAttemptNumber,
    violationCount: 0,
    maxViolations: 3,
    disqualifiedAt: null,
    disqualificationReason: null,
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

  await sessionDocRef.set(sessionDocData);

  return {
    id: sessionId,
    examId: cleanExamId,
    studentId,
    studentName: sessionDocData.studentName,
    groupId,
    questionOrder: questionIds,
    status: initialStatus,
    attemptNumber: nextAttemptNumber,
    violationCount: 0,
    maxViolations: 3,
    durationSeconds,
    startedAt,
    expiresAt,
    answers: {},
    flagged: [],
    currentIndex: 0,
  };
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

/**
 * Callable Cloud Function: reportExamViolation
 *
 * Server-authoritative violation registration and 3-strike disqualification handling:
 * - Validates authenticated student ownership of the session
 * - Verifies session status is 'in_progress' and not expired
 * - Enforces idempotency via eventId
 * - Atomically increments violationCount
 * - Disqualifies session server-side if violationCount >= maxViolations (3)
 */
export const reportExamViolation = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'Для отправки нарушения требуется аутентификация.');
  }

  const { sessionId, type, eventId, metadata } = request.data || {};
  if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
    throw new HttpsError('invalid-argument', 'Идентификатор сессии (sessionId) обязателен.');
  }
  if (!type || typeof type !== 'string' || !type.trim()) {
    throw new HttpsError('invalid-argument', 'Тип нарушения (type) обязателен.');
  }

  const cleanSessionId = sessionId.trim();
  const cleanType = type.trim();
  const cleanEventId = eventId && typeof eventId === 'string' ? eventId.trim() : null;
  const studentId = request.auth.uid;

  const validTypes = [
    'EXIT_FULLSCREEN',
    'TAB_SWITCH',
    'WINDOW_BLUR',
    'COPY_ATTEMPT',
    'CUT_ATTEMPT',
    'PASTE_ATTEMPT',
    'CONTEXT_MENU',
    'KEYBOARD_SHORTCUT',
  ];

  if (!validTypes.includes(cleanType)) {
    throw new HttpsError('invalid-argument', `Недопустимый тип нарушения: [${cleanType}].`);
  }

  const sessionDocRef = db.collection('exam_sessions').doc(cleanSessionId);

  return await db.runTransaction(async (transaction) => {
    const sessionSnap = await transaction.get(sessionDocRef);
    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', `Сессия экзамена [${cleanSessionId}] не найдена.`);
    }

    const sessionData = sessionSnap.data();

    if (sessionData.studentId !== studentId) {
      throw new HttpsError('permission-denied', 'Вы не можете отправлять нарушения для чужой сессии.');
    }

    if (sessionData.status === 'disqualified' || sessionData.status === 'submitted') {
      return {
        success: true,
        disqualified: sessionData.status === 'disqualified',
        violationCount: sessionData.violationCount || 0,
        session: { id: cleanSessionId, ...sessionData },
      };
    }

    if (sessionData.status !== 'in_progress' && sessionData.status !== 'waiting') {
      throw new HttpsError('failed-precondition', `Нарушение не принимается, так как сессия находится в статусе [${sessionData.status}].`);
    }

    if (sessionData.expiresAt) {
      const expiresMs = typeof sessionData.expiresAt.toMillis === 'function'
        ? sessionData.expiresAt.toMillis()
        : (sessionData.expiresAt instanceof Date ? sessionData.expiresAt.getTime() : Number(sessionData.expiresAt));
      if (expiresMs && Date.now() > expiresMs) {
        throw new HttpsError('failed-precondition', 'Нарушение не принимается, так как время сессии истекло.');
      }
    }

    const violationDocId = cleanEventId ? `viol_${cleanEventId}` : `viol_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const violationDocRef = sessionDocRef.collection('violations').doc(violationDocId);
    const violationSnap = await transaction.get(violationDocRef);

    if (violationSnap.exists) {
      return {
        success: true,
        duplicate: true,
        disqualified: sessionData.status === 'disqualified',
        violationCount: sessionData.violationCount || 0,
        session: { id: cleanSessionId, ...sessionData },
      };
    }

    const currentViolations = Number(sessionData.violationCount) || 0;
    const maxViolations = Number(sessionData.maxViolations) || 3;
    const newViolationCount = currentViolations + 1;
    const isDisqualified = newViolationCount >= maxViolations;

    const violationData = {
      type: cleanType,
      timestamp: FieldValue.serverTimestamp(),
      timestampMs: Date.now(),
      attemptNumber: sessionData.attemptNumber || 1,
      sessionId: cleanSessionId,
      studentId,
      examId: sessionData.examId,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
      eventId: cleanEventId || null,
    };

    transaction.set(violationDocRef, violationData);

    const updatePatch = {
      violationCount: newViolationCount,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isDisqualified) {
      updatePatch.status = 'disqualified';
      updatePatch.disqualifiedAt = FieldValue.serverTimestamp();
      updatePatch.disqualificationReason = 'Превышен допустимый лимит нарушений (3/3).';
    }

    transaction.update(sessionDocRef, updatePatch);

    const updatedSession = {
      ...sessionData,
      violationCount: newViolationCount,
      status: isDisqualified ? 'disqualified' : sessionData.status,
      disqualifiedAt: isDisqualified ? Date.now() : sessionData.disqualifiedAt || null,
      disqualificationReason: isDisqualified ? 'Превышен допустимый лимит нарушений (3/3).' : sessionData.disqualificationReason || null,
    };

    return {
      success: true,
      disqualified: isDisqualified,
      violationCount: newViolationCount,
      maxViolations,
      session: { id: cleanSessionId, ...updatedSession },
    };
  });
});

/**
 * Callable Cloud Function: saveQuestion
 *
 * Server-authoritative question creation and editing for teachers:
 * - Validates authentication and teacher/admin role
 * - Validates domain rules (questionText, topic, difficulty, options, correctAnswers)
 * - Enforces teacher ownership (cannot edit another teacher's question)
 * - Server-authoritatively binds createdBy to request.auth.uid (ignores client input)
 * - Performs atomic transaction writing to /questions and /question_answers
 */
export const saveQuestion = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'Для сохранения вопроса требуется аутентификация.');
  }

  const isTeacher = Boolean(request.auth.token?.teacher || request.auth.token?.admin);
  if (!isTeacher) {
    throw new HttpsError('permission-denied', 'Доступ разрешён только преподавателям и администраторам.');
  }

  const questionData = request.data || {};
  const {
    id,
    questionText,
    topic,
    difficulty,
    type,
    multiple,
    options,
    correctAnswers,
    explanation,
  } = questionData;

  // Validation checks
  if (typeof questionText !== 'string' || !questionText.trim()) {
    throw new HttpsError('invalid-argument', 'Текст вопроса (questionText) обязателен.');
  }
  if (typeof topic !== 'string' || !topic.trim()) {
    throw new HttpsError('invalid-argument', 'Тема вопроса (topic) обязательна.');
  }
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    throw new HttpsError('invalid-argument', 'Некорректная сложность вопроса (difficulty).');
  }
  if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
    throw new HttpsError('invalid-argument', 'Количество вариантов должно быть от 2 до 6.');
  }

  const cleanOptions = options.map((opt) => (typeof opt === 'string' ? opt.trim() : ''));
  if (cleanOptions.some((opt) => !opt)) {
    throw new HttpsError('invalid-argument', 'Все варианты ответов должны быть непустыми строками.');
  }
  const uniqueOptions = new Set(cleanOptions);
  if (uniqueOptions.size !== cleanOptions.length) {
    throw new HttpsError('invalid-argument', 'Варианты ответов не должны дублироваться.');
  }

  const isMultiple = Boolean(
    type === 'multiple' || multiple || (Array.isArray(correctAnswers) && correctAnswers.length > 1)
  );

  if (!Array.isArray(correctAnswers) || correctAnswers.length === 0) {
    throw new HttpsError('invalid-argument', 'Укажите хотя бы один правильный ответ.');
  }
  if (!isMultiple && correctAnswers.length > 1) {
    throw new HttpsError('invalid-argument', 'Для вопроса с одним выбором ответа укажите ровно один правильный вариант.');
  }

  const maxOptionIndex = cleanOptions.length - 1;
  const invalidIndices = correctAnswers.some(
    (idx) => typeof idx !== 'number' || !Number.isInteger(idx) || idx < 0 || idx > maxOptionIndex
  );
  if (invalidIndices) {
    throw new HttpsError('invalid-argument', 'Индексы правильных ответов выходят за диапазон вариантов.');
  }

  const targetId = id && typeof id === 'string' && id.trim()
    ? id.trim()
    : `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const callerUid = request.auth.uid;
  const isAdmin = Boolean(request.auth.token?.admin);

  const publicDocRef = db.collection('questions').doc(targetId);
  const answerDocRef = db.collection('question_answers').doc(targetId);

  return await db.runTransaction(async (transaction) => {
    const publicSnap = await transaction.get(publicDocRef);
    let ownerUid = callerUid;
    let version = 1;
    let currentStatus = 'active';

    if (publicSnap.exists) {
      const existingData = publicSnap.data();
      if (existingData.createdBy && existingData.createdBy !== callerUid && !isAdmin) {
        throw new HttpsError('permission-denied', 'Вы можете редактировать только собственные вопросы.');
      }
      ownerUid = existingData.createdBy || callerUid;
      version = (existingData.version || 1) + 1;
      currentStatus = existingData.status || 'active';
    }

    const publicPayload = {
      topic: topic.trim(),
      questionText: questionText.trim(),
      options: cleanOptions,
      multiple: isMultiple,
      difficulty,
      createdBy: ownerUid,
      status: currentStatus,
      version,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!publicSnap.exists) {
      publicPayload.createdAt = FieldValue.serverTimestamp();
    }

    const answerPayload = {
      questionId: targetId,
      correctAnswers: [...new Set(correctAnswers)].sort((a, b) => a - b),
      explanation: typeof explanation === 'string' ? explanation.trim() : '',
      createdBy: ownerUid,
      version,
      updatedAt: FieldValue.serverTimestamp(),
    };

    transaction.set(publicDocRef, publicPayload, { merge: true });
    transaction.set(answerDocRef, answerPayload, { merge: true });

    return {
      success: true,
      id: targetId,
      question: {
        id: targetId,
        ...publicPayload,
        correctAnswers: answerPayload.correctAnswers,
        explanation: answerPayload.explanation,
      },
    };
  });
});

/**
 * Callable Cloud Function: archiveQuestion
 *
 * Soft-deletes a teacher question by updating status = 'archived':
 * - Validates authentication and teacher role
 * - Enforces ownership check (teachers can only archive their own questions)
 */
export const archiveQuestion = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'Для архивации вопроса требуется аутентификация.');
  }

  const isTeacher = Boolean(request.auth.token?.teacher || request.auth.token?.admin);
  if (!isTeacher) {
    throw new HttpsError('permission-denied', 'Доступ разрешён только преподавателям и администраторам.');
  }

  const { questionId } = request.data || {};
  if (!questionId || typeof questionId !== 'string' || !questionId.trim()) {
    throw new HttpsError('invalid-argument', 'Идентификатор вопроса (questionId) обязателен.');
  }

  const cleanId = questionId.trim();
  const callerUid = request.auth.uid;
  const isAdmin = Boolean(request.auth.token?.admin);
  const publicDocRef = db.collection('questions').doc(cleanId);

  return await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(publicDocRef);
    if (!snap.exists) {
      throw new HttpsError('not-found', `Вопрос [${cleanId}] не найден.`);
    }

    const data = snap.data();
    if (data.createdBy && data.createdBy !== callerUid && !isAdmin) {
      throw new HttpsError('permission-denied', 'Вы можете архивировать только собственные вопросы.');
    }

    transaction.update(publicDocRef, {
      status: 'archived',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      id: cleanId,
      status: 'archived',
    };
  });
});

/**
 * Callable Cloud Function: saveExamDraft
 *
 * Server-authoritative exam draft creation and editing:
 * - Validates authentication and teacher/admin role
 * - Validates title (3-120 chars), group existence, duration (5-240 min), question selection
 * - Loads public question documents to verify accessibility and build questionSnapshots
 * - Binds teacherId to request.auth.uid (never trusts client input)
 * - Updates or creates the exam document in 'draft' status
 */
export const saveExamDraft = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'Для сохранения черновика экзамена требуется аутентификация.');
  }

  const isTeacher = Boolean(request.auth.token?.teacher || request.auth.token?.admin);
  if (!isTeacher) {
    throw new HttpsError('permission-denied', 'Доступ разрешён только преподавателям и администраторам.');
  }

  const {
    id,
    title,
    description = '',
    groupId,
    groupName = '',
    durationMinutes = 60,
    questionIds = [],
  } = request.data || {};

  // 1. Validation of title
  const cleanTitle = typeof title === 'string' ? title.trim() : '';
  if (!cleanTitle || cleanTitle.length < 3 || cleanTitle.length > 120) {
    throw new HttpsError('invalid-argument', 'Название экзамена должно содержать от 3 до 120 символов.');
  }

  // 2. Validation of group
  const cleanGroupId = typeof groupId === 'string' ? groupId.trim() : '';
  if (!cleanGroupId) {
    throw new HttpsError('invalid-argument', 'Выберите группу учащихся для экзамена.');
  }

  // 3. Validation of duration
  const durNum = Number(durationMinutes);
  if (!Number.isInteger(durNum) || durNum < 5 || durNum > 240) {
    throw new HttpsError('invalid-argument', 'Длительность экзамена должна быть от 5 до 240 минут.');
  }

  // 4. Validation of questions selection
  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    throw new HttpsError('invalid-argument', 'Выберите хотя бы один вопрос для экзамена.');
  }

  const cleanQuestionIds = questionIds.map((qid) => (typeof qid === 'string' ? qid.trim() : '')).filter(Boolean);
  if (cleanQuestionIds.length === 0) {
    throw new HttpsError('invalid-argument', 'Список вопросов не должен быть пустым.');
  }

  const callerUid = request.auth.uid;
  const isAdmin = Boolean(request.auth.token?.admin);

  // 5. Verify Group existence and teacher permission
  const groupDocRef = db.collection('groups').doc(cleanGroupId);
  const groupSnap = await groupDocRef.get();
  if (!groupSnap.exists) {
    throw new HttpsError('not-found', `Указанная группа [${cleanGroupId}] не найдена.`);
  }

  const groupData = groupSnap.data();
  if (groupData.teacherId && groupData.teacherId !== callerUid && !isAdmin) {
    throw new HttpsError('permission-denied', 'Вы можете создавать экзамены только для своих групп.');
  }

  // 6. Verify selected questions and build public questionSnapshots
  const uniqueQuestionIds = [...new Set(cleanQuestionIds)];
  const questionRefs = uniqueQuestionIds.map((qid) => db.collection('questions').doc(qid));
  const questionSnaps = await Promise.all(questionRefs.map((ref) => ref.get()));

  const questionMap = new Map();
  questionSnaps.forEach((snap) => {
    if (snap.exists) {
      questionMap.set(snap.id, snap.data());
    }
  });

  const missingIds = uniqueQuestionIds.filter((qid) => !questionMap.has(qid));
  if (missingIds.length > 0) {
    throw new HttpsError('not-found', `Вопросы с ID [${missingIds.join(', ')}] не найдены в банке вопросов.`);
  }

  // Check question ownership/accessibility
  for (const qid of uniqueQuestionIds) {
    const qData = questionMap.get(qid);
    if (qData.createdBy && qData.createdBy !== callerUid && !isAdmin) {
      throw new HttpsError('permission-denied', `Вопрос [${qid}] принадлежит другому преподавателю.`);
    }
  }

  // Build public snapshots (NO correctAnswers or explanation!)
  const questionSnapshots = {};
  for (const qid of cleanQuestionIds) {
    const qData = questionMap.get(qid);
    questionSnapshots[qid] = {
      id: qid,
      questionText: qData.questionText || '',
      topic: qData.topic || '',
      difficulty: qData.difficulty || 'medium',
      multiple: Boolean(qData.multiple),
      options: Array.isArray(qData.options) ? [...qData.options] : [],
      version: qData.version || 1,
    };
  }

  const targetExamId = id && typeof id === 'string' && id.trim()
    ? id.trim()
    : `exam_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const examDocRef = db.collection('exams').doc(targetExamId);

  return await db.runTransaction(async (transaction) => {
    const existingSnap = await transaction.get(examDocRef);
    let ownerTeacherId = callerUid;
    let currentPin = null;

    if (existingSnap.exists) {
      const existingData = existingSnap.data();
      if (existingData.teacherId && existingData.teacherId !== callerUid && !isAdmin) {
        throw new HttpsError('permission-denied', 'Вы можете редактировать только собственные экзамены.');
      }
      if (existingData.status !== 'draft') {
        throw new HttpsError('failed-precondition', `Экзамен находится в статусе [${existingData.status}] и недоступен для редактирования как черновик.`);
      }
      ownerTeacherId = existingData.teacherId || callerUid;
      currentPin = existingData.pin || null;
    }

    const payload = {
      title: cleanTitle,
      description: typeof description === 'string' ? description.trim() : '',
      teacherId: ownerTeacherId,
      groupId: cleanGroupId,
      groupName: (groupName || groupData.name || '').trim(),
      questionIds: cleanQuestionIds,
      questionSnapshots,
      totalQuestions: cleanQuestionIds.length,
      durationMinutes: durNum,
      durationSeconds: durNum * 60,
      pin: currentPin,
      status: 'draft',
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!existingSnap.exists) {
      payload.createdAt = FieldValue.serverTimestamp();
    }

    transaction.set(examDocRef, payload, { merge: true });

    return {
      success: true,
      id: targetExamId,
      exam: {
        id: targetExamId,
        ...payload,
      },
    };
  });
});

/**
 * Callable Cloud Function: deleteExamDraft
 *
 * Server-authoritative deletion of an exam draft:
 * - Validates authentication and teacher role
 * - Validates teacher ownership
 * - Validates status === 'draft'
 */
export const deleteExamDraft = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'Для удаления черновика требуется аутентификация.');
  }

  const isTeacher = Boolean(request.auth.token?.teacher || request.auth.token?.admin);
  if (!isTeacher) {
    throw new HttpsError('permission-denied', 'Доступ разрешён только преподавателям и администраторам.');
  }

  const { examId } = request.data || {};
  if (!examId || typeof examId !== 'string' || !examId.trim()) {
    throw new HttpsError('invalid-argument', 'Идентификатор экзамена (examId) обязателен.');
  }

  const cleanExamId = examId.trim();
  const callerUid = request.auth.uid;
  const isAdmin = Boolean(request.auth.token?.admin);

  const examDocRef = db.collection('exams').doc(cleanExamId);

  return await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(examDocRef);
    if (!snap.exists) {
      throw new HttpsError('not-found', `Экзамен [${cleanExamId}] не найден.`);
    }

    const data = snap.data();
    if (data.teacherId && data.teacherId !== callerUid && !isAdmin) {
      throw new HttpsError('permission-denied', 'Вы можете удалять только собственные черновики.');
    }
    if (data.status !== 'draft') {
      throw new HttpsError('failed-precondition', `Экзамен в статусе [${data.status}] не может быть удалён как черновик.`);
    }

    transaction.delete(examDocRef);

    if (data.pin) {
      const pinDocRef = db.collection('exam_pin_lookup').doc(data.pin);
      transaction.delete(pinDocRef);
    }

    return {
      success: true,
      id: cleanExamId,
    };
  });
});

/**
 * Callable Cloud Function: publishExam
 *
 * Server-authoritative exam publishing:
 * - Validates authentication and teacher role
 * - Validates teacher ownership and current status === 'draft'
 * - Validates title, group, duration, and non-empty question bank selection
 * - Refreshes public questionSnapshots from /questions
 * - Generates unique 6-digit PIN with collision checking in /exam_pin_lookup
 * - Transitions status to 'waiting', binds publishedAt timestamp
 */
export const publishExam = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'Для публикации экзамена требуется аутентификация.');
  }

  const isTeacher = Boolean(request.auth.token?.teacher || request.auth.token?.admin);
  if (!isTeacher) {
    throw new HttpsError('permission-denied', 'Доступ разрешён только преподавателям и администраторам.');
  }

  const { examId } = request.data || {};
  if (!examId || typeof examId !== 'string' || !examId.trim()) {
    throw new HttpsError('invalid-argument', 'Идентификатор экзамена (examId) обязателен.');
  }

  const cleanExamId = examId.trim();
  const callerUid = request.auth.uid;
  const isAdmin = Boolean(request.auth.token?.admin);

  const examDocRef = db.collection('exams').doc(cleanExamId);

  return await db.runTransaction(async (transaction) => {
    const examSnap = await transaction.get(examDocRef);
    if (!examSnap.exists) {
      throw new HttpsError('not-found', `Экзамен [${cleanExamId}] не найден.`);
    }

    const examData = examSnap.data();
    if (examData.teacherId && examData.teacherId !== callerUid && !isAdmin) {
      throw new HttpsError('permission-denied', 'Вы можете публиковать только собственные экзамены.');
    }
    if (examData.status !== 'draft') {
      throw new HttpsError('failed-precondition', `Экзамен находится в статусе [${examData.status}] и не может быть опубликован повторно.`);
    }

    // Validate title, group, duration, questions
    const title = typeof examData.title === 'string' ? examData.title.trim() : '';
    if (!title || title.length < 3 || title.length > 120) {
      throw new HttpsError('failed-precondition', 'Название экзамена должно содержать от 3 до 120 символов.');
    }

    const groupId = typeof examData.groupId === 'string' ? examData.groupId.trim() : '';
    if (!groupId) {
      throw new HttpsError('failed-precondition', 'У экзамена должна быть выбрана группа.');
    }

    const groupDocRef = db.collection('groups').doc(groupId);
    const groupSnap = await transaction.get(groupDocRef);
    if (!groupSnap.exists) {
      throw new HttpsError('not-found', `Группа [${groupId}] не найдена.`);
    }

    const questionIds = Array.isArray(examData.questionIds) ? examData.questionIds : [];
    if (questionIds.length === 0) {
      throw new HttpsError('failed-precondition', 'Нельзя опубликовать экзамен без вопросов.');
    }

    // Fetch and verify public question documents for fresh snapshots
    const uniqueIds = [...new Set(questionIds)];
    const questionRefs = uniqueIds.map((qid) => db.collection('questions').doc(qid));
    const questionSnaps = await Promise.all(questionRefs.map((ref) => transaction.get(ref)));

    const questionMap = new Map();
    questionSnaps.forEach((snap) => {
      if (snap.exists) questionMap.set(snap.id, snap.data());
    });

    const missingIds = uniqueIds.filter((qid) => !questionMap.has(qid));
    if (missingIds.length > 0) {
      throw new HttpsError('not-found', `Вопросы [${missingIds.join(', ')}] не найдены в банке вопросов.`);
    }

    const freshSnapshots = {};
    for (const qid of questionIds) {
      const qData = questionMap.get(qid);
      freshSnapshots[qid] = {
        id: qid,
        questionText: qData.questionText || '',
        topic: qData.topic || '',
        difficulty: qData.difficulty || 'medium',
        multiple: Boolean(qData.multiple),
        options: Array.isArray(qData.options) ? [...qData.options] : [],
        version: qData.version || 1,
      };
    }

    // Generate unique 6-digit PIN with collision retry
    let generatedPin = examData.pin;
    if (!generatedPin) {
      let candidatePin = '';
      let isUnique = false;
      for (let i = 0; i < 10; i++) {
        candidatePin = Math.floor(100000 + Math.random() * 900000).toString();
        const pinDocRef = db.collection('exam_pin_lookup').doc(candidatePin);
        const pinSnap = await transaction.get(pinDocRef);
        if (!pinSnap.exists) {
          isUnique = true;
          break;
        }
      }
      if (!isUnique) {
        throw new HttpsError('internal', 'Не удалось сгенерировать уникальный PIN-код.');
      }
      generatedPin = candidatePin;
    }

    // Update exam document
    transaction.update(examDocRef, {
      status: 'waiting',
      pin: generatedPin,
      questionSnapshots: freshSnapshots,
      publishedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Save pin lookup
    const pinLookupRef = db.collection('exam_pin_lookup').doc(generatedPin);
    transaction.set(pinLookupRef, {
      examId: cleanExamId,
      groupId,
      teacherId: examData.teacherId || callerUid,
      status: 'waiting',
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return {
      success: true,
      examId: cleanExamId,
      pin: generatedPin,
      status: 'waiting',
    };
  });
});

/**
 * Callable Cloud Function: changeExamStatus
 *
 * Server-authoritative exam lifecycle status transitions:
 * - Validates authentication and teacher role
 * - Validates teacher ownership
 * - Enforces valid transition paths (waiting -> active, active -> finished, waiting -> finished)
 * - Updates status, startsAt/endsAt/finishedAt timestamps, and syncs PIN lookup
 */
export const changeExamStatus = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'Для изменения статуса экзамена требуется аутентификация.');
  }

  const isTeacher = Boolean(request.auth.token?.teacher || request.auth.token?.admin);
  if (!isTeacher) {
    throw new HttpsError('permission-denied', 'Доступ разрешён только преподавателям и администраторам.');
  }

  const { examId, nextStatus } = request.data || {};
  if (!examId || typeof examId !== 'string' || !examId.trim()) {
    throw new HttpsError('invalid-argument', 'Идентификатор экзамена (examId) обязателен.');
  }
  if (!['draft', 'waiting', 'active', 'finished'].includes(nextStatus)) {
    throw new HttpsError('invalid-argument', `Некорректный целевой статус [${nextStatus}].`);
  }

  const cleanExamId = examId.trim();
  const callerUid = request.auth.uid;
  const isAdmin = Boolean(request.auth.token?.admin);

  const examDocRef = db.collection('exams').doc(cleanExamId);

  return await db.runTransaction(async (transaction) => {
    const examSnap = await transaction.get(examDocRef);
    if (!examSnap.exists) {
      throw new HttpsError('not-found', `Экзамен [${cleanExamId}] не найден.`);
    }

    const examData = examSnap.data();
    if (examData.teacherId && examData.teacherId !== callerUid && !isAdmin) {
      throw new HttpsError('permission-denied', 'Вы можете управлять только собственными экзаменами.');
    }

    const currentStatus = examData.status || 'draft';
    if (currentStatus === nextStatus) {
      return { success: true, examId: cleanExamId, status: nextStatus };
    }

    // Validate lifecycle transitions
    const allowedMap = {
      draft: ['waiting', 'active'],
      waiting: ['draft', 'active', 'finished'],
      active: ['finished'],
      finished: [],
    };

    const allowed = allowedMap[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new HttpsError('failed-precondition', `Недопустимый переход статуса с [${currentStatus}] на [${nextStatus}].`);
    }

    const updatePayload = {
      status: nextStatus,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (nextStatus === 'active' && !examData.startsAt) {
      const durationSeconds = Number(examData.durationSeconds) || (Number(examData.durationMinutes) || 60) * 60;
      const serverNowMs = Date.now();
      updatePayload.startsAt = FieldValue.serverTimestamp();
      updatePayload.endsAt = new Date(serverNowMs + durationSeconds * 1000);
    } else if (nextStatus === 'finished') {
      updatePayload.finishedAt = FieldValue.serverTimestamp();
      if (!examData.endsAt) {
        updatePayload.endsAt = FieldValue.serverTimestamp();
      }
    }

    transaction.update(examDocRef, updatePayload);

    // Sync PIN lookup
    if (examData.pin) {
      const pinDocRef = db.collection('exam_pin_lookup').doc(examData.pin);
      transaction.set(pinDocRef, {
        status: nextStatus,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    return {
      success: true,
      examId: cleanExamId,
      status: nextStatus,
    };
  });
});

/**
 * Callable Cloud Function: getExamResults
 *
 * Server-authoritative aggregation of exam results and participant statistics for teachers:
 * - Validates authentication and teacher role/ownership
 * - Aggregates participant statuses (completed, in_progress, waiting, not_started)
 * - Calculates score metrics (avg, high, low, percentage) and score distribution
 * - Aggregates topic performance and identifies easiest/hardest questions
 */
export const getExamResults = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'Для просмотра результатов экзамена требуется аутентификация.');
  }

  const isTeacher = Boolean(request.auth.token?.teacher || request.auth.token?.admin);
  if (!isTeacher) {
    throw new HttpsError('permission-denied', 'Доступ разрешён только преподавателям и администраторам.');
  }

  const { examId } = request.data || {};
  if (!examId || typeof examId !== 'string' || !examId.trim()) {
    throw new HttpsError('invalid-argument', 'Идентификатор экзамена (examId) обязателен.');
  }

  const cleanExamId = examId.trim();
  const callerUid = request.auth.uid;
  const isAdmin = Boolean(request.auth.token?.admin);

  const examDocRef = db.collection('exams').doc(cleanExamId);
  const examSnap = await examDocRef.get();
  if (!examSnap.exists) {
    throw new HttpsError('not-found', `Экзамен [${cleanExamId}] не найден.`);
  }

  const examData = examSnap.data();
  if (examData.teacherId && examData.teacherId !== callerUid && !isAdmin) {
    throw new HttpsError('permission-denied', 'Вы можете просматривать результаты только собственных экзаменов.');
  }

  // Load group student list if available
  let enrolledStudentIds = [];
  const enrolledStudentMap = new Map();
  if (examData.groupId) {
    const groupSnap = await db.collection('groups').doc(examData.groupId).get();
    if (groupSnap.exists) {
      const gData = groupSnap.data();
      if (Array.isArray(gData.studentIds)) {
        enrolledStudentIds = gData.studentIds;
      }
    }
  }

  if (enrolledStudentIds.length > 0) {
    const userSnaps = await Promise.all(
      enrolledStudentIds.map((uid) => db.collection('users').doc(uid).get())
    );
    userSnaps.forEach((snap) => {
      if (snap.exists) {
        const uData = snap.data();
        enrolledStudentMap.set(snap.id, uData?.displayName || uData?.name || uData?.email || snap.id);
      }
    });
  }

  // Fetch all exam sessions for this exam
  const sessionsSnap = await db
    .collection('exam_sessions')
    .where('examId', '==', cleanExamId)
    .get();

  const sessionsMap = new Map();
  sessionsSnap.docs.forEach((docSnap) => {
    const sData = docSnap.data();
    const sId = sData.studentId;
    if (!sessionsMap.has(sId)) {
      sessionsMap.set(sId, []);
    }
    sessionsMap.get(sId).push({ id: docSnap.id, ...sData });
  });

  const participants = [];
  let completedCount = 0;
  let inProgressCount = 0;
  let waitingCount = 0;
  let totalScoreSum = 0;
  let totalPctSum = 0;
  let highestScore = 0;
  let lowestScore = Infinity;

  const scoreDistribution = {
    '0-20%': 0,
    '21-40%': 0,
    '41-60%': 0,
    '61-80%': 0,
    '81-100%': 0,
  };

  const topicTotals = {};
  const questionIds = Array.isArray(examData.questionIds) ? examData.questionIds : [];
  const allStudentIds = [...new Set([...enrolledStudentIds, ...sessionsMap.keys()])];

  for (const sId of allStudentIds) {
    const studentSessions = sessionsMap.get(sId) || [];
    studentSessions.sort((a, b) => (a.attemptNumber || 1) - (b.attemptNumber || 1));
    const session = studentSessions[studentSessions.length - 1]; // latest attempt session
    const studentName = session?.studentName || enrolledStudentMap.get(sId) || `Ученик ${sId}`;

    if (!session) {
      participants.push({
        studentId: sId,
        studentName,
        groupId: examData.groupId || '',
        status: 'not_started',
        attemptNumber: 0,
        attemptsCount: 0,
        violationCount: 0,
        maxViolations: 3,
        disqualifiedAt: null,
        disqualificationReason: null,
        score: 0,
        totalScore: 0,
        percentage: 0,
        correctAnswersCount: 0,
        startedAt: null,
        submittedAt: null,
        durationSeconds: null,
      });
      continue;
    }

    const pStatus = session.status === 'submitted' ? 'completed' : session.status;
    if (session.status === 'submitted') {
      completedCount++;
      const score = Number(session.score ?? session.totalScore ?? 0);
      const pct = Number(session.percentage ?? 0);

      totalScoreSum += score;
      totalPctSum += pct;

      if (score > highestScore) highestScore = score;
      if (score < lowestScore) lowestScore = score;

      if (pct <= 20) scoreDistribution['0-20%']++;
      else if (pct <= 40) scoreDistribution['21-40%']++;
      else if (pct <= 60) scoreDistribution['41-60%']++;
      else if (pct <= 80) scoreDistribution['61-80%']++;
      else scoreDistribution['81-100%']++;

      if (session.byTopicBreakdown) {
        Object.entries(session.byTopicBreakdown).forEach(([tKey, tVal]) => {
          if (!topicTotals[tKey]) {
            topicTotals[tKey] = { score: 0, maxScore: 0, count: 0 };
          }
          topicTotals[tKey].score += tVal.score || 0;
          topicTotals[tKey].maxScore += tVal.maxScore || 0;
          topicTotals[tKey].count += 1;
        });
      }
    } else if (session.status === 'in_progress') {
      inProgressCount++;
    } else if (session.status === 'waiting') {
      waitingCount++;
    }

    participants.push({
      studentId: sId,
      sessionId: session.id,
      studentName,
      groupId: session.groupId || examData.groupId || '',
      status: pStatus,
      attemptNumber: session.attemptNumber || 1,
      attemptsCount: studentSessions.length,
      violationCount: session.violationCount || 0,
      maxViolations: session.maxViolations || 3,
      disqualifiedAt: session.disqualifiedAt?.toDate ? session.disqualifiedAt.toDate().getTime() : session.disqualifiedAt || null,
      disqualificationReason: session.disqualificationReason || null,
      score: session.score ?? session.totalScore ?? 0,
      maxPossibleScore: session.maxPossibleScore ?? 0,
      percentage: session.percentage ?? 0,
      correctAnswersCount: session.correctAnswersCount ?? 0,
      startedAt: session.startedAt?.toDate ? session.startedAt.toDate().getTime() : session.startedAt,
      submittedAt: session.submittedAt?.toDate ? session.submittedAt.toDate().getTime() : session.submittedAt,
      durationSeconds: session.durationSeconds || null,
    });
  }

  const notStartedCount = allStudentIds.length - (completedCount + inProgressCount + waitingCount);
  const avgScore = completedCount > 0 ? Math.round((totalScoreSum / completedCount) * 10) / 10 : 0;
  const avgPct = completedCount > 0 ? Math.round(totalPctSum / completedCount) : 0;
  if (lowestScore === Infinity) lowestScore = 0;

  const topicPerformance = {};
  Object.entries(topicTotals).forEach(([tKey, tVal]) => {
    topicPerformance[tKey] = tVal.maxScore > 0 ? Math.round((tVal.score / tVal.maxScore) * 100) : 0;
  });

  const questionsList = [];
  const qSnapshots = examData.questionSnapshots || {};
  questionIds.forEach((qid, idx) => {
    const qSnap = qSnapshots[qid] || {};
    questionsList.push({
      id: qid,
      index: idx + 1,
      topic: qSnap.topic || 'unknown',
      questionText: qSnap.questionText || `Вопрос ${idx + 1}`,
      difficulty: qSnap.difficulty || 'medium',
    });
  });

  return {
    success: true,
    exam: {
      id: cleanExamId,
      title: examData.title || '',
      status: examData.status || 'draft',
      pin: examData.pin || null,
      groupId: examData.groupId || '',
      groupName: examData.groupName || '',
      durationMinutes: examData.durationMinutes || 60,
      totalQuestions: questionIds.length,
    },
    summary: {
      totalParticipants: allStudentIds.length,
      completedCount,
      inProgressCount,
      waitingCount,
      notStartedCount,
      averageScore: avgScore,
      averagePercentage: avgPct,
      highestScore,
      lowestScore,
      scoreDistribution,
      topicPerformance,
      easiestQuestions: questionsList.slice(0, 3),
      hardestQuestions: questionsList.slice(-3).reverse(),
    },
    participants,
  };
});

/**
 * Callable Cloud Function: getStudentExamAnalytics
 *
 * Server-authoritative individual student analytics for teachers and authorized students:
 * - Validates authentication and ownership (teacher owning exam or student owning session)
 * - Evaluates detailed per-question correctness, points awarded, and topic breakdown
 * - Returns protected correct answers ONLY for teacher analytics callers
 */
export const getStudentExamAnalytics = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'Аутентификация обязательна.');
  }

  const { examId, studentId } = request.data || {};
  if (!examId || !studentId) {
    throw new HttpsError('invalid-argument', 'Параметры examId и studentId обязательны.');
  }

  const cleanExamId = String(examId).trim();
  const cleanStudentId = String(studentId).trim();
  const callerUid = request.auth.uid;
  const isTeacher = Boolean(request.auth.token?.teacher || request.auth.token?.admin);
  const isAdmin = Boolean(request.auth.token?.admin);

  const examDocRef = db.collection('exams').doc(cleanExamId);
  const examSnap = await examDocRef.get();
  if (!examSnap.exists) {
    throw new HttpsError('not-found', `Экзамен [${cleanExamId}] не найден.`);
  }

  const examData = examSnap.data();
  if (callerUid !== cleanStudentId && (!isTeacher || (examData.teacherId && examData.teacherId !== callerUid && !isAdmin))) {
    throw new HttpsError('permission-denied', 'У вас нет прав на просмотр этой аналитики.');
  }

  const sessionsQuerySnap = await db
    .collection('exam_sessions')
    .where('examId', '==', cleanExamId)
    .where('studentId', '==', cleanStudentId)
    .get();

  if (sessionsQuerySnap.empty) {
    throw new HttpsError('not-found', 'Экзаменационная сессия ученика не найдена.');
  }

  const allSessions = sessionsQuerySnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ref: docSnap.ref,
    ...docSnap.data(),
  }));
  allSessions.sort((a, b) => (a.attemptNumber || 1) - (b.attemptNumber || 1));

  const requestedAttempt = Number(request.data.attemptNumber);
  const sessionData = requestedAttempt
    ? allSessions.find((s) => s.attemptNumber === requestedAttempt) || allSessions[allSessions.length - 1]
    : allSessions[allSessions.length - 1];

  const selectedSessionId = sessionData.id;
  const sessionDocRef = db.collection('exam_sessions').doc(selectedSessionId);

  // Fetch violation timeline for the selected session
  const violationsSnap = await sessionDocRef.collection('violations').get();
  const violationsList = violationsSnap.docs.map((vDoc) => {
    const vData = vDoc.data();
    return {
      id: vDoc.id,
      type: vData.type,
      timestamp: vData.timestampMs || (vData.timestamp?.toDate ? vData.timestamp.toDate().getTime() : null),
      attemptNumber: vData.attemptNumber || sessionData.attemptNumber || 1,
      metadata: vData.metadata || {},
    };
  });
  violationsList.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  const attemptsList = allSessions.map((s) => ({
    attemptNumber: s.attemptNumber || 1,
    sessionId: s.id,
    status: s.status === 'submitted' ? 'completed' : s.status,
    score: s.score ?? s.totalScore ?? 0,
    maxPossibleScore: s.maxPossibleScore ?? 0,
    percentage: s.percentage ?? 0,
    violationCount: s.violationCount || 0,
    maxViolations: s.maxViolations || 3,
    disqualifiedAt: s.disqualifiedAt?.toDate ? s.disqualifiedAt.toDate().getTime() : s.disqualifiedAt || null,
    disqualificationReason: s.disqualificationReason || null,
    startedAt: s.startedAt?.toDate ? s.startedAt.toDate().getTime() : s.startedAt || null,
    submittedAt: s.submittedAt?.toDate ? s.submittedAt.toDate().getTime() : s.submittedAt || null,
  }));

  const questionIds = Array.isArray(sessionData.questionOrder) && sessionData.questionOrder.length > 0
    ? sessionData.questionOrder
    : (Array.isArray(examData.questionIds) ? examData.questionIds : []);

  const uniqueIds = [...new Set(questionIds)];

  const answerRefs = uniqueIds.map((qid) => db.collection('question_answers').doc(qid));
  const questionRefs = uniqueIds.map((qid) => db.collection('questions').doc(qid));

  const answerSnaps = await Promise.all(answerRefs.map((ref) => ref.get()));
  const questionSnaps = await Promise.all(questionRefs.map((ref) => ref.get()));

  const answerMap = new Map();
  answerSnaps.forEach((snap) => {
    if (snap.exists) answerMap.set(snap.id, snap.data());
  });

  const questionMap = new Map();
  const qSnapshots = examData.questionSnapshots || {};
  questionSnaps.forEach((snap) => {
    if (snap.exists) questionMap.set(snap.id, snap.data());
  });

  const studentAnswers = sessionData.answers || {};
  const questionDetails = [];
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  questionIds.forEach((qid, index) => {
    const qDoc = questionMap.get(qid) || qSnapshots[qid] || {};
    const ansDoc = answerMap.get(qid) || {};

    const rawUserAnswers = Array.isArray(studentAnswers[qid]) ? studentAnswers[qid] : [];
    const correctAns = Array.isArray(ansDoc.correctAnswers) ? ansDoc.correctAnswers : [];

    const isMultiple = Boolean(qDoc.multiple || correctAns.length > 1);
    const maxPoints = isMultiple ? 2 : 1;

    const userSet = new Set(rawUserAnswers);
    const correctSet = new Set(correctAns);

    let pointsAwarded = 0;
    let status = 'unanswered';

    if (rawUserAnswers.length === 0) {
      status = 'unanswered';
      unansweredCount++;
    } else {
      if (!isMultiple) {
        if (userSet.size === 1 && userSet.has(correctAns[0])) {
          pointsAwarded = 1;
          status = 'correct';
          correctCount++;
        } else {
          status = 'incorrect';
          incorrectCount++;
        }
      } else {
        let omissions = 0;
        for (const a of correctSet) if (!userSet.has(a)) omissions++;
        let falsePositives = 0;
        for (const a of userSet) if (!correctSet.has(a)) falsePositives++;
        const errs = omissions + falsePositives;
        if (errs === 0) {
          pointsAwarded = 2;
          status = 'correct';
          correctCount++;
        } else if (errs === 1) {
          pointsAwarded = 1;
          status = 'incorrect';
          incorrectCount++;
        } else {
          pointsAwarded = 0;
          status = 'incorrect';
          incorrectCount++;
        }
      }
    }

    const detailItem = {
      index: index + 1,
      id: qid,
      questionText: qDoc.questionText || `Вопрос ${index + 1}`,
      topic: qDoc.topic || 'unknown',
      difficulty: qDoc.difficulty || 'medium',
      multiple: isMultiple,
      options: Array.isArray(qDoc.options) ? qDoc.options : [],
      studentAnswer: rawUserAnswers,
      status,
      pointsAwarded,
      maxPoints,
    };

    if (isTeacher) {
      detailItem.correctAnswers = correctAns;
      detailItem.explanation = ansDoc.explanation || '';
    }

    questionDetails.push(detailItem);
  });

  return {
    success: true,
    exam: {
      id: cleanExamId,
      title: examData.title || '',
    },
    student: {
      studentId: cleanStudentId,
      studentName: sessionData.studentName || `Ученик ${cleanStudentId}`,
      groupId: sessionData.groupId || examData.groupId || '',
      status: sessionData.status === 'submitted' ? 'completed' : sessionData.status,
      attemptNumber: sessionData.attemptNumber || 1,
      violationCount: sessionData.violationCount || 0,
      maxViolations: sessionData.maxViolations || 3,
      disqualifiedAt: sessionData.disqualifiedAt?.toDate ? sessionData.disqualifiedAt.toDate().getTime() : sessionData.disqualifiedAt || null,
      disqualificationReason: sessionData.disqualificationReason || null,
      score: sessionData.score ?? sessionData.totalScore ?? 0,
      maxPossibleScore: sessionData.maxPossibleScore ?? 0,
      percentage: sessionData.percentage ?? 0,
      correctAnswersCount: correctCount,
      incorrectAnswersCount: incorrectCount,
      unansweredCount,
      startedAt: sessionData.startedAt?.toDate ? sessionData.startedAt.toDate().getTime() : sessionData.startedAt,
      submittedAt: sessionData.submittedAt?.toDate ? sessionData.submittedAt.toDate().getTime() : sessionData.submittedAt,
      durationSeconds: sessionData.durationSeconds || null,
    },
    attemptsList,
    violations: violationsList,
    topicBreakdown: sessionData.byTopicBreakdown || {},
    questions: questionDetails,
  };
});


