import { Link, Navigate, useLocation } from 'react-router-dom';
import { isUserAdmin } from '../domain/adminAuthorization';
import { useAuth } from '../hooks/useAuth';
import { RouteLoading } from './RouteLoading';
import styles from './AdminRoute.module.css';

/**
 * Route guard restricting access to administrator accounts.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export function AdminRoute({ children }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <RouteLoading />;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const adminEmailsEnv = import.meta.env?.VITE_ADMIN_EMAILS || '';
  const devAllowAll =
    import.meta.env?.DEV && import.meta.env?.VITE_ADMIN_ALL === 'true';

  const hasAccess = devAllowAll || isUserAdmin(user, adminEmailsEnv);

  if (!hasAccess) {
    return (
      <main className={styles.deniedContainer}>
        <div className={styles.card} role="alert">
          <div className={styles.badge}>[403 FORBIDDEN]</div>
          <h1 className={styles.title}>Доступ ограничен</h1>
          <p className={styles.message}>
            Раздел администрирования вариантов доступен только авторизованным
            методистам и администраторам PrepByte.
          </p>
          <div className={styles.userInfo}>
            Текущий аккаунт: <strong>{user?.email || 'Неизвестно'}</strong>
          </div>
          <Link to="/" className={styles.homeLink}>
            ← Вернуться на главную
          </Link>
        </div>
      </main>
    );
  }

  return children;
}
