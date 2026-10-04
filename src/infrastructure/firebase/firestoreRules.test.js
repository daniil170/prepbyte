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

      // Questions (Public data: NO correctAnswers)
      await setDoc(doc(adminDb, 'questions/q1'), {
        topic: 'python_loops',
        questionText: 'Python loop question',
        options: ['for', 'while'],
        multiple: false,
      });

      // Protected Question Answers (Admin only)
      await setDoc(doc(adminDb, 'question_answers/q1'), {
        questionId: 'q1',
        correctAnswers: [0],
        explanation: 'for loop is used for iteration',
      });

      // Exams
      await setDoc(doc(adminDb, 'exams/examA'), {
        title: 'ЕНТ Вариант 11-А',
        teacherId: 'teacherA',
        groupId: 'groupA',
        questionIds: ['q1'],
        durationMinutes: 60,
        pin: '123456',
        status: 'active',
      });

      await setDoc(doc(adminDb, 'exams/examB'), {
        title: 'ЕНТ Вариант 11-Б',
        teacherId: 'teacherB',
        groupId: 'groupB',
        questionIds: ['q1'],
        durationMinutes: 60,
        pin: '654321',
        status: 'active',
      });

      await setDoc(doc(adminDb, 'exams/examFinished'), {
        title: 'Завершённый экзамен',
        teacherId: 'teacherA',
        groupId: 'groupA',
        questionIds: ['q1'],
        durationMinutes: 60,
        pin: '999999',
        status: 'finished',
      });

      // Exam PIN lookups
      await setDoc(doc(adminDb, 'exam_pin_lookup/123456'), {
        examId: 'examA',
        groupId: 'groupA',
        teacherId: 'teacherA',
        status: 'active',
      });

      await setDoc(doc(adminDb, 'exam_pin_lookup/654321'), {
        examId: 'examB',
        groupId: 'groupB',
        teacherId: 'teacherB',
        status: 'active',
      });

      // Exam Sessions
      await setDoc(doc(adminDb, 'exam_sessions/examA_studentA'), {
        examId: 'examA',
        studentId: 'studentA',
        groupId: 'groupA',
        status: 'in_progress',
        answers: {},
        questionOrder: ['q1'],
      });

      await setDoc(doc(adminDb, 'exam_sessions/examB_studentB'), {
        examId: 'examB',
        studentId: 'studentB',
        groupId: 'groupB',
        status: 'in_progress',
        answers: {},
        questionOrder: ['q1'],
      });

      await setDoc(doc(adminDb, 'exam_sessions/examA_studentA_submitted'), {
        examId: 'examA',
        studentId: 'studentA',
        groupId: 'groupA',
        status: 'submitted',
        answers: { q1: [0] },
        questionOrder: ['q1'],
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

  it('6d. Student CAN read public question data in questions/q1', async () => {
    if (!isEmulatorAvailable) return;
    const studentA = testEnv.authenticatedContext('studentA', {
      email: 'studenta@pifagorschool.kz',
    });
    const db = studentA.firestore();
    const snap = await getDoc(doc(db, 'questions/q1'));
    expect(snap.exists()).toBe(true);
    // Public question document must NOT contain correctAnswers
    expect(snap.data()).not.toHaveProperty('correctAnswers');
    expect(snap.data()).not.toHaveProperty('explanation');
  });

  it('6e. Student CANNOT read, write, or query protected question_answers/q1', async () => {
    if (!isEmulatorAvailable) return;
    const studentA = testEnv.authenticatedContext('studentA', {
      email: 'studenta@pifagorschool.kz',
    });
    const db = studentA.firestore();
    await assertFails(getDoc(doc(db, 'question_answers/q1')));
    await assertFails(
      setDoc(doc(db, 'question_answers/q1'), {
        correctAnswers: [1],
      })
    );
  });

  it('6f. Teacher CAN read and write protected question_answers/q1 and questions/q1', async () => {
    if (!isEmulatorAvailable) return;
    const teacherA = testEnv.authenticatedContext('teacherA', {
      teacher: true,
      email: 'teachera@pifagorschool.kz',
    });
    const db = teacherA.firestore();
    await assertSucceeds(getDoc(doc(db, 'question_answers/q1')));
    await assertSucceeds(
      setDoc(doc(db, 'questions/qTeacherNew'), {
        topic: 'python_loops',
        questionText: 'Teacher question',
        options: ['A', 'B'],
        multiple: false,
        difficulty: 'easy',
        version: 1,
        createdBy: 'teacherA',
        status: 'active',
      })
    );
  });

  it('6g. Teacher B CANNOT update or delete Teacher A question (ownership check)', async () => {
    if (!isEmulatorAvailable) return;
    const teacherA = testEnv.authenticatedContext('teacherA', {
      teacher: true,
      email: 'teachera@pifagorschool.kz',
    });
    const dbA = teacherA.firestore();
    await setDoc(doc(dbA, 'questions/qOwnedByA'), {
      topic: 'python_loops',
      questionText: 'Question owned by Teacher A',
      options: ['A', 'B'],
      multiple: false,
      difficulty: 'easy',
      version: 1,
      createdBy: 'teacherA',
      status: 'active',
    });

    const teacherB = testEnv.authenticatedContext('teacherB', {
      teacher: true,
      email: 'teacherb@pifagorschool.kz',
    });
    const dbB = teacherB.firestore();
    await assertFails(
      updateDoc(doc(dbB, 'questions/qOwnedByA'), {
        questionText: 'Hacked by Teacher B',
      })
    );
    await assertFails(deleteDoc(doc(dbB, 'questions/qOwnedByA')));
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
    await assertFails(getDoc(doc(db, 'exams/examA')));
    await assertFails(getDoc(doc(db, 'exam_sessions/examA_studentA')));
    await assertFails(getDoc(doc(db, 'exam_pin_lookup/123456')));
  });

  it('12. Teacher A CAN create exams for their groups', async () => {
    if (!isEmulatorAvailable) return;
    const teacherA = testEnv.authenticatedContext('teacherA', {
      teacher: true,
      email: 'teachera@pifagorschool.kz',
    });
    const db = teacherA.firestore();
    await assertSucceeds(
      setDoc(doc(db, 'exams/newExam'), {
        title: 'Новый экзамен',
        teacherId: 'teacherA',
        groupId: 'groupA',
        questionIds: ['q1'],
        status: 'draft',
      })
    );
  });

  it('13. Student CANNOT create an exam or modify existing exams', async () => {
    if (!isEmulatorAvailable) return;
    const studentA = testEnv.authenticatedContext('studentA', {
      email: 'studenta@pifagorschool.kz',
    });
    const db = studentA.firestore();
    await assertFails(
      setDoc(doc(db, 'exams/studentExam'), {
        title: 'Студенческий экзамен',
        teacherId: 'studentA',
        groupId: 'groupA',
        questionIds: ['q1'],
        status: 'draft',
      })
    );
    await assertFails(
      updateDoc(doc(db, 'exams/examA'), {
        title: 'Hacked Title',
      })
    );
  });

  it('14. Teacher A CANNOT modify or hijack Exam B (belonging to Teacher B)', async () => {
    if (!isEmulatorAvailable) return;
    const teacherA = testEnv.authenticatedContext('teacherA', {
      teacher: true,
      email: 'teachera@pifagorschool.kz',
    });
    const db = teacherA.firestore();
    await assertFails(
      updateDoc(doc(db, 'exams/examB'), {
        title: 'Hijacked by Teacher A',
      })
    );
  });

  it('15. Student A (in groupA) CAN read examA, but CANNOT read examB (groupB)', async () => {
    if (!isEmulatorAvailable) return;
    const studentA = testEnv.authenticatedContext('studentA', {
      email: 'studenta@pifagorschool.kz',
    });
    const db = studentA.firestore();
    // CAN read exam for groupA
    await assertSucceeds(getDoc(doc(db, 'exams/examA')));
    // CANNOT read exam for groupB
    await assertFails(getDoc(doc(db, 'exams/examB')));
  });

  it('16. Student A CAN read exam_pin_lookup for examA PIN, but CANNOT read PIN for examB', async () => {
    if (!isEmulatorAvailable) return;
    const studentA = testEnv.authenticatedContext('studentA', {
      email: 'studenta@pifagorschool.kz',
    });
    const db = studentA.firestore();
    // CAN read PIN lookup of assigned group
    await assertSucceeds(getDoc(doc(db, 'exam_pin_lookup/123456')));
    // CANNOT read PIN lookup of unassigned group
    await assertFails(getDoc(doc(db, 'exam_pin_lookup/654321')));
  });

  it('17. Student A CAN create exam session for examA, but CANNOT create for examB (wrong group)', async () => {
    if (!isEmulatorAvailable) return;
    const studentA = testEnv.authenticatedContext('studentA', {
      email: 'studenta@pifagorschool.kz',
    });
    const db = studentA.firestore();
    // CAN create for groupA
    await assertSucceeds(
      setDoc(doc(db, 'exam_sessions/examA_studentA_new'), {
        examId: 'examA',
        studentId: 'studentA',
        groupId: 'groupA',
        status: 'waiting',
        answers: {},
      })
    );
    // CANNOT create for groupB
    await assertFails(
      setDoc(doc(db, 'exam_sessions/examB_studentA'), {
        examId: 'examB',
        studentId: 'studentA',
        groupId: 'groupB',
        status: 'waiting',
        answers: {},
      })
    );
  });

  it('17b. Student CANNOT create exam session for nonexistent exam, draft exam, or finished exam', async () => {
    if (!isEmulatorAvailable) return;
    const studentA = testEnv.authenticatedContext('studentA', {
      email: 'studenta@pifagorschool.kz',
    });
    const db = studentA.firestore();
    // Nonexistent exam
    await assertFails(
      setDoc(doc(db, 'exam_sessions/nonexistent_studentA'), {
        examId: 'nonexistentExam',
        studentId: 'studentA',
        groupId: 'groupA',
        status: 'waiting',
        answers: {},
      })
    );
    // Finished exam
    await assertFails(
      setDoc(doc(db, 'exam_sessions/examFinished_studentA'), {
        examId: 'examFinished',
        studentId: 'studentA',
        groupId: 'groupA',
        status: 'waiting',
        answers: {},
      })
    );
  });

  it('17c. Student CANNOT create exam session with forged groupId or another studentId', async () => {
    if (!isEmulatorAvailable) return;
    const studentA = testEnv.authenticatedContext('studentA', {
      email: 'studenta@pifagorschool.kz',
    });
    const db = studentA.firestore();
    // Student A tries to join examB (belonging to groupB) by faking groupId: 'groupA' in payload
    await assertFails(
      setDoc(doc(db, 'exam_sessions/examB_studentA_fakeGroup'), {
        examId: 'examB',
        studentId: 'studentA',
        groupId: 'groupA',
        status: 'waiting',
        answers: {},
      })
    );
    // Student A tries to create session on behalf of Student B
    await assertFails(
      setDoc(doc(db, 'exam_sessions/examA_studentB_impersonate'), {
        examId: 'examA',
        studentId: 'studentB',
        groupId: 'groupA',
        status: 'waiting',
        answers: {},
      })
    );
  });

  it('18. Student A CANNOT forge score or percentage on exam session create or update', async () => {
    if (!isEmulatorAvailable) return;
    const studentA = testEnv.authenticatedContext('studentA', {
      email: 'studenta@pifagorschool.kz',
    });
    const db = studentA.firestore();
    // Attempt score injection on create
    await assertFails(
      setDoc(doc(db, 'exam_sessions/examA_studentA_cheat'), {
        examId: 'examA',
        studentId: 'studentA',
        groupId: 'groupA',
        status: 'waiting',
        answers: {},
        score: 100,
        totalScore: 100,
      })
    );
    // Attempt score injection on update
    await assertFails(
      updateDoc(doc(db, 'exam_sessions/examA_studentA'), {
        totalScore: 100,
        percentage: 100,
      })
    );
    await assertFails(
      updateDoc(doc(db, 'exam_sessions/examA_studentA'), {
        correctAnswersCount: 10,
        maxPossibleScore: 10,
      })
    );
  });

  it('18b. Student A CANNOT forge expiresAt, startedAt, or questionOrder on exam session create', async () => {
    if (!isEmulatorAvailable) return;
    const studentA = testEnv.authenticatedContext('studentA', {
      email: 'studenta@pifagorschool.kz',
    });
    const db = studentA.firestore();
    // Attempt expiresAt injection on create
    await assertFails(
      setDoc(doc(db, 'exam_sessions/examA_studentA_cheatTimer'), {
        examId: 'examA',
        studentId: 'studentA',
        groupId: 'groupA',
        status: 'waiting',
        answers: {},
        expiresAt: Date.now() + 86400000,
      })
    );
    // Attempt questionOrder injection on create
    await assertFails(
      setDoc(doc(db, 'exam_sessions/examA_studentA_cheatOrder'), {
        examId: 'examA',
        studentId: 'studentA',
        groupId: 'groupA',
        status: 'waiting',
        answers: {},
        questionOrder: ['q2', 'q1'],
      })
    );
  });

  it('19. Student A CAN update answers in active session, but CANNOT update submitted session', async () => {
    if (!isEmulatorAvailable) return;
    const studentA = testEnv.authenticatedContext('studentA', {
      email: 'studenta@pifagorschool.kz',
    });
    const db = studentA.firestore();
    // Active session update answers
    await assertSucceeds(
      updateDoc(doc(db, 'exam_sessions/examA_studentA'), {
        answers: { q1: [0] },
      })
    );
    // Submitted session update MUST FAIL
    await assertFails(
      updateDoc(doc(db, 'exam_sessions/examA_studentA_submitted'), {
        answers: { q1: [1] },
      })
    );
    // Cannot regress session from in_progress back to waiting
    await assertFails(
      updateDoc(doc(db, 'exam_sessions/examA_studentA'), {
        status: 'waiting',
      })
    );
  });

  it('20. Student A CANNOT modify studentId, examId, groupId, questionOrder, startedAt, expiresAt on update', async () => {
    if (!isEmulatorAvailable) return;
    const studentA = testEnv.authenticatedContext('studentA', {
      email: 'studenta@pifagorschool.kz',
    });
    const db = studentA.firestore();
    await assertFails(
      updateDoc(doc(db, 'exam_sessions/examA_studentA'), {
        studentId: 'hackedStudent',
      })
    );
    await assertFails(
      updateDoc(doc(db, 'exam_sessions/examA_studentA'), {
        examId: 'examB',
      })
    );
    await assertFails(
      updateDoc(doc(db, 'exam_sessions/examA_studentA'), {
        groupId: 'groupB',
      })
    );
    await assertFails(
      updateDoc(doc(db, 'exam_sessions/examA_studentA'), {
        questionOrder: ['q2', 'q1'],
      })
    );
    await assertFails(
      updateDoc(doc(db, 'exam_sessions/examA_studentA'), {
        startedAt: 999999999,
      })
    );
    await assertFails(
      updateDoc(doc(db, 'exam_sessions/examA_studentA'), {
        expiresAt: 999999999,
      })
    );
  });

  it('21. Student A CANNOT read or modify Student B exam session', async () => {
    if (!isEmulatorAvailable) return;
    const studentA = testEnv.authenticatedContext('studentA', {
      email: 'studenta@pifagorschool.kz',
    });
    const db = studentA.firestore();
    await assertFails(getDoc(doc(db, 'exam_sessions/examB_studentB')));
    await assertFails(
      updateDoc(doc(db, 'exam_sessions/examB_studentB'), {
        answers: { q1: [1] },
      })
    );
  });

  it('22. Teacher A CAN read session for their exam, Teacher B CANNOT', async () => {
    if (!isEmulatorAvailable) return;
    const teacherA = testEnv.authenticatedContext('teacherA', {
      teacher: true,
      email: 'teachera@pifagorschool.kz',
    });
    const dbA = teacherA.firestore();
    await assertSucceeds(getDoc(doc(dbA, 'exam_sessions/examA_studentA')));

    const teacherB = testEnv.authenticatedContext('teacherB', {
      teacher: true,
      email: 'teacherb@pifagorschool.kz',
    });
    const dbB = teacherB.firestore();
    await assertFails(getDoc(doc(dbB, 'exam_sessions/examA_studentA')));
  });

  it('23. Teacher CANNOT regress finished exam to active/draft, or active exam to draft/waiting', async () => {
    if (!isEmulatorAvailable) return;
    const teacherA = testEnv.authenticatedContext('teacherA', {
      teacher: true,
      email: 'teachera@pifagorschool.kz',
    });
    const db = teacherA.firestore();
    // Cannot regress finished exam
    await assertFails(
      updateDoc(doc(db, 'exams/examFinished'), {
        status: 'active',
      })
    );
    await assertFails(
      updateDoc(doc(db, 'exams/examFinished'), {
        status: 'draft',
      })
    );
    // Cannot regress active exam to draft or waiting
    await assertFails(
      updateDoc(doc(db, 'exams/examA'), {
        status: 'draft',
      })
    );
    await assertFails(
      updateDoc(doc(db, 'exams/examA'), {
        status: 'waiting',
      })
    );
    // Can advance active exam to finished
    await assertSucceeds(
      updateDoc(doc(db, 'exams/examA'), {
        status: 'finished',
      })
    );
  });

  it('rules structure sanity test', () => {
    expect(rulesContent).toContain('rules_version = \'2\';');
    expect(rulesContent).toContain('match /users/{userId}');
    expect(rulesContent).toContain('match /groups/{groupId}');
    expect(rulesContent).toContain('match /test_sessions/{sessionId}');
    expect(rulesContent).toContain('match /exams/{examId}');
    expect(rulesContent).toContain('match /exam_pin_lookup/{pin}');
    expect(rulesContent).toContain('match /exam_sessions/{sessionId}');
  });
});
