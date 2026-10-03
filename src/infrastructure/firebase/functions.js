import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { firebaseApp } from './firebaseApp';

export const functions = getFunctions(firebaseApp, 'us-central1');

if (
  typeof window !== 'undefined' &&
  import.meta.env?.DEV &&
  import.meta.env?.VITE_USE_FIREBASE_EMULATOR === 'true'
) {
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch {
    // safe fallback if already connected
  }
}
