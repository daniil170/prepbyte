import { Link } from 'react-router-dom';
import { Logo } from '@shared/ui/Logo/Logo';
import { ThemeToggle } from '@shared/theme';
import styles from './CookiePolicyPage.module.css';

export default function CookiePolicyPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand} title="На главную">
          <Logo variant="full" size={24} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ThemeToggle />
          <Link to="/" className={styles.backLink}>
            &larr; На главную
          </Link>
        </div>
      </header>

      <main className={styles.content}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Политика использования файлов cookie и локального хранилища</h1>
          <span className={styles.meta}>Версия 1.0 &bull; Дата вступления в силу: Октябрь 2026 г.</span>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Что такое файлы cookie и локальное хранилище</h2>
          <p className={styles.paragraph}>
            Для стабильной работы веб-приложения PrepByte, поддержания сеанса авторизации и сохранения настроек интерфейса
            используются стандартные браузерные механизмы хранения данных: <code>localStorage</code>, <code>sessionStorage</code> и <code>IndexedDB</code>.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Фактически используемые технологии</h2>
          <p className={styles.paragraph}>
            Платформа PrepByte использует <strong>исключительно строго необходимые функциональные технологии хранения</strong>.
            Сторонние рекламные трекеры, маркетинговые или аналитические cookies сторонних рекламных сетей на платформе <strong>не применяются</strong>.
          </p>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Ключ / Технология</th>
                  <th className={styles.th}>Тип хранилища</th>
                  <th className={styles.th}>Назначение</th>
                  <th className={styles.th}>Срок хранения</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.tr}>
                  <td className={styles.td}><code>firebase:authUser:...</code></td>
                  <td className={styles.td}>IndexedDB / localStorage</td>
                  <td className={styles.td}>Безопасное сохранение токена авторизации пользователя</td>
                  <td className={styles.td}>До выхода из аккаунта</td>
                </tr>
                <tr className={styles.tr}>
                  <td className={styles.td}><code>prepbyte-theme</code></td>
                  <td className={styles.td}>localStorage</td>
                  <td className={styles.td}>Сохранение выбранной цветовой темы (тёмная / светлая)</td>
                  <td className={styles.td}>Постоянно в браузере</td>
                </tr>
                <tr className={styles.tr}>
                  <td className={styles.td}><code>firestore_offline_cache</code></td>
                  <td className={styles.td}>IndexedDB</td>
                  <td className={styles.td}>Локальный кеш вопросов для быстрой загрузки теста</td>
                  <td className={styles.td}>Период сессии браузера</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Управление локальным хранилищем</h2>
          <p className={styles.paragraph}>
            Поскольку используемые механизмы являются строго необходимыми для функционирования авторизации и интерфейса,
            их отключение в браузере приведет к невозможности входа в систему и прохождения тестирования.
            Вы можете очистить локальные данные браузера в любой момент через настройки конфиденциальности вашего веб-браузера.
          </p>
        </section>
      </main>
    </div>
  );
}
