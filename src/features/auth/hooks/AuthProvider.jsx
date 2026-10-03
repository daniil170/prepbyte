import { useCallback, useEffect, useMemo, useState } from 'react';
import { authRepository as defaultRepository } from '../data/authRepository';
import { userProfileRepository as defaultProfileRepository } from '../data/userProfileRepository';
import { AuthContext } from './authContext';

export function AuthProvider({
  children,
  repository = defaultRepository,
  profileRepository = defaultProfileRepository,
}) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const unsubscribe = repository.subscribeToAuthState((authUser) => {
      setUser(authUser);
      setStatus(authUser ? 'authenticated' : 'unauthenticated');

      if (authUser) {
        // Automatically ensure user profile exists in Firestore
        profileRepository.ensureUserProfile(authUser).catch(() => {});
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [repository, profileRepository]);

  const signIn = useCallback(
    async ({ email, password }) => {
      const authUser = await repository.signInWithEmail({ email, password });
      setUser(authUser);
      setStatus('authenticated');
      if (authUser) {
        profileRepository.ensureUserProfile(authUser).catch(() => {});
      }
      return authUser;
    },
    [repository, profileRepository]
  );

  const register = useCallback(
    async ({ email, password, firstName, lastName, className }) => {
      const authUser = await repository.registerWithEmail({
        email,
        password,
        firstName,
        lastName,
      });

      if (authUser) {
        try {
          await profileRepository.ensureUserProfile(authUser, {
            firstName,
            lastName,
            className,
          });
        } catch {
          // Fallback if network delayed
        }
      }

      setUser(authUser);
      setStatus('authenticated');
      return authUser;
    },
    [repository, profileRepository]
  );

  const signInWithGoogle = useCallback(async () => {
    const authUser = await repository.signInWithGoogle();
    setUser(authUser);
    setStatus('authenticated');
    if (authUser) {
      profileRepository.ensureUserProfile(authUser).catch(() => {});
    }
    return authUser;
  }, [repository, profileRepository]);

  const signOut = useCallback(async () => {
    await repository.signOut();
    setUser(null);
    setStatus('unauthenticated');
  }, [repository]);

  const value = useMemo(
    () => ({
      user,
      status,
      signIn,
      register,
      signInWithGoogle,
      signOut,
    }),
    [user, status, signIn, register, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
