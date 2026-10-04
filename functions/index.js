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

    const examDocRef = db.collection('exams').doc(cleanExamId);
    const examSnap = await transaction.get(examDocRef);

    if (!examSnap.exists) {
      throw new HttpsError('not-found', `Экзамен [${cleanExamId}] не найден.`);
    }

    const examData = examSnap.data();

    if (sessionSnap.exists) {
      const data = sessionSnap.data();

      // If existing session is in 'waiting' state and exam has been activated, transition to 'in_progress'
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
          id: sessionId,
          examId: cleanExamId,
          studentId,
          ...data,
          status: 'in_progress',
          startedAt,
          expiresAt,
        };
      }

      return {
        id: sessionId,
        examId: cleanExamId,
        studentId,
        ...data,
      };
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

