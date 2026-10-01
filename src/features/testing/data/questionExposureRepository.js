import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db as defaultDb } from '@infrastructure/firebase/firestore';
import {
  documentToExposure,
  exposureToDocument,
} from './questionExposureMappers';

export function createQuestionExposureRepository(firestore = defaultDb) {
  const collectionName = 'question_exposure';

  /**
   * Retrieves the question exposure state for a given user.
   *
   * @param {string} userId - Authenticated user UID.
   * @returns {Promise<Record<string, { timesSeen: number, lastSeenAt: number }>|null>}
   */
  async function getExposure(userId) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return null;
    }

    const docRef = doc(firestore, collectionName, userId.trim());
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return documentToExposure(snapshot.id, snapshot.data());
  }

  /**
   * Saves or overwrites the question exposure state for a user.
   *
   * @param {string} userId - Authenticated user UID.
   * @param {Record<string, { timesSeen: number, lastSeenAt: number }>} exposure
   * @returns {Promise<void>}
   */
  async function saveExposure(userId, exposure) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw new Error('userId обязателен для сохранения экспозиции.');
    }

    const docRef = doc(firestore, collectionName, userId.trim());
    const payload = exposureToDocument(userId.trim(), exposure, {
      updatedAtTimestamp: serverTimestamp(),
    });

    await setDoc(docRef, payload);
  }

  return {
    getExposure,
    saveExposure,
  };
}

export const questionExposureRepository = createQuestionExposureRepository();
