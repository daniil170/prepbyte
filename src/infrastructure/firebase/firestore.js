import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { firebaseApp } from './firebaseApp';

export const db = getFirestore(firebaseApp);

if (
  typeof window !== 'undefined' &&
  import.meta.env?.DEV &&
  import.meta.env?.VITE_USE_FIREBASE_EMULATOR === 'true'
) {
  try {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  } catch {
    // safe fallback if already connected
  }
}
