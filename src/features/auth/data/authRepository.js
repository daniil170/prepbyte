import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth as defaultFirebaseAuth } from '@infrastructure/firebase/auth';
import {
  mapFirebaseErrorToAuthError,
  mapFirebaseUserToAuthUser,
} from './authMappers';

export function createAuthRepository(firebaseAuth = defaultFirebaseAuth) {
  const googleProvider = new GoogleAuthProvider();

  async function signInWithEmail({ email, password }) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );
      return mapFirebaseUserToAuthUser(userCredential.user);
    } catch (error) {
      throw mapFirebaseErrorToAuthError(error);
    }
  }

  async function registerWithEmail({ email, password }) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );
      return mapFirebaseUserToAuthUser(userCredential.user);
    } catch (error) {
      throw mapFirebaseErrorToAuthError(error);
    }
  }

  async function signInWithGoogle() {
    try {
      const userCredential = await signInWithPopup(
        firebaseAuth,
        googleProvider
      );
      return mapFirebaseUserToAuthUser(userCredential.user);
    } catch (error) {
      throw mapFirebaseErrorToAuthError(error);
    }
  }

  async function signOut() {
    try {
      await firebaseSignOut(firebaseAuth);
    } catch (error) {
      throw mapFirebaseErrorToAuthError(error);
    }
  }

  function subscribeToAuthState(callback) {
    return onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      callback(mapFirebaseUserToAuthUser(firebaseUser));
    });
  }

  return {
    signInWithEmail,
    registerWithEmail,
    signInWithGoogle,
    signOut,
    subscribeToAuthState,
  };
}

export const authRepository = createAuthRepository();
