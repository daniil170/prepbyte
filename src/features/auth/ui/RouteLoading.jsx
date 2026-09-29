import { Logo } from '@shared/ui/Logo/Logo';
import styles from './RouteLoading.module.css';

export function RouteLoading() {
  return (
    <div role="status" aria-live="polite" className={styles.container}>
      <div className={styles.pulse}>
        <Logo variant="mark" size={36} />
      </div>
      <span className={styles.srOnly}>Загрузка...</span>
    </div>
  );
}
