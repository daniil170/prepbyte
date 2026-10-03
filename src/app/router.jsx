import { createBrowserRouter } from 'react-router-dom';
import {
  AdminRoute,
  LoginPage,
  ProtectedRoute,
  PublicOnlyRoute,
  RegisterPage,
  TeacherRoute,
} from '@features/auth';
import { AnalyticsDashboard } from '@features/analytics';
import { AdminVariantsPage } from '@features/question-bank';
import { TestPage } from '@features/testing';
import {
  TeacherLayout,
  TeacherOverviewPage,
  TeacherStudentsPage,
  TeacherStudentDetailPage,
  TeacherGroupsPage,
  TeacherGroupDetailPage,
} from '@features/teacher';
import HomePage from './pages/HomePage';

export const routes = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/variants',
    element: (
      <AdminRoute>
        <AdminVariantsPage />
      </AdminRoute>
    ),
  },
  {
    path: '/teacher',
    element: (
      <TeacherRoute>
        <TeacherLayout />
      </TeacherRoute>
    ),
    children: [
      {
        index: true,
        element: <TeacherOverviewPage />,
      },
      {
        path: 'students',
        element: <TeacherStudentsPage />,
      },
      {
        path: 'students/:studentId',
        element: <TeacherStudentDetailPage />,
      },
      {
        path: 'groups',
        element: <TeacherGroupsPage />,
      },
      {
        path: 'groups/:groupId',
        element: <TeacherGroupDetailPage />,
      },
    ],
  },
  {
    path: '/analytics',
    element: (
      <ProtectedRoute>
        <AnalyticsDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/test/:sessionId',
    element: (
      <ProtectedRoute>
        <TestPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },
];

export const router = createBrowserRouter(routes);
