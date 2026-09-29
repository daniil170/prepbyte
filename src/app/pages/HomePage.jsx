import { useAuth } from '@features/auth';
import { Logo } from '@shared/ui/Logo/Logo';
import styles from './HomePage.module.css';

export default function HomePage() {
  const { user, signOut } = useAuth();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Logo variant="mark" size={24} />
        </div>
        <div className={styles.userNav}>
          <span className={styles.email}>{user?.email || 'Пользователь'}</span>
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
        <h1 className={styles.title}>PrepByte</h1>
        <p className={styles.description}>
          Adaptive preparation platform for ENT Computer Science.
        </p>
      </main>
    </div>
  );
}
