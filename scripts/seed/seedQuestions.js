import { SEED_QUESTIONS } from './questions/index.js';
import { validateQuestion } from '../../src/features/question-bank/domain/questionValidation.js';
import { TOPICS } from '../../src/features/question-bank/domain/topics.js';

const BATCH_SIZE = 500;

export async function runSeed({ isDryRun = false } = {}) {
  console.log('PrepByte - Firestore Question Bank Seed Tool');
  console.log(
    `Mode: ${isDryRun ? 'DRY-RUN (validation only)' : 'PRODUCTION / LIVE'}\n`
  );

  // Step 1: Validate all questions
  let hasValidationErrors = false;
  const validationSummary = [];

  for (const question of SEED_QUESTIONS) {
    const errors = validateQuestion(question);
    if (errors.length > 0) {
      hasValidationErrors = true;
      validationSummary.push({ id: question.id, errors });
    }
  }

  if (hasValidationErrors) {
    console.error('Validation failed for the following questions:');
    validationSummary.forEach(({ id, errors }) => {
      console.error(`- Question [${id}]:`);
      errors.forEach((err) => console.error(`    * ${err}`));
    });
    process.exit(1);
  }

  console.log(
    `Validation passed: all ${SEED_QUESTIONS.length} questions are valid according to domain rules.`
  );

  // Step 2: Calculate topic breakdown
  const topicCounts = SEED_QUESTIONS.reduce((acc, q) => {
    acc[q.topic] = (acc[q.topic] || 0) + 1;
    return acc;
  }, {});

  console.log('\nQuestions count by topic:');
  TOPICS.forEach((topic) => {
    const count = topicCounts[topic.id] || 0;
    console.log(`  - [${topic.id}] ${topic.label}: ${count} question(s)`);
  });

  const singleAnswerCount = SEED_QUESTIONS.filter(
    (q) => q.correctAnswers.length === 1
  ).length;
  const multiAnswerCount = SEED_QUESTIONS.filter(
    (q) => q.correctAnswers.length > 1
  ).length;
  console.log(
    `\nQuestion types: ${singleAnswerCount} single-answer, ${multiAnswerCount} multiple-answer.`
  );

  // Step 3: Exit early if dry-run
  if (isDryRun) {
    console.log(
      '\n[DRY RUN COMPLETED] No network requests made or credentials required.'
    );
    return;
  }

  // Step 4: Validate credentials before loading Admin SDK
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error(
      '\n[ERROR] GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.' +
        '\nTo seed Firestore, set the environment variable to your service account JSON file:' +
        '\n  export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"' +
        '\n  npm run seed\n'
    );
    process.exit(1);
  }

  // Step 5: Initialize Firebase Admin dynamically
  const { initializeApp, applicationDefault } =
    await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  initializeApp({
    credential: applicationDefault(),
  });

  const db = getFirestore();
  const collectionRef = db.collection('questions');

  console.log(
    `\nConnecting to Firestore and writing ${SEED_QUESTIONS.length} questions in batches of ${BATCH_SIZE}...`
  );

  // Chunk writes into batches of <= BATCH_SIZE
  for (let i = 0; i < SEED_QUESTIONS.length; i += BATCH_SIZE) {
    const chunk = SEED_QUESTIONS.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    chunk.forEach((question) => {
      const docRef = collectionRef.doc(question.id);
      // Idempotent write: overwrites existing or creates new
      batch.set(docRef, question);
    });

    await batch.commit();
    console.log(
      `  Committed batch ${Math.floor(i / BATCH_SIZE) + 1} (${chunk.length} items).`
    );
  }

  console.log(
    `\n[SUCCESS] Successfully seeded ${SEED_QUESTIONS.length} questions into Firestore collection 'questions'.`
  );
}

// Direct invocation check
if (process.argv[1] && process.argv[1].endsWith('seedQuestions.js')) {
  const isDryRun = process.argv.includes('--dry-run');
  runSeed({ isDryRun }).catch((err) => {
    console.error('\n[UNEXPECTED ERROR]', err);
    process.exit(1);
  });
}
