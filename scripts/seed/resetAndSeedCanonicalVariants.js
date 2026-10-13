import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateCanonicalJsonVariant } from '../../src/features/question-bank/domain/jsonVariantSchema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';

console.log('🔄 Запуск очистки базы и загрузки канонических вариантов...');
console.log(`- Auth Emulator: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
console.log(`- Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);

const app = getApps().length === 0 ? initializeApp({ projectId: 'prepbyte-ba7f8' }) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

async function deleteCollection(collectionPath, batchSize = 100) {
  const collectionRef = db.collection(collectionPath);
  let totalDeleted = 0;

  while (true) {
    const snapshot = await collectionRef.limit(batchSize).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    totalDeleted += snapshot.size;
  }

  console.log(`🗑️ Очищена коллекция "${collectionPath}": удалено ${totalDeleted} документов.`);
  return totalDeleted;
}

export async function resetAndSeedCanonicalVariants() {
  // 1. Очистить старые коллекции вопросов, ответов и сессий
  console.log('\n--- ШАГ 1: Очистка старых данных ---');
  await deleteCollection('questions');
  await deleteCollection('question_answers');
  await deleteCollection('exams');
  await deleteCollection('exam_sessions');
  await deleteCollection('exam_pin_lookup');
  await deleteCollection('test_sessions');
  await deleteCollection('question_exposure');
  await deleteCollection('variants');

  // 2. Убедиться, что базовые пользователи и группа существуют
  console.log('\n--- ШАГ 2: Проверка пользователей и классов ---');
  const usersToEnsure = [
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

  for (const u of usersToEnsure) {
    try {
      await auth.getUser(u.uid);
    } catch {
      await auth.createUser({
        uid: u.uid,
        email: u.email,
        password: u.password,
        displayName: u.displayName,
      });
    }

    if (Object.keys(u.claims).length > 0) {
      await auth.setCustomUserClaims(u.uid, u.claims);
    }

    await db.collection('users').doc(u.uid).set(
      {
        uid: u.uid,
        email: u.email,
        name: u.displayName,
        role: u.role,
        ...(u.teacherId ? { teacherId: u.teacherId } : {}),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  }

  const groupId = 'group10a';
  await db.collection('groups').doc(groupId).set({
    name: '10A Информатика',
    teacherId: 'teacher_user_id',
    studentIds: ['student1_user_id', 'student2_user_id'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }, { merge: true });

  // 3. Подготовка 3-х канонических вариантов
  console.log('\n--- ШАГ 3: Загрузка канонических вариантов ---');

  // Вариант 1
  const v1Path = path.join(rootDir, 'docs/prompts/example-variant.json');
  const v1Raw = JSON.parse(fs.readFileSync(v1Path, 'utf-8'));

  // Вариант 2 (на базе sampleVariant.json)
  const v2Path = path.join(rootDir, 'scripts/seed/fixtures/sampleVariant.json');
  const v2Raw = JSON.parse(fs.readFileSync(v2Path, 'utf-8'));
  v2Raw.variantId = 'unt-var-2026-10-12-02';
  v2Raw.title = 'ЕНТ Информатика — Вариант №2';
  v2Raw.createdAt = '2026-10-12T14:00:00Z';
  v2Raw.questions.forEach((q, idx) => {
    q.number = idx + 1;
  });

  // Вариант 3 (исправленный пользователем)
  const v3UserPath = '/Users/ivakindaniil/Documents/variant1.json';
  const v3Raw = JSON.parse(fs.readFileSync(v3UserPath, 'utf-8'));
  v3Raw.variantId = 'unt-var-2026-10-12-03';
  v3Raw.title = 'ЕНТ Информатика — Вариант №3';

  // Сохраним Вариант 2 и 3 в репозиторий в fixtures/canonical-variants/
  const canonicalDir = path.join(rootDir, 'scripts/seed/fixtures/canonical-variants');
  if (!fs.existsSync(canonicalDir)) {
    fs.mkdirSync(canonicalDir, { recursive: true });
  }
  fs.writeFileSync(path.join(canonicalDir, 'variant-1.json'), JSON.stringify(v1Raw, null, 2));
  fs.writeFileSync(path.join(canonicalDir, 'variant-2.json'), JSON.stringify(v2Raw, null, 2));
  fs.writeFileSync(path.join(canonicalDir, 'variant-3.json'), JSON.stringify(v3Raw, null, 2));

  const variants = [v1Raw, v2Raw, v3Raw];
  let totalSavedQuestions = 0;
  let firstExamQuestionIds = [];

  for (const variant of variants) {
    const val = validateCanonicalJsonVariant(variant);
    if (!val.isValid) {
      throw new Error(`Вариант ${variant.variantId} не прошёл валидацию: ${val.errors.join('; ')}`);
    }

    console.log(`\n📌 Вариант "${val.meta.title}" (${val.meta.variantId}):`);
    console.log(`   Заданий: ${val.questions.length}, Баллов: ${val.stats.totalPoints}`);
    console.log(`   1 часть (одиночные): ${val.stats.singleChoiceCount}, 2 часть (множественные): ${val.stats.multiChoiceCount}`);

    // Сохранить метаданные варианта
    await db.collection('variants').doc(val.meta.variantId).set({
      variantId: val.meta.variantId,
      title: val.meta.title,
      createdAt: val.meta.createdAt || new Date().toISOString(),
      questionCount: val.questions.length,
      maxPoints: val.stats.totalPoints,
      singleChoiceCount: val.stats.singleChoiceCount,
      multiChoiceCount: val.stats.multiChoiceCount,
      isCanonical: true,
      updatedAt: Date.now(),
    });

    // Пакетная запись вопросов
    const batch = db.batch();
    const currentVariantQuestionIds = [];

    for (const q of val.questions) {
      currentVariantQuestionIds.push(q.id);
      const publicRef = db.collection('questions').doc(q.id);
      const answerRef = db.collection('question_answers').doc(q.id);

      batch.set(publicRef, {
        topic: q.topic,
        questionText: q.questionText,
        options: q.options,
        multiple: q.multiple,
        difficulty: q.difficulty,
        variantSlug: val.meta.variantId,
        variantId: val.meta.variantId,
        status: 'active',
        points: q.points,
        maxPoints: q.maxPoints,
        version: q.version || 1,
        createdBy: 'admin_user_id',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      batch.set(answerRef, {
        questionId: q.id,
        correctAnswers: q.correctAnswers,
        explanation: q.explanation,
        version: q.version || 1,
        createdBy: 'admin_user_id',
        updatedAt: Date.now(),
      });
    }

    await batch.commit();
    totalSavedQuestions += val.questions.length;

    if (firstExamQuestionIds.length === 0) {
      firstExamQuestionIds = currentVariantQuestionIds;
    }
  }

  // 4. Создать активный пробный экзамен по Варианту №1
  console.log('\n--- ШАГ 4: Создание активного экзамена ---');
  const examId = 'exam_emu_101';
  const pin = '123456';
  const now = Date.now();

  await db.collection('exams').doc(examId).set({
    title: 'ЕНТ Информатика — Вариант №1 (Тренировочный)',
    description: 'Официальный канонический пробник ЕНТ (40 заданий, 50 баллов)',
    teacherId: 'teacher_user_id',
    groupId,
    groupName: '10A Информатика',
    questionIds: firstExamQuestionIds,
    totalQuestions: firstExamQuestionIds.length,
    durationMinutes: 120,
    durationSeconds: 7200,
    pin,
    status: 'active',
    startsAt: now,
    endsAt: now + 7200000,
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

  console.log('\n🎉 БАЗА ДАННЫХ УСПЕШНО ОБНОВЛЕНА!');
  console.log('---------------------------------------------------------');
  console.log(`📚 Всего сохранено вопросов в банке: ${totalSavedQuestions}`);
  console.log('📋 Загруженные канонические варианты:');
  console.log('   1. unt-var-2026-10-12-01 (Вариант №1 Эталонный) - 40 заданий');
  console.log('   2. unt-var-2026-10-12-02 (Вариант №2)           - 40 заданий');
  console.log('   3. unt-var-2026-10-12-03 (Вариант №3)           - 40 заданий');
  console.log('🔑 Активный экзамен в кабинете учителя:');
  console.log('   ID: exam_emu_101 | PIN: 123456');
  console.log('   Класс: 10A Информатика');
  console.log('---------------------------------------------------------');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  resetAndSeedCanonicalVariants()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Ошибка сброса и наполнения:', err);
      process.exit(1);
    });
}
