import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db as defaultDb } from '@infrastructure/firebase/firestore';
import { chunk } from '@shared/lib/chunk';
import { documentToQuestion } from './questionMappers';
import { orderQuestionsByIds } from './questionOrdering';

export function createQuestionRepository(firestore = defaultDb) {
  const collectionName = 'questions';

  async function getQuestionById(id) {
    if (!id || typeof id !== 'string' || !id.trim()) {
      return null;
    }

    const docRef = doc(firestore, collectionName, id.trim());
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return documentToQuestion(snapshot.id, snapshot.data());
  }

  async function getQuestionsByTopics(topicIds) {
    if (!Array.isArray(topicIds) || topicIds.length === 0) {
      throw new Error('Параметр topicIds должен быть непустым массивом.');
    }

    if (topicIds.length > 30) {
      throw new Error(
        `Запрос Firestore "in" поддерживает максимум 30 тем, получено: ${topicIds.length}.`
      );
    }

    const questionsRef = collection(firestore, collectionName);
    const q = query(questionsRef, where('topic', 'in', topicIds));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) =>
      documentToQuestion(docSnap.id, docSnap.data())
    );
  }

  async function getAllQuestions() {
    const questionsRef = collection(firestore, collectionName);
    const snapshot = await getDocs(questionsRef);

    return snapshot.docs.map((docSnap) =>
      documentToQuestion(docSnap.id, docSnap.data())
    );
  }

  async function getQuestionsByIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return [];
    }

    const uniqueIds = [...new Set(ids)];
    const chunks = chunk(uniqueIds, 30);
    const questionsRef = collection(firestore, collectionName);

    const chunkResults = await Promise.all(
      chunks.map(async (idChunk) => {
        const q = query(questionsRef, where(documentId(), 'in', idChunk));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((docSnap) =>
          documentToQuestion(docSnap.id, docSnap.data())
        );
      })
    );

    const foundQuestions = chunkResults.flat();
    return orderQuestionsByIds(foundQuestions, ids);
  }

  return {
    getQuestionById,
    getQuestionsByIds,
    getQuestionsByTopics,
    getAllQuestions,
  };
}

export const questionRepository = createQuestionRepository();
