import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateQuestion } from '../../src/features/question-bank/domain/questionValidation.js';
import { TOPICS } from '../../src/features/question-bank/domain/topics.js';
import { SEED_QUESTIONS } from './questions/index.js';

const BATCH_SIZE = 500;

/**
 * Validates and imports a variant JSON file containing questions.
 *
 * @param {object} options
 * @param {string} options.filePath - Path to JSON file
 * @param {boolean} [options.isDryRun=false] - Dry run mode without database writes
 * @param {string} [options.prefix=''] - Optional ID prefix to prepend to imported questions
 * @param {Array<object>} [options.existingQuestions=SEED_QUESTIONS] - Existing questions for duplicate check
 * @param {string} [options.collectionName='questions'] - Firestore collection name
 * @returns {Promise<{ success: boolean, isDryRun: boolean, count: number, breakdown: object, questions: Array<object> }>}
 */
export async function importVariant({
  filePath,
  isDryRun = false,
  prefix = '',
  existingQuestions = SEED_QUESTIONS,
  collectionName = 'questions',
} = {}) {
  if (!filePath) {
    throw new Error('Укажите путь к JSON файлу варианта (параметр filePath).');
  }

  const resolvedPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Файл не найден: ${resolvedPath}`);
  }

  let rawContent;
  try {
    rawContent = fs.readFileSync(resolvedPath, 'utf8');
  } catch (err) {
    throw new Error(`Ошибка чтения файла ${resolvedPath}: ${err.message}`);
  }

  let payload;
  try {
    payload = JSON.parse(rawContent);
  } catch (err) {
    throw new Error(
      `Ошибка парсинга JSON в файле ${resolvedPath}: ${err.message}`
    );
  }

  let rawQuestions = [];
  let variantMeta = {};
  if (Array.isArray(payload)) {
    rawQuestions = payload;
  } else if (
    payload &&
    typeof payload === 'object' &&
    Array.isArray(payload.questions)
  ) {
    rawQuestions = payload.questions;
    variantMeta = {
      variantId: payload.variantId,
      title: payload.title,
    };
  } else {
    throw new Error(
      'Файл должен содержать массив заданий или объект со свойством "questions" (массив).'
    );
  }

  if (rawQuestions.length === 0) {
    throw new Error('Вариант не содержит заданий (массив пуст).');
  }

  // Apply optional prefix
  const questions = rawQuestions.map((q) => {
    if (!prefix || !q || typeof q !== 'object') return q;
    return {
      ...q,
      id: `${prefix}${q.id}`,
    };
  });

  // Step 1: Duplicate check within variant
  const idOccurrences = new Map();
  questions.forEach((q, idx) => {
    if (q && q.id) {
      if (!idOccurrences.has(q.id)) idOccurrences.set(q.id, []);
      idOccurrences.get(q.id).push(idx + 1);
    }
  });

  const duplicateIdsInVariant = [];
  idOccurrences.forEach((indices, id) => {
    if (indices.length > 1) {
      duplicateIdsInVariant.push(
        `ID "${id}" дублируется на позициях: [${indices.join(', ')}]`
      );
    }
  });

  // Step 2: Conflict check with existing SEED_QUESTIONS
  const existingIdSet = new Set((existingQuestions || []).map((q) => q.id));
  const conflictIdsWithExisting = questions
    .filter((q) => q && q.id && existingIdSet.has(q.id))
    .map((q) => q.id);

  // Step 3: Domain validation with validateQuestion
  const validationErrors = [];
  questions.forEach((q, index) => {
    const errors = validateQuestion(q);
    if (errors.length > 0) {
      validationErrors.push({
        position: index + 1,
        id: q && q.id ? q.id : 'NO_ID',
        errors,
      });
    }
  });

  // If any errors exist, output details and abort
  if (
    duplicateIdsInVariant.length > 0 ||
    conflictIdsWithExisting.length > 0 ||
    validationErrors.length > 0
  ) {
    console.error('\n[IMPORT ERROR] Валидация варианта не пройдена:');
    if (duplicateIdsInVariant.length > 0) {
      console.error('\n  Дубликаты ID внутри файла:');
      duplicateIdsInVariant.forEach((d) => console.error(`    - ${d}`));
    }
    if (conflictIdsWithExisting.length > 0) {
      console.error(
        '\n  Конфликты ID с существующим банком заданий (используйте --prefix):'
      );
      conflictIdsWithExisting.forEach((id) => console.error(`    - ${id}`));
    }
    if (validationErrors.length > 0) {
      console.error('\n  Ошибки в вопросах:');
      validationErrors.forEach(({ position, id, errors }) => {
        console.error(`    - Задание #${position} [${id}]:`);
        errors.forEach((err) => console.error(`        * ${err}`));
      });
    }

    const err = new Error('Ошибка валидации заданий варианта');
    err.duplicateIdsInVariant = duplicateIdsInVariant;
    err.conflictIdsWithExisting = conflictIdsWithExisting;
    err.validationErrors = validationErrors;
    throw err;
  }

  // Step 4: Calculate metrics and breakdown
  const topicCounts = questions.reduce((acc, q) => {
    acc[q.topic] = (acc[q.topic] || 0) + 1;
    return acc;
  }, {});

  const difficultyCounts = questions.reduce((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, {});

  const singleAnswerCount = questions.filter(
    (q) => q.correctAnswers.length === 1
  ).length;
  const multiAnswerCount = questions.filter(
    (q) => q.correctAnswers.length > 1
  ).length;

  const breakdown = {
    total: questions.length,
    singleAnswerCount,
    multiAnswerCount,
    difficultyCounts,
    topicCounts,
  };

  console.log('\n========================================');
  console.log('PrepByte - Импорт варианта заданий');
  console.log('========================================');
  console.log(`Файл: ${filePath}`);
  if (variantMeta.title || variantMeta.variantId) {
    console.log(
      `Вариант: ${variantMeta.title || 'Без названия'} (${variantMeta.variantId || 'no-id'})`
    );
  }
  if (prefix) {
    console.log(`Префикс ID: "${prefix}"`);
  }
  console.log(
    `Режим: ${isDryRun ? 'DRY-RUN (проверка без записи)' : 'PRODUCTION / LIVE'}\n`
  );

  console.log(`Всего заданий: ${questions.length}`);
  console.log(`  - Одиночный выбор (1 балл): ${singleAnswerCount}`);
  console.log(`  - Множественный выбор (2 балла): ${multiAnswerCount}`);
  console.log(
    `  - Сложность: easy=${difficultyCounts.easy || 0}, medium=${difficultyCounts.medium || 0}, hard=${difficultyCounts.hard || 0}`
  );

  console.log('\nРаспределение по темам:');
  TOPICS.forEach((t) => {
    const c = topicCounts[t.id] || 0;
    if (c > 0) {
      console.log(`  [${t.id}] ${t.label}: ${c}`);
    }
  });

  // Step 5: Dry run exit
  if (isDryRun) {
    console.log(
      '\n[DRY RUN COMPLETED] Валидация успешна. Запись в базу данных не производилась.\n'
    );
    return {
      success: true,
      isDryRun: true,
      count: questions.length,
      breakdown,
      questions,
    };
  }

  // Step 6: Live import to Firestore
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error(
      '\n[ERROR] Переменная GOOGLE_APPLICATION_CREDENTIALS не задана.' +
        '\nДля записи в Firestore задайте путь к сервисному аккаунту:' +
        '\n  export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"' +
        '\n  node scripts/seed/importVariant.js <file>\n'
    );
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS is not set');
  }

  const { initializeApp, applicationDefault } =
    await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  initializeApp({
    credential: applicationDefault(),
  });

  const db = getFirestore();
  const collectionRef = db.collection(collectionName);

  console.log(
    `\nЗапись ${questions.length} заданий в коллекцию "${collectionName}" пакетами по ${BATCH_SIZE}...`
  );

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const chunk = questions.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    chunk.forEach((question) => {
      const docRef = collectionRef.doc(question.id);
      batch.set(docRef, question);
    });

    await batch.commit();
    console.log(
      `  Записан пакет ${Math.floor(i / BATCH_SIZE) + 1} (${chunk.length} заданий).`
    );
  }

  console.log(
    `\n[SUCCESS] Успешно импортировано ${questions.length} заданий в Firestore коллекцию "${collectionName}".\n`
  );

  return {
    success: true,
    isDryRun: false,
    count: questions.length,
    breakdown,
    questions,
  };
}

// CLI invocation handling
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  let prefix = '';
  const prefixArg = args.find((a) => a.startsWith('--prefix='));
  if (prefixArg) {
    prefix = prefixArg.slice('--prefix='.length);
  } else {
    const prefixIdx = args.indexOf('--prefix');
    if (prefixIdx !== -1 && args[prefixIdx + 1]) {
      prefix = args[prefixIdx + 1];
    }
  }

  const positionalArgs = args.filter(
    (a) => !a.startsWith('--') && a !== prefix
  );
  const targetFile =
    positionalArgs[0] || 'scripts/seed/fixtures/sampleVariant.json';

  importVariant({ filePath: targetFile, isDryRun, prefix })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
