import { describe, expect, it } from 'vitest';
import { validateFirebaseConfig } from './firebaseApp';

describe('validateFirebaseConfig', () => {
  it('throws an error listing missing variable names when required keys are missing', () => {
    expect(() => validateFirebaseConfig({})).toThrow(
      'Missing required Firebase environment variables: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID'
    );
  });

  it('does not throw when all required keys are present', () => {
    const validConfig = {
      VITE_FIREBASE_API_KEY: 'api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'project.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'project',
      VITE_FIREBASE_STORAGE_BUCKET: 'project.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '12345678',
      VITE_FIREBASE_APP_ID: '1:12345678:web:abcdef',
    };

    expect(() => validateFirebaseConfig(validConfig)).not.toThrow();
  });
});
