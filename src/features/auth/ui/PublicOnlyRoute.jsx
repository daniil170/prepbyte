import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function PublicOnlyRoute({ children }) {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{ padding: '2rem', textAlign: 'center' }}
      >
        Загрузка...
      </div>
    );
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  return children;
}
