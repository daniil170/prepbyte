import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { firebaseApp } from './firebaseApp';

export const auth = getAuth(firebaseApp);

if (
  typeof window !== 'undefined' &&
  import.meta.env?.DEV &&
  import.meta.env?.VITE_USE_FIREBASE_EMULATOR === 'true'
) {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  } catch {
    // safe fallback if already connected
  }
}
