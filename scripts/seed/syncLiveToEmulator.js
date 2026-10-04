import { readFileSync, existsSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Script to copy live Cloud Firestore data directly into the running Firebase Emulator.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS="service_acount.json" node scripts/seed/syncLiveToEmulator.js
 */
async function syncLiveToEmulator() {
  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './service_acount.json';

  if (!existsSync(saPath)) {
    console.error(`❌ Ошибка: Файл сервисного аккаунта не найден по пути "${saPath}".`);
    console.error('Пожалуйста, укажите верный путь: export GOOGLE_APPLICATION_CREDENTIALS="service_acount.json"');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(readFileSync(saPath, 'utf8'));

  console.log('🌐 Подключение к боевому Cloud Firestore...');
  const liveApp = initializeApp(
    { credential: cert(serviceAccount) },
    'liveProject'
  );
  const liveDb = getFirestore(liveApp);

  console.log('💻 Подключение к локальному Firestore Emulator (127.0.0.1:8080)...');
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  const emuApp = initializeApp(
    { projectId: serviceAccount.project_id || 'prepbyte-ba7f8' },
    'emulatorProject'
  );
  const emuDb = getFirestore(emuApp);

  const collectionsToSync = ['questions', 'question_answers', 'groups', 'exams', 'users'];
  let totalCopied = 0;

  for (const collName of collectionsToSync) {
    try {
      const snapshot = await liveDb.collection(collName).get();
      if (snapshot.empty) {
        console.log(`- Коллекция "${collName}": пуста на боевом проекте.`);
        continue;
      }

      console.log(`- Перенос коллекции "${collName}": ${snapshot.docs.length} документов...`);
      const batchSize = 400;
      let batch = emuDb.batch();
      let countInBatch = 0;

      for (const docSnap of snapshot.docs) {
        const targetRef = emuDb.collection(collName).doc(docSnap.id);
        batch.set(targetRef, docSnap.data(), { merge: true });
        countInBatch++;
        totalCopied++;

        if (countInBatch >= batchSize) {
          await batch.commit();
          batch = emuDb.batch();
          countInBatch = 0;
        }
      }

      if (countInBatch > 0) {
        await batch.commit();
      }
    } catch (err) {
      console.error(`⚠️ Ошибка копирования коллекции "${collName}":`, err.message);
    }
  }

  console.log(`\n✅ Успешно скопировано ${totalCopied} документов из живого Firestore в эмулятор!`);
}

syncLiveToEmulator()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Ошибка синхронизации:', err);
    process.exit(1);
  });
