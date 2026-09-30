import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authHooks from '../hooks/useAuth';
import { AdminRoute } from './AdminRoute';

describe('AdminRoute guard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state when auth status is loading', () => {
    vi.spyOn(authHooks, 'useAuth').mockReturnValue({
      user: null,
      status: 'loading',
    });

    render(
      <MemoryRouter>
        <AdminRoute>
          <div>Admin Content</div>
        </AdminRoute>
      </MemoryRouter>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('redirects to /login when user is unauthenticated', () => {
    vi.spyOn(authHooks, 'useAuth').mockReturnValue({
      user: null,
      status: 'unauthenticated',
    });

    render(
      <MemoryRouter initialEntries={['/admin/variants']}>
        <Routes>
          <Route
            path="/admin/variants"
            element={
              <AdminRoute>
                <div>Admin Content</div>
              </AdminRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('displays 403 Forbidden screen when authenticated user is not an admin', () => {
    vi.spyOn(authHooks, 'useAuth').mockReturnValue({
      user: { id: 'u1', email: 'regular_student@gmail.com', isAdmin: false },
      status: 'authenticated',
    });

    render(
      <MemoryRouter>
        <AdminRoute>
          <div>Admin Content</div>
        </AdminRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('[403 FORBIDDEN]')).toBeInTheDocument();
    expect(screen.getByText('Доступ ограничен')).toBeInTheDocument();
    expect(screen.getByText('regular_student@gmail.com')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('renders protected children when authenticated user is an admin', () => {
    vi.spyOn(authHooks, 'useAuth').mockReturnValue({
      user: { id: 'admin1', email: 'admin@prepbyte.kz', isAdmin: true },
      status: 'authenticated',
    });

    render(
      <MemoryRouter>
        <AdminRoute>
          <div>Admin Secret Workspace</div>
        </AdminRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Secret Workspace')).toBeInTheDocument();
  });
});
