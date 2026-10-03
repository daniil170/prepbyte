import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '@features/auth';
import { Logo } from '@shared/ui/Logo/Logo';
import { ThemeToggle } from '@shared/theme';
import styles from './TeacherLayout.module.css';

export function TeacherLayout() {
  const { user, signOut } = useAuth();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/teacher" className={styles.brand}>
            <Logo variant="full" size={22} />
            <span className={styles.badge}>Кабинет учителя</span>
          </Link>

          <nav className={styles.nav} aria-label="Разделы кабинета учителя">
            <NavLink
              to="/teacher"
              end
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              Обзор
            </NavLink>
            <NavLink
              to="/teacher/students"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              Ученики
            </NavLink>
            <NavLink
              to="/teacher/groups"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              Группы
            </NavLink>
            <NavLink
              to="/teacher/exams"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              Экзамены
            </NavLink>
          </nav>
        </div>

        <div className={styles.headerRight}>
          <Link to="/" className={styles.platformLink}>
            &larr; На платформу
          </Link>
          <ThemeToggle />
          <span className={styles.teacherEmail}>{user?.email || 'Учитель'}</span>
          <button
            type="button"
            onClick={signOut}
            className={styles.signOutButton}
          >
            Выйти
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
