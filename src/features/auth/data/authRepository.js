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

  async function resolveAuthUser(firebaseUser) {
    if (!firebaseUser) {
      return null;
    }
    try {
      if (typeof firebaseUser.getIdTokenResult === 'function') {
        const tokenResult = await firebaseUser.getIdTokenResult(true);
        return mapFirebaseUserToAuthUser(firebaseUser, tokenResult);
      }
    } catch {
      // Fallback to basic mapping if token inspection fails
    }
    return mapFirebaseUserToAuthUser(firebaseUser);
  }

  async function signInWithEmail({ email, password }) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );
      return await resolveAuthUser(userCredential.user);
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
      return await resolveAuthUser(userCredential.user);
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
      return await resolveAuthUser(userCredential.user);
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

  async function requestGoogleDriveAccess() {
    try {
      const driveProvider = new GoogleAuthProvider();
      driveProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
      const userCredential = await signInWithPopup(firebaseAuth, driveProvider);
      const credential =
        GoogleAuthProvider.credentialFromResult(userCredential);
      return credential?.accessToken || null;
    } catch (error) {
      throw mapFirebaseErrorToAuthError(error);
    }
  }

  function subscribeToAuthState(callback) {
    return onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      const authUser = await resolveAuthUser(firebaseUser);
      callback(authUser);
    });
  }

  return {
    signInWithEmail,
    registerWithEmail,
    signInWithGoogle,
    requestGoogleDriveAccess,
    signOut,
    subscribeToAuthState,
  };
}

export const authRepository = createAuthRepository();
