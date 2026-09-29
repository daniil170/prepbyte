import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@features/auth/ui/ProtectedRoute';
import { PublicOnlyRoute } from '@features/auth/ui/PublicOnlyRoute';
import LoginPage from '@features/auth/ui/LoginPage';
import RegisterPage from '@features/auth/ui/RegisterPage';
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
