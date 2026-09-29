import { getApp, getApps, initializeApp } from 'firebase/app';

const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

export function validateFirebaseConfig(env = import.meta.env) {
  const missing = REQUIRED_ENV_VARS.filter((key) => !env || !env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase environment variables: ${missing.join(', ')}`
    );
  }
}

export function initFirebaseApp(env = import.meta.env) {
  if (env?.MODE === 'test') {
    if (getApps().length > 0) {
      return getApp();
    }
    return initializeApp({
      apiKey: env.VITE_FIREBASE_API_KEY || 'test-api-key',
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'test.firebaseapp.com',
      projectId: env.VITE_FIREBASE_PROJECT_ID || 'test-project',
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'test.appspot.com',
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '12345678',
      appId: env.VITE_FIREBASE_APP_ID || '1:12345678:web:abcdef',
    });
  }

  validateFirebaseConfig(env);

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    ...(env.VITE_FIREBASE_MEASUREMENT_ID
      ? { measurementId: env.VITE_FIREBASE_MEASUREMENT_ID }
      : {}),
  });
}

export const firebaseApp = initFirebaseApp();
