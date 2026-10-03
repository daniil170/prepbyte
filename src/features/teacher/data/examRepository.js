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
  updateExamSessionAnswer,
} from '../domain/examSession';
import { submitExamSessionService } from './submitExamSessionService';

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
  const pinLookupCollection = 'exam_pin_lookup';
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
   * Finds an active or waiting exam by its 6-digit PIN using secure lookup.
   */
  async function findExamByPin(pin) {
    if (!pin) return null;
    const cleanPin = String(pin).trim();

    try {
      const pinDocRef = doc(firestore, pinLookupCollection, cleanPin);
      const pinSnap = await getDoc(pinDocRef);
      if (pinSnap.exists()) {
        const lookupData = pinSnap.data();
        if (lookupData?.examId) {
          const exam = await getExamById(lookupData.examId);
          if (exam) return exam;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Creates a new exam in Firestore and indexes PIN lookup.
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

    // Save pin lookup
    if (examEntity.pin) {
      try {
        const pinDocRef = doc(firestore, pinLookupCollection, examEntity.pin);
        await setDoc(pinDocRef, {
          examId,
          groupId: groupId.trim(),
          teacherId: teacherId.trim(),
          status: EXAM_STATUS.DRAFT,
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Safe fallback
      }
    }

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

    // Update PIN lookup
    if (exam.pin) {
      try {
        const pinDocRef = doc(firestore, pinLookupCollection, exam.pin);
        await setDoc(
          pinDocRef,
          {
            examId,
            groupId: exam.groupId,
            teacherId: exam.teacherId,
            status: updated.status,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch {
        // Safe fallback
      }
    }

    return updated;
  }

  /**
   * Deletes a draft exam.
   */
  async function deleteExam(examId) {
    if (!examId) return;
    const exam = await getExamById(examId);
    const docRef = doc(firestore, examsCollection, examId.trim());
    await deleteDoc(docRef);

    if (exam?.pin) {
      try {
        const pinDocRef = doc(firestore, pinLookupCollection, exam.pin);
        await deleteDoc(pinDocRef);
      } catch {
        // Safe fallback
      }
    }
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
   * Gets or creates a student exam session with persistent questionOrder.
   */
  async function getOrCreateExamSession({
    examId,
    studentId,
    studentName = '',
    groupId,
    questionIds = [],
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
      questionIds,
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
   * Submits a student exam session via the secure server-authoritative service.
   * Calculates score from protected answer bank and writes immutable results.
   */
  async function submitSession(sessionId, answers = {}, authUser = null) {
    if (!sessionId) return null;
    const effectiveAuth = authUser?.uid
      ? authUser
      : { uid: sessionId.split('_')[1] || '' };

    return submitExamSessionService(firestore, effectiveAuth, {
      sessionId: sessionId.trim(),
      answers,
    });
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
