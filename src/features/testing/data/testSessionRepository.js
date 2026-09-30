import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db as defaultDb } from '@infrastructure/firebase/firestore';
import { documentToSession, sessionToDocument } from './testSessionMappers';

export function createTestSessionRepository(firestore = defaultDb) {
  const collectionName = 'test_sessions';

  async function startSession(session) {
    if (!session || !session.id || !session.userId) {
      throw new Error('Некорректный объект сессии для запуска.');
    }

    const sessionsRef = collection(firestore, collectionName);
    const existingActiveQuery = query(
      sessionsRef,
      where('userId', '==', session.userId),
      where('status', '==', 'in_progress')
    );

    const existingSnap = await getDocs(existingActiveQuery);
    const batch = writeBatch(firestore);

    // Abandon any existing in_progress sessions for this user
    for (const docSnap of existingSnap.docs) {
      batch.update(docSnap.ref, {
        status: 'abandoned',
        updatedAt: serverTimestamp(),
      });
    }

    // Create the new session
    const newDocRef = doc(firestore, collectionName, session.id);
    const docData = sessionToDocument(session, {
      startedAtTimestamp: Timestamp.fromMillis(session.startedAt),
      updatedAtTimestamp: serverTimestamp(),
    });

    batch.set(newDocRef, docData);
    await batch.commit();

    return session;
  }

  async function getSessionById(id) {
    if (!id || typeof id !== 'string' || !id.trim()) {
      return null;
    }

    const docRef = doc(firestore, collectionName, id.trim());
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return documentToSession(snapshot.id, snapshot.data());
  }

  async function getActiveSession(userId) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return null;
    }

    const sessionsRef = collection(firestore, collectionName);
    const q = query(
      sessionsRef,
      where('userId', '==', userId.trim()),
      where('status', '==', 'in_progress')
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const sessions = snapshot.docs.map((docSnap) =>
      documentToSession(docSnap.id, docSnap.data())
    );

    // Pick latest by startedAt in memory without requiring composite index
    sessions.sort((a, b) => b.startedAt - a.startedAt);
    return sessions[0] || null;
  }

  async function saveProgress(session) {
    if (!session || !session.id) {
      throw new Error('Не указан идентификатор сессии для сохранения.');
    }

    const docRef = doc(firestore, collectionName, session.id);
    await updateDoc(docRef, {
      answers: session.answers || {},
      flagged: session.flagged || [],
      currentIndex: session.currentIndex ?? 0,
      updatedAt: serverTimestamp(),
    });
  }

  async function finishSession(session, options = {}) {
    if (!session || !session.id) {
      throw new Error('Не указан идентификатор сессии для завершения.');
    }

    const docRef = doc(firestore, collectionName, session.id);
    const finishedAtMs =
      typeof session.finishedAt === 'number' ? session.finishedAt : Date.now();

    const score = options.score || session.score || null;
    const questionSnapshots =
      options.questionSnapshots || session.questionSnapshots || null;

    const payload = {
      status: 'completed',
      finishedAt: Timestamp.fromMillis(finishedAtMs),
      updatedAt: serverTimestamp(),
      ...(score ? { score } : {}),
      ...(questionSnapshots ? { questionSnapshots } : {}),
    };

    await updateDoc(docRef, payload);
  }

  async function abandonSession(session) {
    if (!session || !session.id) {
      throw new Error('Не указан идентификатор сессии для отмены.');
    }

    const docRef = doc(firestore, collectionName, session.id);
    await updateDoc(docRef, {
      status: 'abandoned',
      updatedAt: serverTimestamp(),
    });
  }

  return {
    startSession,
    getSessionById,
    getActiveSession,
    saveProgress,
    finishSession,
    abandonSession,
  };
}

export const testSessionRepository = createTestSessionRepository();
