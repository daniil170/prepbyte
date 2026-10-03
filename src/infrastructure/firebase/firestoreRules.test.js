import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rulesPath = path.resolve(__dirname, '../../../firestore.rules');
const rulesContent = fs.readFileSync(rulesPath, 'utf8');

const PROJECT_ID = 'demo-prepbyte-rules-test';
const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const [host, portStr] = EMULATOR_HOST.split(':');
const port = Number(portStr) || 8080;

describe('Firestore Security Rules Unit Tests', () => {
  let testEnv;
  let isEmulatorAvailable = false;

  beforeAll(async () => {
    try {
      testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
          rules: rulesContent,
          host,
          port,
        },
      });
      isEmulatorAvailable = true;
    } catch {
      isEmulatorAvailable = false;
      console.warn(
        '\n[WARN] Firestore Emulator не запущен на ' +
          EMULATOR_HOST +
          '. Запустите `npm run test:rules` для полного эмуляторного тестирования.\n'
      );
    }
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (!isEmulatorAvailable || !testEnv) return;
    await testEnv.clearFirestore();

    // Seed initial fixtures using admin context
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();

      // Users
      await setDoc(doc(adminDb, 'users/studentA'), {
        uid: 'studentA',
        email: 'studenta@pifagorschool.kz',
        displayName: 'Student A',
        role: 'student',
        teacherId: 'teacherA',
        groupIds: ['groupA'],
        createdAt: 1000,
        updatedAt: 1000,
      });

      await setDoc(doc(adminDb, 'users/studentB'), {
        uid: 'studentB',
        email: 'studentb@pifagorschool.kz',
        displayName: 'Student B',
        role: 'student',
        teacherId: 'teacherB',
        groupIds: ['groupB'],
        createdAt: 1000,
        updatedAt: 1000,
      });

      // Groups
      await setDoc(doc(adminDb, 'groups/groupA'), {
        name: 'Group 10-A',
        teacherId: 'teacherA',
        studentIds: ['studentA'],
        createdAt: 1000,
        updatedAt: 1000,
      });

      await setDoc(doc(adminDb, 'groups/groupB'), {
        name: 'Group 10-B',
        teacherId: 'teacherB',
        studentIds: ['studentB'],
        createdAt: 1000,
        updatedAt: 1000,
      });

      // Test sessions
      await setDoc(doc(adminDb, 'test_sessions/sessionA'), {
        userId: 'studentA',
        status: 'in_progress',
        questionIds: ['q1', 'q2'],
        durationLimitSec: 3600,
        startedAt: 1000,
        answers: {},
      });

      await setDoc(doc(adminDb, 'test_sessions/sessionB'), {
        userId: 'studentB',
        status: 'in_progress',
        questionIds: ['q1', 'q2'],
        durationLimitSec: 3600,
        startedAt: 1000,
        answers: {},
      });

      // Questions
      await setDoc(doc(adminDb, 'questions/q1'), {
        text: 'Python loop question',
        topicId: 'python_loops',
      });
    });
  });

  it('1. Teacher A CAN read Student A (their assigned student)', async () => {
    if (!isEmulatorAvailable) return;
    const teacherA = testEnv.authenticatedContext('teacherA', {
      teacher: true,
      email: 'teachera@pifagorschool.kz',
    });
    const db = teacherA.firestore();
    await assertSucceeds(getDoc(doc(db, 'users/studentA')));
  });

  it('2. Teacher A CANNOT read Student B (assigned to Teacher B)', async () => {
    if (!isEmulatorAvailable) return;
    const teacherA = testEnv.authenticatedContext('teacherA', {
      teacher: true,
      email: 'teachera@pifagorschool.kz',
    });
    const db = teacherA.firestore();
    await assertFails(getDoc(doc(db, 'users/studentB')));
  });

  it('3. Teacher A CANNOT read Group B (belonging to Teacher B)', async () => {
    if (!isEmulatorAvailable) return;
    const teacherA = testEnv.authenticatedContext('teacherA', {
      teacher: true,
      email: 'teachera@pifagorschool.kz',
    });
    const db = teacherA.firestore();
    await assertFails(getDoc(doc(db, 'groups/groupB')));
  });

  it('4. Student A CANNOT read Student B profile', async () => {
    if (!isEmulatorAvailable) return;
    const studentA = testEnv.authenticatedContext('studentA', {
      email: 'studenta@pifagorschool.kz',
    });
    const db = studentA.firestore();
    await assertFails(getDoc(doc(db, 'users/studentB')));
  });

  it('5. Student CANNOT create a teacher group', async () => {
    if (!isEmulatorAvailable) return;
    const studentA = testEnv.authenticatedContext('studentA', {
      email: 'studenta@pifagorschool.kz',
    });
    const db = studentA.firestore();
    await assertFails(
      setDoc(doc(db, 'groups/hackedGroup'), {
        name: 'Hacked Group',
        teacherId: 'studentA',
        studentIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
  });

  it('6. Student CANNOT escalate role from "student" to "teacher" or "admin"', async () => {
    if (!isEmulatorAvailable) return;
    const studentA = testEnv.authenticatedContext('studentA', {
      email: 'studenta@pifagorschool.kz',
    });
    const db = studentA.firestore();
    await assertFails(
      updateDoc(doc(db, 'users/studentA'), {
        role: 'teacher',
      })
    );
    await assertFails(
      updateDoc(doc(db, 'users/studentA'), {
        role: 'admin',
      })
    );
  });

  it('6b. Teacher A CANNOT modify or hijack Group B (belonging to Teacher B)', async () => {
    if (!isEmulatorAvailable) return;
    const teacherA = testEnv.authenticatedContext('teacherA', {
      teacher: true,
      email: 'teachera@pifagorschool.kz',
    });
    const db = teacherA.firestore();
    await assertFails(
      updateDoc(doc(db, 'groups/groupB'), {
        name: 'Hijacked by Teacher A',
      })
    );
  });

  it('6c. Student CANNOT write or modify questions', async () => {
    if (!isEmulatorAvailable) return;
    const studentA = testEnv.authenticatedContext('studentA', {
      email: 'studenta@pifagorschool.kz',
    });
    const db = studentA.firestore();
    await assertFails(
      setDoc(doc(db, 'questions/qHacked'), {
        text: 'Hacked question',
        topicId: 'security',
      })
    );
  });

  it('7. Ordinary user CANNOT create a profile with role: "teacher" or "admin"', async () => {
    if (!isEmulatorAvailable) return;
    const maliciousUser = testEnv.authenticatedContext('newUser', {
      email: 'malicious@pifagorschool.kz',
    });
    const db = maliciousUser.firestore();
    await assertFails(
      setDoc(doc(db, 'users/newUser'), {
        uid: 'newUser',
        email: 'malicious@pifagorschool.kz',
        role: 'teacher',
      })
    );
    await assertFails(
      setDoc(doc(db, 'users/newUser'), {
        uid: 'newUser',
        email: 'malicious@pifagorschool.kz',
        role: 'admin',
      })
    );
  });

  it('8. Teacher A CANNOT read test_sessions of unassigned Student B', async () => {
    if (!isEmulatorAvailable) return;
    const teacherA = testEnv.authenticatedContext('teacherA', {
      teacher: true,
      email: 'teachera@pifagorschool.kz',
    });
    const db = teacherA.firestore();
    await assertFails(getDoc(doc(db, 'test_sessions/sessionB')));
  });

  it('9. Teacher A CANNOT update or modify score in student test_sessions', async () => {
    if (!isEmulatorAvailable) return;
    const teacherA = testEnv.authenticatedContext('teacherA', {
      teacher: true,
      email: 'teachera@pifagorschool.kz',
    });
    const db = teacherA.firestore();
    await assertFails(
      updateDoc(doc(db, 'test_sessions/sessionA'), {
        'score.totalScore': 50,
      })
    );
  });

  it('10. Admin CAN read and write questions, manage groups, and delete users', async () => {
    if (!isEmulatorAvailable) return;
    const admin = testEnv.authenticatedContext('adminUser', {
      admin: true,
      email: 'admin@prepbyte.kz',
    });
    const db = admin.firestore();
    await assertSucceeds(getDoc(doc(db, 'users/studentA')));
    await assertSucceeds(getDoc(doc(db, 'groups/groupB')));
    await assertSucceeds(
      setDoc(doc(db, 'questions/qNew'), {
        text: 'Admin question',
        topicId: 'sql_queries',
      })
    );
    await assertSucceeds(deleteDoc(doc(db, 'users/studentB')));
  });

  it('11. Unauthenticated user is DENIED access to all collections', async () => {
    if (!isEmulatorAvailable) return;
    const unauthed = testEnv.unauthenticatedContext();
    const db = unauthed.firestore();
    await assertFails(getDoc(doc(db, 'users/studentA')));
    await assertFails(getDoc(doc(db, 'groups/groupA')));
    await assertFails(getDoc(doc(db, 'test_sessions/sessionA')));
  });

  it('rules structure sanity test', () => {
    expect(rulesContent).toContain('rules_version = \'2\';');
    expect(rulesContent).toContain('match /users/{userId}');
    expect(rulesContent).toContain('match /groups/{groupId}');
    expect(rulesContent).toContain('match /test_sessions/{sessionId}');
  });
});
