import { Link } from 'react-router-dom';
import { useAuth } from '@features/auth';
import { Logo } from '@shared/ui/Logo/Logo';
import { HeroBackgroundAnimation } from '@shared/ui/BackgroundAnimation/HeroBackgroundAnimation';
import { ThemeToggle } from '@shared/theme';
import {
  SparkIcon,
  ClockIcon,
  AnalyticsIcon,
  CodeIcon,
  ShieldIcon,
  UserIcon,
  TargetIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@shared/ui/Icons/LandingIcons';
import { InteractiveLandingCharts } from './components/InteractiveLandingCharts';
import styles from './LandingPage.module.css';

const STATS = [
  {
    value: '96+',
    label: 'Верифицированных задач',
    detail: 'Фактически исполненные алгоритмы, SQL и теория по спецификации НЦТ РК.',
    highlight: '100% верификация',
  },
  {
    value: '12',
    label: 'Профильных тем ЕНТ',
    detail: 'Python, базы данных, сетевые модели OSI, архитектура ЭВМ и кибербезопасность.',
    highlight: 'Актуально на 2026',
  },
  {
    value: '50 б.',
    label: 'Шкала оценивания',
    detail: 'Реалистичный расчет: 30 задач с 1 выбором и 10 заданий с множественным баллом.',
    highlight: 'Официальный регламент',
  },
  {
    value: '60 мин',
    label: 'Боевой таймер',
    detail: 'Защита от сбоев интернета, мгновенное автосохранение и пошаговый навигатор.',
    highlight: 'Без потерь сессии',
  },
];

const FEATURES = [
  {
    icon: CodeIcon,
    title: '12 тем спецификации ЕНТ',
    description:
      'Сбалансированное распределение по алгоритмам Python, базам данных SQL, архитектуре и сетевым протоколам.',
    tag: 'Спецификация',
  },
  {
    icon: ClockIcon,
    title: 'Реалистичный симулятор теста',
    description:
      '40 заданий в каждом варианте, дедлайн-таймер с защитой от перезагрузок и пошаговый навигатор по номерам.',
    tag: 'Боевой режим',
  },
  {
    icon: TargetIcon,
    title: 'Педагогические объяснения',
    description:
      'Каждое задание содержит исчерпывающее пошаговое обоснование верных ответов и разбор дистракторов.',
    tag: 'Без зубрежки',
  },
  {
    icon: AnalyticsIcon,
    title: 'Адаптивная аналитика прогресса',
    description:
      'Глубокий трекинг динамики баллов, определение сильных навыков и персональных зон роста.',
    tag: 'Динамика баллов',
  },
  {
    icon: ShieldIcon,
    title: 'Отказоустойчивая архитектура',
    description:
      'Синхронизация через локальное хранилище и облачную базу: ваши ответы в безопасности при любых сбоях.',
    tag: 'Надежность',
  },
  {
    icon: SparkIcon,
    title: 'ИИ-тьютор и разбор логики',
    description:
      'Интеллектуальные наводящие подсказки помогают понять алгоритмическую логику, не спойлеря верный ответ.',
    tag: 'ИИ-наставник',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Диагностика уровня',
    desc: 'Пройдите стартовый вариант ЕНТ на 40 заданий для выявления слепых зон и первичного среза знаний.',
  },
  {
    step: '02',
    title: 'Индивидуальная карта роста',
    desc: 'Алгоритм формирует профиль по 12 темам: вы видите темы, где теряются ценные баллы.',
  },
  {
    step: '03',
    title: 'Целевая отработка ошибок',
    desc: 'Решайте задачи с разбором дистракторов, подсказками ИИ-тьютора и встроенным интерпретатором.',
  },
  {
    step: '04',
    title: 'Максимальный результат 50/50',
    desc: 'Выходите на реальное тестирование с уверенным знанием формата и отработанным тайм-менеджментом.',
  },
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className={styles.page}>
      {/* Navigation Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/welcome" className={styles.brandLink}>
            <Logo variant="full" size={24} />
          </Link>
          <nav className={styles.navLinks} aria-label="Навигация лэндинга">
            <a href="#analytics" className={styles.navLink}>
              Аналитика
            </a>
            <a href="#features" className={styles.navLink}>
              Возможности
            </a>
            <a href="#methodology" className={styles.navLink}>
              Методика
            </a>
            <Link to="/" className={styles.navLink}>
              Тренажёр
            </Link>
          </nav>
        </div>

        <div className={styles.headerRight}>
          <ThemeToggle showLabel={false} />
          {user ? (
            <Link to="/" className={styles.primaryButton}>
              <span>В личный кабинет</span>
              <ArrowRightIcon size={14} />
            </Link>
          ) : (
            <div className={styles.authButtons}>
              <Link to="/login" className={styles.secondaryButton}>
                Войти
              </Link>
              <Link to="/register" className={styles.primaryButton}>
                <span>Регистрация</span>
                <ArrowRightIcon size={14} />
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.heroSection} aria-labelledby="hero-title">
          <HeroBackgroundAnimation />

          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.pulseDot} aria-hidden="true" />
              <span>ЕНТ 2026 • Информатика • Спецификация НЦТ РК</span>
            </div>

            <h1 id="hero-title" className={styles.heroTitle}>
              Интеллектуальная среда подготовки к ЕНТ по Информатике
            </h1>

            <p className={styles.heroSubtitle}>
              40 верифицированных заданий в каждом варианте, боевой таймер на 60 минут,
              официальная 50-балльная шкала оценивания и пошаговая аналитика освоения 12 профильных тем.
            </p>

            <div className={styles.heroCtaGroup}>
              {user ? (
                <Link to="/" className={styles.heroCtaPrimary}>
                  <span>Перейти к тестированию</span>
                  <ArrowRightIcon size={16} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className={styles.heroCtaPrimary}>
                    <span>Начать подготовку бесплатно</span>
                    <ArrowRightIcon size={16} />
                  </Link>
                  <Link to="/login" className={styles.heroCtaSecondary}>
                    <span>Войти в аккаунт</span>
                  </Link>
                </>
              )}
              <Link to="/exam/join" className={styles.heroCtaPin}>
                <span>Вход на экзамен по PIN</span>
              </Link>
            </div>

            {/* Quick Proof Pills */}
            <div className={styles.proofPills}>
              <div className={styles.proofPill}>
                <CheckCircleIcon size={14} className={styles.proofIcon} />
                <span>Без устаревших заданий</span>
              </div>
              <div className={styles.proofPill}>
                <CheckCircleIcon size={14} className={styles.proofIcon} />
                <span>Официальный частичный балл</span>
              </div>
              <div className={styles.proofPill}>
                <CheckCircleIcon size={14} className={styles.proofIcon} />
                <span>Автосохранение при дисконнекте</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className={styles.statsSection} aria-label="Ключевые показатели платформы">
          <div className={styles.statsGrid}>
            {STATS.map((stat, idx) => (
              <div key={idx} className={styles.statCard}>
                <div className={styles.statTop}>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statHighlight}>{stat.highlight}</span>
                </div>
                <span className={styles.statLabel}>{stat.label}</span>
                <p className={styles.statDetail}>{stat.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Charts & Analytics Showcase */}
        <section
          id="analytics"
          className={styles.analyticsSection}
          aria-labelledby="analytics-heading"
        >
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <span className={styles.pulseDot} aria-hidden="true" />
              <span>Глубокая аналитика и прогресс</span>
            </div>
            <h2 id="analytics-heading" className={styles.sectionHeading}>
              Визуализация результатов подготовки
            </h2>
            <p className={styles.sectionDescription}>
              Интерактивные диаграммы и динамика: исследуйте прогнозируемый рост баллов,
              баланс по 12 темам спецификации и структуру национального экзамена.
            </p>
          </div>

          <InteractiveLandingCharts />
        </section>

        {/* Core Features */}
        <section
          id="features"
          className={styles.featuresSection}
          aria-labelledby="features-heading"
        >
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <span>Архитектура подготовки</span>
            </div>
            <h2 id="features-heading" className={styles.sectionHeading}>
              Возможности платформы PrepByte
            </h2>
            <p className={styles.sectionDescription}>
              Инженерные решения, спроектированные для достижения максимального балла на ЕНТ.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {FEATURES.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div key={idx} className={styles.featureCard}>
                  <div className={styles.featureTop}>
                    <div className={styles.featureIconBox} aria-hidden="true">
                      <IconComp size={18} />
                    </div>
                    <span className={styles.featureTag}>{item.tag}</span>
                  </div>
                  <h3 className={styles.featureTitle}>{item.title}</h3>
                  <p className={styles.featureDesc}>{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Methodology: 4-Step Path */}
        <section
          id="methodology"
          className={styles.methodologySection}
          aria-labelledby="methodology-heading"
        >
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <span>Пошаговый трек</span>
            </div>
            <h2 id="methodology-heading" className={styles.sectionHeading}>
              Методология гарантированного результата
            </h2>
            <p className={styles.sectionDescription}>
              Четкая последовательность шагов, исключающая пробелы в теории и алгоритмах.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            {STEPS.map((s, idx) => (
              <div key={idx} className={styles.stepCard}>
                <span className={styles.stepNumber}>{s.step}</span>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Bottom Card */}
        <section className={styles.bottomCtaSection} aria-label="Призыв к действию">
          <div className={styles.bottomCtaCard}>
            <div className={styles.bottomCtaBadge}>
              <span className={styles.pulseDot} aria-hidden="true" />
              <span>Готовность к ЕНТ 2026</span>
            </div>
            <h2 className={styles.bottomCtaTitle}>
              Начните подготовку к ЕНТ прямо сейчас
            </h2>
            <p className={styles.bottomCtaSubtitle}>
              Бесплатный доступ к тренировочным вариантам, симулятору боевого таймера и разбору ответов.
            </p>
            <div className={styles.bottomCtaButtons}>
              <Link to="/register" className={styles.heroCtaPrimary}>
                <span>Создать аккаунт</span>
                <ArrowRightIcon size={16} />
              </Link>
              <Link to="/login" className={styles.heroCtaSecondary}>
                <span>У меня уже есть аккаунт</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Author / Engineering Signature */}
        <section className={styles.authorSection} aria-label="Об авторе платформы">
          <div className={styles.authorInfo}>
            <div className={styles.authorHeader}>
              <span className={styles.authorBadge}>Разработчик</span>
              <span className={styles.authorStatus}>
                <span className={styles.pulseDot} aria-hidden="true" />
                <span>Active 2026</span>
              </span>
            </div>
            <h2 className={styles.authorName}>Ivakin Daniil</h2>
            <p className={styles.authorBio}>
              Архитектура платформы построена на принципах Feature-Driven Clean Architecture,
              детерминированной верификации фактов и надежного сохранения состояния тестирования.
            </p>
            <span className={styles.authorTechStack}>
              Стек: React 19 • JavaScript (ES6+) • Vite • Firebase • Vitest
            </span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <Logo variant="mark" size={18} />
          <span>PrepByte © 2026. Платформа подготовки к ЕНТ по Информатике.</span>
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
