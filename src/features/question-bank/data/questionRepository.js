import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db as defaultDb } from '@infrastructure/firebase/firestore';
import { documentToQuestion } from './questionMappers';

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

  return {
    getQuestionById,
    getQuestionsByTopics,
    getAllQuestions,
  };
}

export const questionRepository = createQuestionRepository();
