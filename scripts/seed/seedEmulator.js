import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { generateCurriculumQuestions } from '../../src/features/question-bank/domain/curriculumGenerator.js';

// 1. Safety Check: Force Emulator Environment Ports
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';

if (!process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('❌ FATAL: Seed script MUST be run against Firebase Emulator Suite!');
  process.exit(1);
}

console.log('🌱 Initializing Firebase Emulator Seed script...');
console.log(`- Auth Emulator: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
console.log(`- Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);

const app = getApps().length === 0 ? initializeApp({ projectId: 'prepbyte-ba7f8' }) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export async function seedEmulator() {
  // --- 1. Seed Auth Users & Custom Claims ---
  const usersToCreate = [
    {
      uid: 'admin_user_id',
      email: 'admin@test.local',
      password: 'password123',
      displayName: 'System Admin',
      claims: { admin: true },
      role: 'admin',
    },
    {
      uid: 'teacher_user_id',
      email: 'teacher@test.local',
      password: 'password123',
      displayName: 'Учитель Информатики',
      claims: { teacher: true },
      role: 'teacher',
    },
    {
      uid: 'student1_user_id',
      email: 'student1@test.local',
      password: 'password123',
      displayName: 'Иван Студент',
      claims: {},
      role: 'student',
      teacherId: 'teacher_user_id',
    },
    {
      uid: 'student2_user_id',
      email: 'student2@test.local',
      password: 'password123',
      displayName: 'Аружан Студент',
      claims: {},
      role: 'student',
      teacherId: 'teacher_user_id',
    },
  ];

  for (const u of usersToCreate) {
    try {
      await auth.deleteUser(u.uid);
    } catch {
      // ignore if user did not exist
    }

    await auth.createUser({
      uid: u.uid,
      email: u.email,
      password: u.password,
      displayName: u.displayName,
    });

    if (Object.keys(u.claims).length > 0) {
      await auth.setCustomUserClaims(u.uid, u.claims);
    }

    // Seed Firestore /users document
    await db.collection('users').doc(u.uid).set({
      uid: u.uid,
      email: u.email,
      name: u.displayName,
      role: u.role,
      ...(u.teacherId ? { teacherId: u.teacherId } : {}),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  // --- 2. Seed Classroom Group ---
  const groupId = 'group10a';
  await db.collection('groups').doc(groupId).set({
    name: '10A Информатика',
    teacherId: 'teacher_user_id',
    studentIds: ['student1_user_id', 'student2_user_id'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // --- 3. Seed Full UNT Variants & Question Bank ---
  const variantSlugs = ['#00008', '#10001', '#00002'];
  const allSeededQuestions = [];

  for (const slug of variantSlugs) {
    const rawQuestions = generateCurriculumQuestions({ mode: 'full_exam' });
    rawQuestions.forEach((q, idx) => {
      const paddedIndex = String(idx + 1).padStart(3, '0');
      const questionId = `${slug}-${paddedIndex}`;
      allSeededQuestions.push({
        ...q,
        id: questionId,
        variantSlug: slug,
      });
    });
  }

  for (const q of allSeededQuestions) {
    // Write public question data to /questions/{id}
    await db.collection('questions').doc(q.id).set({
      topic: q.topic,
      questionText: q.questionText,
      options: q.options,
      multiple: (q.correctAnswers || []).length > 1,
      difficulty: q.difficulty,
      variantSlug: q.variantSlug,
      status: 'active',
      version: q.version || 1,
    });

    // Write protected correct answers to /question_answers/{id}
    await db.collection('question_answers').doc(q.id).set({
      questionId: q.id,
      correctAnswers: q.correctAnswers,
      explanation: q.explanation,
      version: q.version || 1,
    });
  }

  // --- 4. Seed Active Exam & PIN Lookup ---
  const examId = 'exam_emu_101';
  const pin = '123456';
  const now = Date.now();
  const examQuestionIds = allSeededQuestions.slice(0, 40).map((q) => q.id);

  await db.collection('exams').doc(examId).set({
    title: 'Тестовый ЕНТ Информатика',
    description: 'Локальный экзамен для разработки и тестирования в эмуляторе',
    teacherId: 'teacher_user_id',
    groupId,
    groupName: '10A Информатика',
    questionIds: examQuestionIds,
    totalQuestions: examQuestionIds.length,
    durationMinutes: 60,
    durationSeconds: 3600,
    pin,
    status: 'active',
    startsAt: now,
    endsAt: now + 3600000,
    createdAt: now,
    updatedAt: now,
  });

  await db.collection('exam_pin_lookup').doc(pin).set({
    examId,
    groupId,
    teacherId: 'teacher_user_id',
    status: 'active',
    updatedAt: now,
  });

  console.log('✅ Successfully seeded Firebase Emulator Suite data!');
  console.log('----------------------------------------------------');
  console.log('👥 Test Accounts Created:');
  console.log('   Admin:   admin@test.local    / password123');
  console.log('   Teacher: teacher@test.local  / password123');
  console.log('   Student: student1@test.local / password123');
  console.log('   Student: student2@test.local / password123');
  console.log('📝 Active Exam PIN: 123456 (Exam ID: exam_emu_101)');
  console.log('----------------------------------------------------');
}

// Execute if run directly from CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  seedEmulator()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seed error:', err);
      process.exit(1);
    });
}
