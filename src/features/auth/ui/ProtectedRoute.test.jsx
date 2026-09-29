import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../hooks/AuthProvider';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';

function createFakeRepository({ initialUser = null, delayNotify = false }) {
  let subscriber = null;

  return {
    signInWithEmail: vi.fn(),
    registerWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    subscribeToAuthState: vi.fn((callback) => {
      subscriber = callback;
      if (!delayNotify) {
        callback(initialUser);
      }
      return vi.fn();
    }),
    notify: (user) => {
      if (subscriber) subscriber(user);
    },
  };
}

describe('ProtectedRoute', () => {
  it('displays loading state while auth status is loading', () => {
    const fakeRepo = createFakeRepository({ delayNotify: true });

    const testRouter = createMemoryRouter(
      [
        {
          path: '/protected',
          element: (
            <ProtectedRoute>
              <div>Secret Content</div>
            </ProtectedRoute>
          ),
        },
      ],
      { initialEntries: ['/protected'] }
    );

    render(
      <AuthProvider repository={fakeRepo}>
        <RouterProvider router={testRouter} />
      </AuthProvider>
    );

    expect(screen.getByRole('status')).toHaveTextContent('Загрузка...');
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to /login preserving origin location', () => {
    const fakeRepo = createFakeRepository({ initialUser: null });

    const testRouter = createMemoryRouter(
      [
        {
          path: '/protected',
          element: (
            <ProtectedRoute>
              <div>Secret Content</div>
            </ProtectedRoute>
          ),
        },
        {
          path: '/login',
          element: <div>Login Page</div>,
        },
      ],
      { initialEntries: ['/protected'] }
    );

    render(
      <AuthProvider repository={fakeRepo}>
        <RouterProvider router={testRouter} />
      </AuthProvider>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('renders protected children when user is authenticated', () => {
    const fakeRepo = createFakeRepository({
      initialUser: { id: 'u1', email: 'student@prepbyte.kz' },
    });

    const testRouter = createMemoryRouter(
      [
        {
          path: '/protected',
          element: (
            <ProtectedRoute>
              <div>Secret Content</div>
            </ProtectedRoute>
          ),
        },
      ],
      { initialEntries: ['/protected'] }
    );

    render(
      <AuthProvider repository={fakeRepo}>
        <RouterProvider router={testRouter} />
      </AuthProvider>
    );

    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });

  it('redirects authenticated users away from public routes', () => {
    const fakeRepo = createFakeRepository({
      initialUser: { id: 'u1', email: 'student@prepbyte.kz' },
    });

    const testRouter = createMemoryRouter(
      [
        {
          path: '/login',
          element: (
            <PublicOnlyRoute>
              <div>Login Form</div>
            </PublicOnlyRoute>
          ),
        },
        {
          path: '/',
          element: <div>Home Dashboard</div>,
        },
      ],
      { initialEntries: ['/login'] }
    );

    render(
      <AuthProvider repository={fakeRepo}>
        <RouterProvider router={testRouter} />
      </AuthProvider>
    );

    expect(screen.getByText('Home Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Login Form')).not.toBeInTheDocument();
  });
});
