import { Link } from 'react-router-dom';
import { isUserAdmin, isUserTeacher, useAuth } from '@features/auth';
import { StartTestPanel } from '@features/testing';
import { Logo } from '@shared/ui/Logo/Logo';
import { HeroBackgroundAnimation } from '@shared/ui/BackgroundAnimation/HeroBackgroundAnimation';
import { ThemeToggle } from '@shared/theme';
import styles from './HomePage.module.css';

const PLATFORM_METRICS = [
  {
    value: '96+',
    label: 'Верифицированных задач',
    description:
      'Фактически исполненные алгоритмы, SQL и задачи по спецификации НЦТ РК.',
  },
  {
    value: '12',
    label: 'Профильных тем',
    description:
      'Полное покрытие: Python, SQL, сети, архитектура ЭВМ, формулы и безопасность.',
  },
  {
    value: '50',
    label: 'Шкала оценивания',
    description:
      'Официальный регламент: 30 задач с 1 ответом и 10 задач с частичным баллом.',
  },
  {
    value: '60 мин',
    label: 'Реалистичный регламент',
    description:
      'Симуляция боевого таймера ЕНТ с гарантированным автосохранением ответов.',
  },
];

const CORE_FEATURES = [
  {
    icon: '⚡',
    title: '12 тем спецификации ЕНТ',
    description:
      'Сбалансированное распределение по алгоритмам, базам данных, архитектуре и сетевым протоколам.',
  },
  {
    icon: '⏱',
    title: 'Реалистичный симулятор теста',
    description:
      '40 заданий в каждом варианте, дедлайн-таймер с защитой от перезагрузок и пошаговый навигатор.',
  },
  {
    icon: '💡',
    title: 'Педагогические объяснения',
    description:
      'Каждое задание содержит исчерпывающее пошаговое обоснование верных ответов и разбор дистракторов.',
  },
  {
    icon: '📊',
    title: 'Адаптивная аналитика прогресса',
    description:
      'Глубокий трекинг динамики баллов, определение сильных навыков и персональных зон роста.',
  },
];

export default function HomePage() {
  const { user, signOut } = useAuth();
  const isAdmin =
    (import.meta.env?.DEV && import.meta.env?.VITE_ADMIN_ALL === 'true') ||
    isUserAdmin(user, import.meta.env?.VITE_ADMIN_EMAILS || '');
  const isTeacher =
    isAdmin ||
    isUserTeacher(user, import.meta.env?.VITE_TEACHER_EMAILS || '');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Logo variant="full" size={24} />
          <nav className={styles.navLinks} aria-label="Основная навигация">
            <Link to="/analytics" className={styles.navLink}>
              Дашборд
            </Link>
            {isTeacher && (
              <Link to="/teacher" className={styles.navLink}>
                Кабинет учителя
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin/variants" className={styles.navLink}>
                Админ-панель
              </Link>
            )}
          </nav>
        </div>

        <div className={styles.userNav}>
          <ThemeToggle />
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
        {/* Hero Section */}
        <section className={styles.heroSection} aria-labelledby="hero-heading">
          <HeroBackgroundAnimation />

          <div className={styles.hero}>
            <div className={styles.heroContent}>
              <div className={styles.heroBadge}>
                <span className={styles.pulseDot} aria-hidden="true" />
                <span>ЕНТ 2026 • Информатика</span>
              </div>

              <h1 id="hero-heading" className={styles.heroTitle}>
                PrepByte
              </h1>

              <p className={styles.heroSubtitle}>
                Адаптивная среда подготовки к Единому национальному тестированию
                (ЕНТ) по информатике. 40 сбалансированных заданий,
                официальный регламент оценивания до 50 баллов и глубокий разбор
                ошибок.
              </p>

              <div className={styles.ctaGroup}>
                <Link to="/analytics" className={styles.dashboardCta}>
                  <span>Перейти в дашборд</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            <div className={styles.heroAction}>
              <StartTestPanel />
            </div>
          </div>
        </section>

        {/* Platform Metrics */}
        <section aria-label="Метрики платформы">
          <div className={styles.metricsGrid}>
            {PLATFORM_METRICS.map((metric, idx) => (
              <div key={idx} className={styles.metricCard}>
                <span className={styles.metricValue}>{metric.value}</span>
                <span className={styles.metricLabel}>{metric.label}</span>
                <p className={styles.metricDescription}>{metric.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Core Features Grid */}
        <section
          className={styles.featuresSection}
          aria-labelledby="features-heading"
        >
          <div className={styles.sectionHeading}>
            <h2 id="features-heading" className={styles.sectionTitle}>
              Возможности платформы
            </h2>
            <p className={styles.sectionSubtitle}>
              Инструменты, спроектированные для достижения максимального балла
              на ЕНТ по информатике.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {CORE_FEATURES.map((feature, idx) => (
              <div key={idx} className={styles.featureCard}>
                <span className={styles.featureIcon} aria-hidden="true">
                  {feature.icon}
                </span>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Developer Signature / Author Card */}
        <section
          className={styles.authorSection}
          aria-label="Об авторе платформы"
        >
          <div className={styles.authorInfo}>
            <div className={styles.authorHeader}>
              <span className={styles.authorBadge}>Разработчик</span>
              <span className={styles.authorStatus}>
                <span className={styles.pulseDot} aria-hidden="true" />
                <span>Готов к использованию</span>
              </span>
            </div>
            <h2 className={styles.authorName}>Ivakin Daniil</h2>
            <p className={styles.authorBio}>
              Архитектура платформы построена на принципах Feature-Driven Clean
              Architecture, детерминированной верификации фактов (execute, do
              not guess) и надежного сохранения состояния тестирования.
            </p>
            <span className={styles.authorTechStack}>
              Стек: React 19 • JavaScript (ES6+) • Vite • Firebase • Vitest
            </span>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <Logo variant="mark" size={18} />
          <span>
            PrepByte © 2026. Платформа подготовки к ЕНТ по Информатике.
          </span>
        </div>
        <div className={styles.footerLinks}>
          <Link to="/privacy-policy" className={styles.footerLink}>
            Конфиденциальность
          </Link>
          <span className={styles.footerDivider}>&bull;</span>
          <Link to="/cookie-policy" className={styles.footerLink}>
            Файлы cookie
          </Link>
          <span className={styles.footerDivider}>&bull;</span>
          <span>Разработчик: Ivakin Daniil</span>
        </div>
      </footer>
    </div>
  );
}
