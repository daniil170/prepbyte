import { useCallback, useEffect, useMemo, useState } from 'react';
import { authRepository as defaultRepository } from '../data/authRepository';
import { AuthContext } from './authContext';

export function AuthProvider({ children, repository = defaultRepository }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const unsubscribe = repository.subscribeToAuthState((authUser) => {
      setUser(authUser);
      setStatus(authUser ? 'authenticated' : 'unauthenticated');
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [repository]);

  const signIn = useCallback(
    async ({ email, password }) => {
      const authUser = await repository.signInWithEmail({ email, password });
      setUser(authUser);
      setStatus('authenticated');
      return authUser;
    },
    [repository]
  );

  const register = useCallback(
    async ({ email, password }) => {
      const authUser = await repository.registerWithEmail({ email, password });
      setUser(authUser);
      setStatus('authenticated');
      return authUser;
    },
    [repository]
  );

  const signInWithGoogle = useCallback(async () => {
    const authUser = await repository.signInWithGoogle();
    setUser(authUser);
    setStatus('authenticated');
    return authUser;
  }, [repository]);

  const [googleDriveToken, setGoogleDriveToken] = useState(null);

  const requestGoogleDriveAccess = useCallback(async () => {
    if (typeof repository.requestGoogleDriveAccess !== 'function') {
      throw new Error(
        'requestGoogleDriveAccess is not implemented on the repository'
      );
    }
    const token = await repository.requestGoogleDriveAccess();
    if (token) {
      setGoogleDriveToken(token);
    }
    return token;
  }, [repository]);

  const signOut = useCallback(async () => {
    await repository.signOut();
    setUser(null);
    setGoogleDriveToken(null);
    setStatus('unauthenticated');
  }, [repository]);

  const value = useMemo(
    () => ({
      user,
      status,
      googleDriveToken,
      setGoogleDriveToken,
      requestGoogleDriveAccess,
      signIn,
      register,
      signInWithGoogle,
      signOut,
    }),
    [
      user,
      status,
      googleDriveToken,
      requestGoogleDriveAccess,
      signIn,
      register,
      signInWithGoogle,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
