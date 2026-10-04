/**
 * Converts a Firestore timestamp or number/Date to epoch milliseconds.
 *
 * @param {*} val
 * @returns {number|null}
 */
function toEpochMs(val) {
  if (!val) return null;
  if (typeof val === 'number') return val;
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (val instanceof Date) return val.getTime();
  return null;
}

/**
 * Maps a Firestore document to an Exam domain object.
 *
 * @param {string} id
 * @param {object} data
 * @returns {object|null}
 */
export function documentToExam(id, data) {
  if (!id || !data || typeof data !== 'object') {
    return null;
  }

  return Object.freeze({
    id,
    title: data.title || '',
    description: data.description || '',
    teacherId: data.teacherId || '',
    groupId: data.groupId || '',
    groupName: data.groupName || '',
    questionIds: Array.isArray(data.questionIds) ? [...data.questionIds] : [],
    questionSnapshots: data.questionSnapshots && typeof data.questionSnapshots === 'object' ? { ...data.questionSnapshots } : {},
    totalQuestions: data.totalQuestions || (Array.isArray(data.questionIds) ? data.questionIds.length : 0),
    durationMinutes: Number(data.durationMinutes) || 60,
    durationSeconds: Number(data.durationSeconds) || (Number(data.durationMinutes) || 60) * 60,
    pin: data.pin ? String(data.pin) : null,
    status: data.status || 'draft',
    startsAt: toEpochMs(data.startsAt),
    endsAt: toEpochMs(data.endsAt),
    finishedAt: toEpochMs(data.finishedAt),
    createdAt: toEpochMs(data.createdAt) || Date.now(),
    updatedAt: toEpochMs(data.updatedAt) || Date.now(),
  });
}

/**
 * Maps an Exam domain object to a Firestore document structure.
 *
 * @param {object} exam
 * @returns {object}
 */
export function examToDocument(exam) {
  if (!exam || typeof exam !== 'object') {
    throw new Error('Объект экзамена обязателен для маппинга.');
  }

  return {
    title: exam.title || '',
    description: exam.description || '',
    teacherId: exam.teacherId || '',
    groupId: exam.groupId || '',
    groupName: exam.groupName || '',
    questionIds: Array.isArray(exam.questionIds) ? exam.questionIds : [],
    questionSnapshots: exam.questionSnapshots && typeof exam.questionSnapshots === 'object' ? { ...exam.questionSnapshots } : {},
    totalQuestions: exam.totalQuestions || 0,
    durationMinutes: exam.durationMinutes || 60,
    durationSeconds: exam.durationSeconds || 3600,
    pin: exam.pin || null,
    status: exam.status || 'draft',
    startsAt: exam.startsAt || null,
    endsAt: exam.endsAt || null,
    finishedAt: exam.finishedAt || null,
    createdAt: exam.createdAt || Date.now(),
    updatedAt: exam.updatedAt || Date.now(),
  };
}

/**
 * Maps a Firestore document to an ExamSession domain object.
 *
 * @param {string} id
 * @param {object} data
 * @returns {object|null}
 */
export function documentToExamSession(id, data) {
  if (!id || !data || typeof data !== 'object') {
    return null;
  }

  return Object.freeze({
    id,
    examId: data.examId || '',
    studentId: data.studentId || '',
    studentName: data.studentName || '',
    groupId: data.groupId || '',
    questionOrder: Array.isArray(data.questionOrder) ? [...data.questionOrder] : [],
    status: data.status || 'waiting',
    durationSeconds: Number(data.durationSeconds) || 3600,
    startedAt: toEpochMs(data.startedAt),
    expiresAt: toEpochMs(data.expiresAt),
    submittedAt: toEpochMs(data.submittedAt),
    answers: data.answers && typeof data.answers === 'object' ? data.answers : {},
    flagged: Array.isArray(data.flagged) ? [...data.flagged] : [],
    currentIndex: Number(data.currentIndex) || 0,
    score: data.score || null,
    correctAnswersCount: typeof data.correctAnswersCount === 'number' ? data.correctAnswersCount : null,
    totalScore: typeof data.totalScore === 'number' ? data.totalScore : null,
    maxPossibleScore: typeof data.maxPossibleScore === 'number' ? data.maxPossibleScore : null,
    percentage: typeof data.percentage === 'number' ? data.percentage : null,
    createdAt: toEpochMs(data.createdAt) || Date.now(),
    updatedAt: toEpochMs(data.updatedAt) || Date.now(),
  });
}

/**
 * Maps an ExamSession domain object to a Firestore document structure.
 *
 * @param {object} session
 * @returns {object}
 */
export function examSessionToDocument(session) {
  if (!session || typeof session !== 'object') {
    throw new Error('Объект сессии экзамена обязателен для маппинга.');
  }

  const docData = {
    examId: session.examId || '',
    studentId: session.studentId || '',
    studentName: session.studentName || '',
    groupId: session.groupId || '',
    questionOrder: Array.isArray(session.questionOrder) ? session.questionOrder : [],
    status: session.status || 'waiting',
    durationSeconds: session.durationSeconds || 3600,
    startedAt: session.startedAt || null,
    expiresAt: session.expiresAt || null,
    submittedAt: session.submittedAt || null,
    answers: session.answers || {},
    flagged: session.flagged || [],
    currentIndex: session.currentIndex || 0,
    createdAt: session.createdAt || Date.now(),
    updatedAt: session.updatedAt || Date.now(),
  };

  if (session.score !== undefined && session.score !== null) {
    docData.score = session.score;
  }
  if (session.correctAnswersCount !== undefined && session.correctAnswersCount !== null) {
    docData.correctAnswersCount = session.correctAnswersCount;
  }
  if (session.totalScore !== undefined && session.totalScore !== null) {
    docData.totalScore = session.totalScore;
  }
  if (session.maxPossibleScore !== undefined && session.maxPossibleScore !== null) {
    docData.maxPossibleScore = session.maxPossibleScore;
  }
  if (session.percentage !== undefined && session.percentage !== null) {
    docData.percentage = session.percentage;
  }

  return docData;
}
