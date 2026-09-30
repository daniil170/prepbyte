import { createBrowserRouter } from 'react-router-dom';
import {
  AdminRoute,
  LoginPage,
  ProtectedRoute,
  PublicOnlyRoute,
  RegisterPage,
} from '@features/auth';
import { AnalyticsDashboard } from '@features/analytics';
import { AdminVariantsPage } from '@features/question-bank';
import { TestPage } from '@features/testing';
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
