import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db as defaultDb } from '@infrastructure/firebase/firestore';
import {
  documentToExam,
  documentToExamSession,
  examSessionToDocument,
  examToDocument,
} from './examMappers';
import { createExam } from '../domain/exam';
import {
  EXAM_STATUS,
  transitionExamStatus,
} from '../domain/examLifecycle';
import {
  createExamSession,
  submitExamSession,
  updateExamSessionAnswer,
} from '../domain/examSession';

function generateId(prefix = 'exam') {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createExamRepository(firestore = defaultDb) {
  const examsCollection = 'exams';
  const sessionsCollection = 'exam_sessions';

  /**
   * Fetches all exams belonging to a teacher.
   */
  async function getTeacherExams(teacherId) {
    if (!teacherId || typeof teacherId !== 'string') {
      return [];
    }
    const q = query(
      collection(firestore, examsCollection),
      where('teacherId', '==', teacherId.trim())
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];

    const exams = snapshot.docs
      .map((d) => documentToExam(d.id, d.data()))
      .filter(Boolean);

    exams.sort((a, b) => b.createdAt - a.createdAt);
    return exams;
  }

  /**
   * Fetches a single exam by ID.
   */
  async function getExamById(examId) {
    if (!examId || typeof examId !== 'string') return null;
    const docRef = doc(firestore, examsCollection, examId.trim());
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return documentToExam(snapshot.id, snapshot.data());
  }

  /**
   * Finds an active or waiting exam by its 6-digit PIN.
   */
  async function findExamByPin(pin) {
    if (!pin) return null;
    const cleanPin = String(pin).trim();
    const q = query(
      collection(firestore, examsCollection),
      where('pin', '==', cleanPin)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    // Filter by active/waiting if multiple exist
    const exams = snapshot.docs
      .map((d) => documentToExam(d.id, d.data()))
      .filter(Boolean);

    const validExam = exams.find(
      (e) => e.status === EXAM_STATUS.WAITING || e.status === EXAM_STATUS.ACTIVE
    );
    return validExam || exams[0] || null;
  }

  /**
   * Creates a new exam in Firestore.
   */
  async function createNewExam({
    title,
    description = '',
    teacherId,
    groupId,
    groupName = '',
    questionIds = [],
    durationMinutes = 60,
  }) {
    const examId = generateId('exam');
    const examEntity = createExam({
      id: examId,
      title,
      description,
      teacherId,
      groupId,
      groupName,
      questionIds,
      durationMinutes,
      status: EXAM_STATUS.DRAFT,
      now: Date.now,
    });

    const docRef = doc(firestore, examsCollection, examId);
    const docData = {
      ...examToDocument(examEntity),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, docData);
    return examEntity;
  }

  /**
   * Transitions an exam to a new status.
   */
  async function updateExamStatus(examId, nextStatus) {
    const exam = await getExamById(examId);
    if (!exam) {
      throw new Error(`Экзамен с id ${examId} не найден.`);
    }

    const updated = transitionExamStatus(exam, nextStatus);
    const docRef = doc(firestore, examsCollection, examId);

    const patch = {
      status: updated.status,
      updatedAt: serverTimestamp(),
    };
    if (updated.startsAt) patch.startsAt = updated.startsAt;
    if (updated.endsAt) patch.endsAt = updated.endsAt;
    if (updated.finishedAt) patch.finishedAt = updated.finishedAt;

    await updateDoc(docRef, patch);
    return updated;
  }

  /**
   * Deletes a draft exam.
   */
  async function deleteExam(examId) {
    if (!examId) return;
    const docRef = doc(firestore, examsCollection, examId.trim());
    await deleteDoc(docRef);
  }

  /**
   * Subscribes to realtime updates of an exam.
   */
  function subscribeToExam(examId, onUpdate, onError) {
    if (!examId) return () => {};
    const docRef = doc(firestore, examsCollection, examId.trim());
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onUpdate(null);
        } else {
          onUpdate(documentToExam(snapshot.id, snapshot.data()));
        }
      },
      onError
    );
  }

  /**
   * Subscribes to realtime updates of all student sessions for an exam.
   */
  function subscribeToExamSessions(examId, onUpdate, onError) {
    if (!examId) return () => {};
    const q = query(
      collection(firestore, sessionsCollection),
      where('examId', '==', examId.trim())
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const sessions = snapshot.docs
          .map((d) => documentToExamSession(d.id, d.data()))
          .filter(Boolean);
        onUpdate(sessions);
      },
      onError
    );
  }

  /**
   * Gets or creates a student exam session.
   */
  async function getOrCreateExamSession({
    examId,
    studentId,
    studentName = '',
    groupId,
    durationSeconds = 3600,
    examStatus = EXAM_STATUS.WAITING,
  }) {
    const sessionId = `${examId.trim()}_${studentId.trim()}`;
    const docRef = doc(firestore, sessionsCollection, sessionId);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      return documentToExamSession(snapshot.id, snapshot.data());
    }

    const initialStatus =
      examStatus === EXAM_STATUS.ACTIVE ? 'in_progress' : 'waiting';

    const sessionEntity = createExamSession({
      id: sessionId,
      examId: examId.trim(),
      studentId: studentId.trim(),
      studentName,
      groupId: groupId.trim(),
      durationSeconds,
      status: initialStatus,
      now: Date.now,
    });

    const docData = {
      ...examSessionToDocument(sessionEntity),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, docData);
    return sessionEntity;
  }

  /**
   * Subscribes to realtime updates of a specific student session.
   */
  function subscribeToStudentSession(sessionId, onUpdate, onError) {
    if (!sessionId) return () => {};
    const docRef = doc(firestore, sessionsCollection, sessionId.trim());
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onUpdate(null);
        } else {
          onUpdate(documentToExamSession(snapshot.id, snapshot.data()));
        }
      },
      onError
    );
  }

  /**
   * Saves student answer choice to the session.
   */
  async function saveStudentAnswer(sessionId, questionId, optionIndices) {
    const docRef = doc(firestore, sessionsCollection, sessionId.trim());
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return;

    const currentSession = documentToExamSession(snapshot.id, snapshot.data());
    const updated = updateExamSessionAnswer(
      currentSession,
      questionId,
      optionIndices
    );

    await updateDoc(docRef, {
      [`answers.${questionId}`]: updated.answers[questionId] || [],
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Submits a student exam session, calculates scores, and freezes.
   */
  async function submitSession(sessionId, questions = []) {
    const docRef = doc(firestore, sessionsCollection, sessionId.trim());
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;

    const currentSession = documentToExamSession(snapshot.id, snapshot.data());
    const evaluated = submitExamSession(currentSession, questions);

    const patch = {
      status: 'submitted',
      submittedAt: serverTimestamp(),
      score: evaluated.score,
      totalScore: evaluated.totalScore,
      maxPossibleScore: evaluated.maxPossibleScore,
      percentage: evaluated.percentage,
      correctAnswersCount: evaluated.correctAnswersCount,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(docRef, patch);
    return evaluated;
  }

  return {
    getTeacherExams,
    getExamById,
    findExamByPin,
    createNewExam,
    updateExamStatus,
    deleteExam,
    subscribeToExam,
    subscribeToExamSessions,
    getOrCreateExamSession,
    subscribeToStudentSession,
    saveStudentAnswer,
    submitSession,
  };
}

export const examRepository = createExamRepository();
