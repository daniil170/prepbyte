import { createBrowserRouter } from 'react-router-dom';
import {
  LoginPage,
  ProtectedRoute,
  PublicOnlyRoute,
  RegisterPage,
} from '@features/auth';
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
