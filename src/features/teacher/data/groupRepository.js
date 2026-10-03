import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db as defaultDb } from '@infrastructure/firebase/firestore';
import { documentToGroup } from './groupMappers';
import { validateGroupName } from '../domain/group';

function generateGroupId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `grp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createGroupRepository(firestore = defaultDb) {
  const collectionName = 'groups';

  async function getTeacherGroups(teacherId) {
    if (!teacherId || typeof teacherId !== 'string' || !teacherId.trim()) {
      return [];
    }

    const groupsRef = collection(firestore, collectionName);
    const q = query(groupsRef, where('teacherId', '==', teacherId.trim()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    const groups = snapshot.docs
      .map((d) => documentToGroup(d.id, d.data()))
      .filter(Boolean);

    // Sort by creation time descending
    groups.sort((a, b) => b.createdAt - a.createdAt);
    return groups;
  }

  async function getGroupById(groupId) {
    if (!groupId || typeof groupId !== 'string' || !groupId.trim()) {
      return null;
    }

    const docRef = doc(firestore, collectionName, groupId.trim());
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return documentToGroup(snapshot.id, snapshot.data());
  }

  async function createGroup({ name, teacherId }) {
    const validation = validateGroupName(name);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    if (!teacherId || typeof teacherId !== 'string') {
      throw new Error('teacherId обязателен для создания группы.');
    }

    const groupId = generateGroupId();
    const docRef = doc(firestore, collectionName, groupId);

    const data = {
      name: name.trim(),
      teacherId: teacherId.trim(),
      studentIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, data);

    return {
      id: groupId,
      name: name.trim(),
      teacherId: teacherId.trim(),
      studentIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  async function renameGroup(groupId, newName) {
    const validation = validateGroupName(newName);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const docRef = doc(firestore, collectionName, groupId.trim());
    await updateDoc(docRef, {
      name: newName.trim(),
      updatedAt: serverTimestamp(),
    });
  }

  async function addStudent(groupId, studentId) {
    if (!groupId || !studentId) {
      throw new Error('groupId и studentId обязательны.');
    }

    const docRef = doc(firestore, collectionName, groupId.trim());
    await updateDoc(docRef, {
      studentIds: arrayUnion(studentId.trim()),
      updatedAt: serverTimestamp(),
    });
  }

  async function removeStudent(groupId, studentId) {
    if (!groupId || !studentId) {
      throw new Error('groupId и studentId обязательны.');
    }

    const docRef = doc(firestore, collectionName, groupId.trim());
    await updateDoc(docRef, {
      studentIds: arrayRemove(studentId.trim()),
      updatedAt: serverTimestamp(),
    });
  }

  async function deleteGroup(groupId) {
    if (!groupId || typeof groupId !== 'string') {
      throw new Error('groupId обязателен для удаления.');
    }

    const docRef = doc(firestore, collectionName, groupId.trim());
    await deleteDoc(docRef);
  }

  return {
    getTeacherGroups,
    getGroupById,
    createGroup,
    renameGroup,
    addStudent,
    removeStudent,
    deleteGroup,
  };
}

export const groupRepository = createGroupRepository();
