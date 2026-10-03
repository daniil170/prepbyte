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
import { analyticsRepository as defaultAnalyticsRepo } from '@features/analytics';
import { groupRepository as defaultGroupRepo } from './groupRepository';
import { calculateTeacherOverview } from '../domain/teacherOverview';
import { enrichStudentSummary } from '../domain/studentProfile';

function parseTimestamp(ts) {
  if (ts === null || ts === undefined) return Date.now();
  if (typeof ts === 'number' && !Number.isNaN(ts)) return ts;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.seconds === 'number') {
    return ts.seconds * 1000 + Math.round((ts.nanoseconds || 0) / 1000000);
  }
  return Date.now();
}

function documentToStudentProfile(id, data) {
  if (!data || typeof data !== 'object') return null;
  return {
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
  };
}

export function createTeacherStudentRepository(
  firestore = defaultDb,
  groupRepo = defaultGroupRepo,
  analyticsRepo = defaultAnalyticsRepo
) {
  const usersCollectionName = 'users';

  /**
   * Retrieves all students belonging to the teacher's groups or assigned directly.
   *
   * @param {string} teacherId
   * @returns {Promise<{ students: Array<object>, groups: Array<object> }>}
   */
  async function getTeacherStudentsAndGroups(teacherId) {
    if (!teacherId || typeof teacherId !== 'string') {
      return { students: [], groups: [] };
    }

    const cleanTeacherId = teacherId.trim();

    // 1. Fetch all groups owned by this teacher
    const groups = await groupRepo.getTeacherGroups(cleanTeacherId);

    // 2. Collect all student UIDs from the teacher's groups
    const studentIdsSet = new Set();
    for (const g of groups) {
      if (Array.isArray(g.studentIds)) {
        for (const sId of g.studentIds) {
          if (sId) studentIdsSet.add(sId);
        }
      }
    }

    // 3. Query students directly assigned via teacherId in users collection
    const usersRef = collection(firestore, usersCollectionName);
    const assignedQuery = query(
      usersRef,
      where('teacherId', '==', cleanTeacherId)
    );
    const assignedSnap = await getDocs(assignedQuery);

    const directStudents = [];
    for (const docSnap of assignedSnap.docs) {
      const student = documentToStudentProfile(docSnap.id, docSnap.data());
      if (student) {
        studentIdsSet.add(student.uid);
        directStudents.push(student);
      }
    }

    // 4. Fetch missing student profiles from groups
    const directStudentUids = new Set(directStudents.map((s) => s.uid));
    const missingUids = Array.from(studentIdsSet).filter(
      (uid) => !directStudentUids.has(uid)
    );

    const additionalStudents = [];
    if (missingUids.length > 0) {
      const chunks = chunk(missingUids, 30);
      for (const idChunk of chunks) {
        const q = query(usersRef, where(documentId(), 'in', idChunk));
        const snap = await getDocs(q);
        for (const docSnap of snap.docs) {
          const student = documentToStudentProfile(docSnap.id, docSnap.data());
          if (student) {
            additionalStudents.push(student);
          }
        }
      }
    }

    const allStudents = [...directStudents, ...additionalStudents];
    // Sort students alphabetically by displayName or email
    allStudents.sort((a, b) => {
      const nameA = a.displayName || a.email || '';
      const nameB = b.displayName || b.email || '';
      return nameA.localeCompare(nameB, 'ru');
    });

    return {
      students: allStudents,
      groups,
    };
  }

  async function getStudentProfile(studentId) {
    if (!studentId || typeof studentId !== 'string') {
      return null;
    }

    const docRef = doc(firestore, usersCollectionName, studentId.trim());
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return null;
    }

    return documentToStudentProfile(snap.id, snap.data());
  }

  async function getStudentSessions(studentId) {
    if (!studentId || typeof studentId !== 'string') {
      return [];
    }

    return await analyticsRepo.getUserSessions(studentId.trim());
  }

  const repo = {
    getTeacherStudentsAndGroups,
    getStudentProfile,
    getStudentSessions,
    async getTeacherStudentsList(teacherId) {
      const { students, groups } = await repo.getTeacherStudentsAndGroups(teacherId);

      const enrichedList = await Promise.all(
        students.map(async (student) => {
          try {
            const sessions = await repo.getStudentSessions(student.uid);
            return enrichStudentSummary(student, sessions, groups);
          } catch {
            return enrichStudentSummary(student, [], groups);
          }
        })
      );

      return {
        students: enrichedList,
        groups,
      };
    },
    async getTeacherOverviewData(teacherId) {
      const { students, groups } = await repo.getTeacherStudentsAndGroups(teacherId);

      const sessionsArrays = await Promise.all(
        students.map(async (student) => {
          try {
            return await repo.getStudentSessions(student.uid);
          } catch {
            return [];
          }
        })
      );

      const allSessions = sessionsArrays.flat();

      const kpis = calculateTeacherOverview({
        students,
        groups,
        sessions: allSessions,
        now: Date.now(),
      });

      return {
        kpis,
        studentsCount: students.length,
        groupsCount: groups.length,
        groups,
        recentStudents: students.slice(0, 5),
      };
    },
  };

  return repo;
}

export const teacherStudentRepository = createTeacherStudentRepository();
