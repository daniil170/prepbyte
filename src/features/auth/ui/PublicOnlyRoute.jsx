import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { RouteLoading } from './RouteLoading';

export function PublicOnlyRoute({ children }) {
  const { status } = useAuth();

  if (status === 'loading') {
    return <RouteLoading />;
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  return children;
}
