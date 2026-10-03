import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authHooks from '../hooks/useAuth';
import { TeacherRoute } from './TeacherRoute';

describe('TeacherRoute guard', () => {
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
        <TeacherRoute>
          <div>Teacher Content</div>
        </TeacherRoute>
      </MemoryRouter>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Teacher Content')).not.toBeInTheDocument();
  });

  it('redirects to /login when user is unauthenticated', () => {
    vi.spyOn(authHooks, 'useAuth').mockReturnValue({
      user: null,
      status: 'unauthenticated',
    });

    render(
      <MemoryRouter initialEntries={['/teacher']}>
        <Routes>
          <Route
            path="/teacher"
            element={
              <TeacherRoute>
                <div>Teacher Content</div>
              </TeacherRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Teacher Content')).not.toBeInTheDocument();
  });

  it('displays 403 Forbidden screen when authenticated user is a regular student', () => {
    vi.spyOn(authHooks, 'useAuth').mockReturnValue({
      user: {
        id: 'u1',
        email: 'regular_student@gmail.com',
        role: 'student',
        isAdmin: false,
        isTeacher: false,
      },
      status: 'authenticated',
    });

    render(
      <MemoryRouter>
        <TeacherRoute>
          <div>Teacher Content</div>
        </TeacherRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('[403 FORBIDDEN]')).toBeInTheDocument();
    expect(screen.getByText('Доступ ограничен')).toBeInTheDocument();
    expect(screen.getByText('regular_student@gmail.com')).toBeInTheDocument();
    expect(screen.queryByText('Teacher Content')).not.toBeInTheDocument();
  });

  it('renders protected children when authenticated user is a teacher', () => {
    vi.spyOn(authHooks, 'useAuth').mockReturnValue({
      user: {
        id: 't1',
        email: 'teacher@prepbyte.kz',
        role: 'teacher',
        isTeacher: true,
        isAdmin: false,
      },
      status: 'authenticated',
    });

    render(
      <MemoryRouter>
        <TeacherRoute>
          <div>Teacher Classroom</div>
        </TeacherRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Teacher Classroom')).toBeInTheDocument();
  });

  it('renders protected children when authenticated user is an admin', () => {
    vi.spyOn(authHooks, 'useAuth').mockReturnValue({
      user: {
        id: 'admin1',
        email: 'admin@prepbyte.kz',
        role: 'admin',
        isAdmin: true,
      },
      status: 'authenticated',
    });

    render(
      <MemoryRouter>
        <TeacherRoute>
          <div>Teacher Classroom For Admin</div>
        </TeacherRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Teacher Classroom For Admin')).toBeInTheDocument();
  });
});
