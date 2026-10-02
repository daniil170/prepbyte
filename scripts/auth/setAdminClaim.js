import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

/**
 * Sets or revokes admin custom claim for a user by email or UID.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS="path/to/sa.json" node scripts/auth/setAdminClaim.js <email-or-uid> [--revoke]
 */
export async function setUserAdminClaim(identifier, { revoke = false } = {}) {
  if (!identifier || typeof identifier !== 'string') {
    throw new Error('Укажите email или UID пользователя.');
  }

  const cleanId = identifier.trim();
  const auth = getAuth();

  let userRecord;
  if (cleanId.includes('@')) {
    userRecord = await auth.getUserByEmail(cleanId);
  } else {
    userRecord = await auth.getUser(cleanId);
  }

  const currentClaims = userRecord.customClaims || {};
  const newClaims = {
    ...currentClaims,
    admin: !revoke,
  };

  if (revoke && newClaims.admin === false) {
    delete newClaims.admin;
  }

  await auth.setCustomUserClaims(userRecord.uid, newClaims);

  return {
    uid: userRecord.uid,
    email: userRecord.email,
    claims: newClaims,
    isAdmin: !revoke,
  };
}

if (process.argv[1] && process.argv[1].endsWith('setAdminClaim.js')) {
  const args = process.argv.slice(2);
  const identifier = args.find((arg) => !arg.startsWith('--'));
  const isRevoke = args.includes('--revoke');

  if (!identifier) {
    console.error(
      '\n[ERROR] Не указан пользователь.\n' +
        'Использование:\n' +
        '  node scripts/auth/setAdminClaim.js <email-or-uid> [--revoke]\n\n' +
        'Пример:\n' +
        '  GOOGLE_APPLICATION_CREDENTIALS="serviceAccountKey.json" node scripts/auth/setAdminClaim.js abishev.ernar@pifagor.kz\n'
    );
    process.exit(1);
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error(
      '\n[ERROR] Переменная окружения GOOGLE_APPLICATION_CREDENTIALS не задана.\n' +
        'Укажите путь к сервисному аккаунту Firebase Admin:\n' +
        '  export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"\n'
    );
    process.exit(1);
  }

  try {
    initializeApp({
      credential: applicationDefault(),
    });

    const result = await setUserAdminClaim(identifier, { revoke: isRevoke });
    console.log(
      `\n[УСПЕХ] Пользователю ${result.email} (UID: ${result.uid}) ${
        result.isAdmin
          ? 'назначена роль администратора (admin: true).'
          : 'отозвана роль администратора.'
      }`
    );
    console.log('Текущие custom claims:', result.claims);
    console.log(
      'Примечание: если пользователь уже вошел в систему, ему потребуется обновить токен (перезайти в аккаунт).'
    );
  } catch (err) {
    console.error('\n[ОШИБКА]', err.message || err);
    process.exit(1);
  }
}
