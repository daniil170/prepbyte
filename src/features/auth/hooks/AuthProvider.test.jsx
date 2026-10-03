import { act, render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

function createFakeAuthRepository(initialUser = null) {
  let subscriber = null;
  let currentUser = initialUser;

  return {
    signInWithEmail: vi.fn(async ({ email }) => {
      currentUser = { id: 'fake-id', email, displayName: null };
      return currentUser;
    }),
    registerWithEmail: vi.fn(async ({ email }) => {
      currentUser = { id: 'registered-id', email, displayName: null };
      return currentUser;
    }),
    signInWithGoogle: vi.fn(async () => {
      currentUser = {
        id: 'google-id',
        email: 'google@test.com',
        displayName: 'Google User',
      };
      return currentUser;
    }),
    signOut: vi.fn(async () => {
      currentUser = null;
    }),
    subscribeToAuthState: vi.fn((callback) => {
      subscriber = callback;
      callback(currentUser);
      return vi.fn();
    }),
    emitAuthState: (user) => {
      currentUser = user;
      if (subscriber) {
        subscriber(user);
      }
    },
  };
}

function createFakeProfileRepository() {
  return {
    ensureUserProfile: vi.fn().mockResolvedValue({}),
  };
}

function TestConsumer() {
  const { user, status, signIn, register, signInWithGoogle, signOut } =
    useAuth();

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <button
        onClick={() =>
          signIn({ email: 'test@prepbyte.kz', password: 'password123' })
        }
      >
        Sign In
      </button>
      <button
        onClick={() =>
          register({ email: 'reg@prepbyte.kz', password: 'password123' })
        }
      >
        Register
      </button>
      <button onClick={() => signInWithGoogle()}>Google</button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}

describe('AuthProvider & useAuth', () => {
  it('throws error when useAuth is called outside of AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    );
    spy.mockRestore();
  });

  it('initializes with unauthenticated status when no user is signed in', () => {
    const fakeRepo = createFakeAuthRepository(null);
    const fakeProfileRepo = createFakeProfileRepository();

    render(
      <AuthProvider repository={fakeRepo} profileRepository={fakeProfileRepo}>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('updates state when initial user is provided', () => {
    const fakeRepo = createFakeAuthRepository({
      id: 'existing-id',
      email: 'existing@prepbyte.kz',
      displayName: 'Existing',
    });
    const fakeProfileRepo = createFakeProfileRepository();

    render(
      <AuthProvider repository={fakeRepo} profileRepository={fakeProfileRepo}>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent(
      'existing@prepbyte.kz'
    );
  });

  it('handles signIn, register, signInWithGoogle, and signOut', async () => {
    const fakeRepo = createFakeAuthRepository(null);
    const fakeProfileRepo = createFakeProfileRepository();

    render(
      <AuthProvider repository={fakeRepo} profileRepository={fakeProfileRepo}>
        <TestConsumer />
      </AuthProvider>
    );

    // Sign in
    await act(async () => {
      screen.getByText('Sign In').click();
    });
    expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('test@prepbyte.kz');
    expect(fakeRepo.signInWithEmail).toHaveBeenCalledWith({
      email: 'test@prepbyte.kz',
      password: 'password123',
    });

    // Sign out
    await act(async () => {
      screen.getByText('Sign Out').click();
    });
    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('none');

    // Register
    await act(async () => {
      screen.getByText('Register').click();
    });
    expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('reg@prepbyte.kz');

    // Google
    await act(async () => {
      screen.getByText('Google').click();
    });
    expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('google@test.com');
  });
});
