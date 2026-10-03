import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db as defaultDb } from '@infrastructure/firebase/firestore';
import { createUserProfile } from '../domain/userProfile';

function parseTimestamp(ts) {
  if (ts === null || ts === undefined) {
    return Date.now();
  }
  if (typeof ts === 'number' && !Number.isNaN(ts)) {
    return ts;
  }
  if (typeof ts.toMillis === 'function') {
    return ts.toMillis();
  }
  if (typeof ts.seconds === 'number') {
    return ts.seconds * 1000 + Math.round((ts.nanoseconds || 0) / 1000000);
  }
  return Date.now();
}

export function documentToUserProfile(id, data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  return createUserProfile({
    uid: id,
    email: data.email || '',
    displayName: data.displayName || null,
    role: data.role || 'student',
    teacherId: data.teacherId || null,
    groupIds: Array.isArray(data.groupIds) ? data.groupIds : [],
    school: data.school || null,
    grade: typeof data.grade === 'number' ? data.grade : null,
    createdAt: parseTimestamp(data.createdAt),
    updatedAt: parseTimestamp(data.updatedAt),
  });
}

export function userProfileToDocument(profile, { serverUpdated = true } = {}) {
  return {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.displayName,
    role: profile.role,
    teacherId: profile.teacherId,
    groupIds: profile.groupIds,
    school: profile.school,
    grade: profile.grade,
    createdAt: profile.createdAt,
    updatedAt: serverUpdated ? serverTimestamp() : profile.updatedAt,
  };
}

export function createUserProfileRepository(firestore = defaultDb) {
  const collectionName = 'users';

  async function getUserProfile(uid) {
    if (!uid || typeof uid !== 'string' || !uid.trim()) {
      return null;
    }

    const docRef = doc(firestore, collectionName, uid.trim());
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return documentToUserProfile(snapshot.id, snapshot.data());
  }

  async function ensureUserProfile(authUser) {
    if (!authUser || !authUser.id) {
      throw new Error('Некорректный пользователь для инициализации профиля.');
    }

    const uid = authUser.id || authUser.uid;
    const docRef = doc(firestore, collectionName, uid);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      return documentToUserProfile(snapshot.id, snapshot.data());
    }

    const initialProfile = createUserProfile({
      uid,
      email: authUser.email || '',
      displayName:
        authUser.displayName || (authUser.email ? authUser.email.split('@')[0] : 'Ученик'),
      role: authUser.role || (authUser.isAdmin ? 'admin' : authUser.isTeacher ? 'teacher' : 'student'),
      teacherId: null,
      groupIds: [],
      school: null,
      grade: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const docData = userProfileToDocument(initialProfile);
    await setDoc(docRef, docData);

    return initialProfile;
  }

  async function updateUserProfile(uid, updates = {}) {
    if (!uid || typeof uid !== 'string') {
      throw new Error('Не указан идентификатор пользователя для обновления.');
    }

    const docRef = doc(firestore, collectionName, uid.trim());
    const allowedPayload = {
      updatedAt: serverTimestamp(),
    };

    if (updates.displayName !== undefined) {
      allowedPayload.displayName = updates.displayName ? String(updates.displayName).trim() : null;
    }
    if (updates.school !== undefined) {
      allowedPayload.school = updates.school ? String(updates.school).trim() : null;
    }
    if (updates.grade !== undefined) {
      allowedPayload.grade =
        typeof updates.grade === 'number' && Number.isInteger(updates.grade)
          ? updates.grade
          : null;
    }

    await updateDoc(docRef, allowedPayload);
  }

  async function assignStudentToGroup(studentId, { teacherId, groupId }) {
    if (!studentId || !groupId) {
      throw new Error('studentId и groupId обязательны для прикрепления.');
    }

    const docRef = doc(firestore, collectionName, studentId.trim());
    const payload = {
      groupIds: arrayUnion(groupId.trim()),
      updatedAt: serverTimestamp(),
    };

    if (teacherId) {
      payload.teacherId = teacherId.trim();
    }

    await updateDoc(docRef, payload);
  }

  async function removeStudentFromGroup(studentId, groupId, { clearTeacher = false } = {}) {
    if (!studentId || !groupId) {
      throw new Error('studentId и groupId обязательны для открепления.');
    }

    const docRef = doc(firestore, collectionName, studentId.trim());
    const payload = {
      groupIds: arrayRemove(groupId.trim()),
      updatedAt: serverTimestamp(),
    };

    if (clearTeacher) {
      payload.teacherId = null;
    }

    await updateDoc(docRef, payload);
  }

  async function findStudentsByEmailOrId(searchQuery) {
    if (!searchQuery || typeof searchQuery !== 'string' || !searchQuery.trim()) {
      return [];
    }

    const clean = searchQuery.trim().toLowerCase();
    const usersRef = collection(firestore, collectionName);

    // 1. If it looks like email, search by exact email
    if (clean.includes('@')) {
      const q = query(usersRef, where('email', '==', clean), limit(5));
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => documentToUserProfile(d.id, d.data()))
        .filter((p) => p && p.role === 'student');
    }

    // 2. Otherwise try direct document ID lookup
    const directDocRef = doc(firestore, collectionName, clean);
    const directSnap = await getDoc(directDocRef);
    if (directSnap.exists()) {
      const profile = documentToUserProfile(directSnap.id, directSnap.data());
      if (profile && profile.role === 'student') {
        return [profile];
      }
    }

    return [];
  }

  return {
    getUserProfile,
    ensureUserProfile,
    updateUserProfile,
    assignStudentToGroup,
    removeStudentFromGroup,
    findStudentsByEmailOrId,
  };
}

export const userProfileRepository = createUserProfileRepository();
