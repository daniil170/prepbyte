import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
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
    const normalizedEmail = String(email || '').trim().toLowerCase();
    try {
      const userCredential = await signInWithEmailAndPassword(
        firebaseAuth,
        normalizedEmail,
        password
      );
      return await resolveAuthUser(userCredential.user);
    } catch (error) {
      throw mapFirebaseErrorToAuthError(error);
    }
  }

  async function registerWithEmail({
    email,
    password,
    firstName = null,
    lastName = null,
  }) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuth,
        normalizedEmail,
        password
      );

      const displayName =
        firstName && lastName
          ? `${String(firstName).trim()} ${String(lastName).trim()}`
          : firstName
            ? String(firstName).trim()
            : null;

      if (displayName && userCredential.user) {
        try {
          await updateProfile(userCredential.user, { displayName });
        } catch {
          // Non-critical profile update failure
        }
      }

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
    signOut,
    subscribeToAuthState,
  };
}

export const authRepository = createAuthRepository();
