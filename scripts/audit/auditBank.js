import { auditBank } from '../../src/features/question-bank/domain/questionSimilarity.js';
import { getTopicLabel } from '../../src/features/question-bank/domain/topics.js';
import { SEED_QUESTIONS } from '../seed/questions/index.js';

/**
 * CLI tool for auditing the question bank diversity, duplicate health,
 * and capacity for disjoint examination variants.
 *
 * Usage:
 *   node scripts/audit/auditBank.js              # Audits seed dataset (default)
 *   node scripts/audit/auditBank.js --firestore  # Audits real Firestore questions collection
 *   node scripts/audit/auditBank.js --strict     # Fails with exit code 1 if exact duplicates exist
 */
async function main() {
  const args = process.argv.slice(2);
  const isFirestore = args.includes('--firestore');
  const isStrict = args.includes('--strict');

  let threshold = 0.8;
  const threshIdx = args.indexOf('--threshold');
  if (threshIdx !== -1 && args[threshIdx + 1]) {
    const parsed = parseFloat(args[threshIdx + 1]);
    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 1) {
      threshold = parsed;
    }
  }

  console.log('====================================================');
  console.log('PrepByte - Аудит банка заданий и емкости вариантов');
  console.log('====================================================');

  let questions = [];
  let sourceLabel = '';

  if (isFirestore) {
    sourceLabel = 'Firestore коллекция "questions"';
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.error(
        '\n[ERROR] Переменная окружения GOOGLE_APPLICATION_CREDENTIALS не задана.' +
          '\nДля чтения из живой базы Firestore укажите путь к сервисному аккаунту:' +
          '\n  export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/service-account.json"' +
          '\n  npm run bank:audit -- --firestore\n'
      );
      process.exit(1);
    }

    try {
      const { initializeApp, applicationDefault } =
        await import('firebase-admin/app');
      const { getFirestore } = await import('firebase-admin/firestore');

      initializeApp({
        credential: applicationDefault(),
      });

      const db = getFirestore();
      const snapshot = await db.collection('questions').get();
      questions = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
    } catch (err) {
      console.error(
        '\n[ERROR] Ошибка подключения или чтения из Firestore:',
        err.message
      );
      process.exit(1);
    }
  } else {
    sourceLabel = 'Локальный эталонный сид-набор (SEED_QUESTIONS)';
    questions = SEED_QUESTIONS;
  }

  console.log(`Источник данных: ${sourceLabel}`);
  console.log(`Порог схожести (Jaccard 3-shingles): ${threshold}`);
  console.log('----------------------------------------------------');

  const report = auditBank(questions, {
    single: 30,
    multiple: 10,
    similarityThreshold: threshold,
  });

  console.log(`Всего заданий в банке: ${report.totalCount}`);
  console.log(
    `Типы ответов: ${report.perType.single} с одним ответом (1 балл), ` +
      `${report.perType.multiple} с несколькими ответами (2 балла)`
  );
  console.log(
    `Сложность: легко=${report.perDifficulty.easy || 0}, ` +
      `средне=${report.perDifficulty.medium || 0}, ` +
      `сложно=${report.perDifficulty.hard || 0}`
  );

  console.log('\nРаспределение по темам:');
  const sortedTopics = Object.keys(report.perTopic).sort();
  for (const topicId of sortedTopics) {
    const label = getTopicLabel(topicId) || topicId;
    console.log(`  - [${topicId}] ${label}: ${report.perTopic[topicId]}`);
  }

  console.log('\n----------------------------------------------------');
  console.log('Емкость непересекающихся вариантов (30 single + 10 multiple):');
  const limitingDesc =
    report.limitingType === 'single'
      ? 'одиночные вопросы (single)'
      : report.limitingType === 'multiple'
        ? 'множественные вопросы (multiple)'
        : 'сбалансировано (оба типа равны)';

  console.log(
    `  Поддерживается полностью уникальных вариантов: ${report.supportedDisjointVariants}`
  );
  console.log(`  Лимитирующий фактор (узкое горлышко): ${limitingDesc}`);

  console.log('\nДефицит для целевых объемов банка:');
  console.log(`  Для 5 уникальных вариантов (нужно 150 single + 50 multiple):`);
  console.log(
    `    Не хватает: ${report.missingFor5.missingSingle} single, ` +
      `${report.missingFor5.missingMultiple} multiple (всего +${report.missingFor5.missingTotal})`
  );
  console.log(
    `  Для 10 уникальных вариантов (нужно 300 single + 100 multiple):`
  );
  console.log(
    `    Не хватает: ${report.missingFor10.missingSingle} single, ` +
      `${report.missingFor10.missingMultiple} multiple (всего +${report.missingFor10.missingTotal})`
  );

  console.log('\n----------------------------------------------------');
  console.log('Проверка на точные дубликаты:');
  if (report.exactDuplicates.length === 0) {
    console.log('  ✓ Точных дубликатов текста вопросов не обнаружено.');
  } else {
    console.log(
      `  [!] ОБНАРУЖЕНЫ ТОЧНЫЕ ДУБЛИКАТЫ (${report.exactDuplicates.length} групп):`
    );
    for (const group of report.exactDuplicates) {
      console.log(`    - Вопросы: [${group.ids.join(', ')}]`);
      console.log(`      Текст: "${group.normalizedText.slice(0, 80)}..."`);
    }
  }

  console.log('\nАнализ похожих формулировок (Топ-20 пар):');
  if (report.nearDuplicates.length === 0) {
    console.log(
      `  ✓ Подозрительно похожих вопросов с порогом >= ${threshold} не обнаружено.`
    );
  } else {
    const top20 = report.nearDuplicates.slice(0, 20);
    console.log(
      `  Найдено пар с коэффициентом схожести >= ${threshold}: ${report.nearDuplicates.length}`
    );
    for (const pair of top20) {
      console.log(
        `    - [${pair.q1}] <-> [${pair.q2}] (схожесть: ${(pair.score * 100).toFixed(1)}%)`
      );
      console.log(
        `      1: "${pair.text1.replace(/\s+/g, ' ').slice(0, 70)}..."`
      );
      console.log(
        `      2: "${pair.text2.replace(/\s+/g, ' ').slice(0, 70)}..."`
      );
    }
  }

  console.log('====================================================\n');

  if (isStrict && report.exactDuplicates.length > 0) {
    console.error(
      `[STRICT ERROR] Режим --strict: обнаружено ${report.exactDuplicates.length} точных дубликатов. Завершение с ошибкой.`
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});
