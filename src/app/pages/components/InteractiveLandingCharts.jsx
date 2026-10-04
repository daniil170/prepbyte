import { useState } from 'react';
import styles from './InteractiveLandingCharts.module.css';

const SCORE_PROGRESSION_DATA = [
  { attempt: 'Вариант 1', score: 26, date: '1 нед.', note: 'Диагностика' },
  { attempt: 'Вариант 3', score: 32, date: '2 нед.', note: 'Алгоритмы' },
  { attempt: 'Вариант 5', score: 38, date: '3 нед.', note: 'SQL и БД' },
  { attempt: 'Вариант 8', score: 43, date: '4 нед.', note: 'Сети и Архитектура' },
  { attempt: 'Вариант 12', score: 48, date: 'Финал', note: 'Боевая готовность' },
];

const TOPIC_RADAR_DATA = [
  { topic: 'Python и Алгоритмы', score: 94, questions: 12, category: 'core' },
  { topic: 'SQL и Базы данных', score: 90, questions: 8, category: 'db' },
  { topic: 'Компьютерные сети', score: 86, questions: 6, category: 'network' },
  { topic: 'Архитектура ЭВМ & Системы', score: 88, questions: 6, category: 'arch' },
  { topic: 'Формулы информации', score: 92, questions: 4, category: 'math' },
  { topic: 'Информационная безопасность', score: 95, questions: 4, category: 'sec' },
];

const EXAM_STRUCTURE_BREAKDOWN = [
  {
    type: 'Одиночный выбор',
    count: 30,
    weight: '30 баллов',
    desc: 'Задания 1–30: выбор 1 верного ответа из 4 вариантов с мгновенной верификацией.',
    pct: 60,
    color: 'var(--color-text)',
  },
  {
    type: 'Множественный выбор',
    count: 10,
    weight: '20 баллов',
    desc: 'Задания 31–40: частичный балл (до 2 баллов за вопрос) по регламенту НЦТ РК.',
    pct: 40,
    color: '#22c55e',
  },
];

/**
 * Interactive, high-fidelity analytical charts for the PrepByte showcase landing.
 * Visualizes dynamic score growth, topic mastery distribution, and official exam structure.
 * 100% SVG & CSS — zero dependencies, zero emojis.
 */
export function InteractiveLandingCharts() {
  const [activeTab, setActiveTab] = useState('progression'); // 'progression' | 'topics' | 'structure'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // SVG Area / Line dimensions for progression chart
  const svgWidth = 620;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;
  const maxScore = 50;

  const points = SCORE_PROGRESSION_DATA.map((d, index) => {
    const x = paddingX + (index / (SCORE_PROGRESSION_DATA.length - 1)) * graphWidth;
    const y = paddingY + graphHeight - (d.score / maxScore) * graphHeight;
    return { ...d, x, y };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingY + graphHeight} L ${points[0].x} ${paddingY + graphHeight} Z`;

  return (
    <div className={styles.container}>
      {/* Tab Selector */}
      <div className={styles.tabBar} role="tablist" aria-label="Интерактивные аналитические графики">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'progression'}
          onClick={() => setActiveTab('progression')}
          className={`${styles.tabBtn} ${activeTab === 'progression' ? styles.tabBtnActive : ''}`}
        >
          Динамика роста (+22 балла)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'topics'}
          onClick={() => setActiveTab('topics')}
          className={`${styles.tabBtn} ${activeTab === 'topics' ? styles.tabBtnActive : ''}`}
        >
          Освоение 12 тем ЕНТ
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'structure'}
          onClick={() => setActiveTab('structure')}
          className={`${styles.tabBtn} ${activeTab === 'structure' ? styles.tabBtnActive : ''}`}
        >
          Архитектура 50 баллов
        </button>
      </div>

      {/* Tab 1: Dynamic Score Progression Chart */}
      {activeTab === 'progression' && (
        <div className={styles.chartCard} data-testid="chart-progression">
          <div className={styles.chartHeader}>
            <div>
              <div className={styles.chartBadge}>Спецификация НЦТ РК</div>
              <h3 className={styles.chartTitle}>Прогнозируемый рост баллов</h3>
            </div>
            <div className={styles.kpiValueWrapper}>
              <span className={styles.kpiBigNumber}>48</span>
              <span className={styles.kpiSubLabel}>/ 50 баллов</span>
            </div>
          </div>

          <p className={styles.chartDesc}>
            Анализ динамики учеников при решении верифицированных вариантов: алгоритм адаптивно ликвидирует
            пробелы в темах, повышая средний балл с 26 до 48 за 4 недели целевой подготовки.
          </p>

          <div className={styles.svgWrapper}>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className={styles.progressionSvg}
              aria-label="График динамики баллов от 26 до 48"
            >
              <defs>
                <linearGradient id="prepbyte-area-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.32" />
                  <stop offset="60%" stopColor="#22c55e" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>

                <linearGradient id="prepbyte-line-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#eab308" />
                  <stop offset="50%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#4ade80" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Grid lines */}
              {[10, 20, 30, 40, 50].map((score) => {
                const y = paddingY + graphHeight - (score / maxScore) * graphHeight;
                return (
                  <g key={score} className={styles.gridGroup}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="var(--color-border)"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      fill="var(--color-text-muted)"
                      fontSize="10"
                      textAnchor="end"
                      fontFamily="var(--font-mono)"
                    >
                      {score}
                    </text>
                  </g>
                );
              })}

              {/* Shaded Area fill */}
              <path d={areaD} fill="url(#prepbyte-area-gradient)" />

              {/* Glowing trend curve */}
              <path
                d={pathD}
                fill="none"
                stroke="url(#prepbyte-line-gradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Coordinate Nodes */}
              {points.map((pt, idx) => {
                const isHovered = hoveredPoint === idx;
                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredPoint(idx)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Pulsing ring on the final target node */}
                    {idx === points.length - 1 && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="10"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="1.5"
                        opacity="0.45"
                        className={styles.pulseRing}
                      />
                    )}

                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4.5}
                      fill="var(--color-bg)"
                      stroke="#22c55e"
                      strokeWidth="2.5"
                      style={{ transition: 'all 0.15s ease' }}
                    />

                    {/* Value Badge label */}
                    <text
                      x={pt.x}
                      y={pt.y - 12}
                      textAnchor="middle"
                      fill="var(--color-text)"
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="var(--font-mono)"
                    >
                      {pt.score} б.
                    </text>

                    {/* X axis milestone caption */}
                    <text
                      x={pt.x}
                      y={paddingY + graphHeight + 16}
                      textAnchor="middle"
                      fill="var(--color-text-muted)"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                    >
                      {pt.date}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className={styles.chartFootnote}>
            <span className={styles.footnoteItem}>
              <span className={styles.legendDot} style={{ backgroundColor: '#22c55e' }} />
              Фактический балл
            </span>
            <span className={styles.footnoteItem}>
              <span className={styles.legendDot} style={{ backgroundColor: 'var(--color-border-strong)' }} />
              Порог 50 баллов ЕНТ
            </span>
            <span className={styles.footnoteRight}>
              Прирост: <strong>+84.6%</strong> верных ответов
            </span>
          </div>
        </div>
      )}

      {/* Tab 2: Topic Mastery Breakdown */}
      {activeTab === 'topics' && (
        <div className={styles.chartCard} data-testid="chart-topics">
          <div className={styles.chartHeader}>
            <div>
              <div className={styles.chartBadge}>Баланс знаний</div>
              <h3 className={styles.chartTitle}>Освоение профильных дисциплин</h3>
            </div>
            <div className={styles.kpiValueWrapper}>
              <span className={styles.kpiBigNumber}>92%</span>
              <span className={styles.kpiSubLabel}>средний индекс</span>
            </div>
          </div>

          <p className={styles.chartDesc}>
            PrepByte контролирует процент решения по всем 12 модулям ЕНТ. Ни одна критическая тема не останется
            без разбора типичных дистракторов и боевых тестов.
          </p>

          <div className={styles.topicsList}>
            {TOPIC_RADAR_DATA.map((item, idx) => (
              <div key={idx} className={styles.topicRow}>
                <div className={styles.topicMeta}>
                  <span className={styles.topicLabel}>{item.topic}</span>
                  <div className={styles.topicNumbers}>
                    <span className={styles.topicQuestions}>
                      {item.questions} заданий в пуле
                    </span>
                    <span className={styles.topicPct}>{item.score}%</span>
                  </div>
                </div>

                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${item.score}%`,
                      backgroundColor: item.score >= 90 ? '#22c55e' : '#eab308',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Official 50-Score Exam Structure */}
      {activeTab === 'structure' && (
        <div className={styles.chartCard} data-testid="chart-structure">
          <div className={styles.chartHeader}>
            <div>
              <div className={styles.chartBadge}>Спецификация теста</div>
              <h3 className={styles.chartTitle}>Структура экзаменационного варианта</h3>
            </div>
            <div className={styles.kpiValueWrapper}>
              <span className={styles.kpiBigNumber}>40</span>
              <span className={styles.kpiSubLabel}>заданий / 60 мин</span>
            </div>
          </div>

          <p className={styles.chartDesc}>
            Каждый сгенерированный вариант на 100% повторяет реальный тест Единого национального тестирования
            по весу заданий, таймингу и алгоритму частичного оценивания.
          </p>

          <div className={styles.structureGrid}>
            {EXAM_STRUCTURE_BREAKDOWN.map((sec, idx) => (
              <div key={idx} className={styles.structureCard}>
                <div className={styles.structureHeader}>
                  <span className={styles.structureType}>{sec.type}</span>
                  <span className={styles.structureWeight}>{sec.weight}</span>
                </div>
                <div className={styles.structureCountRow}>
                  <span className={styles.structureCount}>{sec.count}</span>
                  <span className={styles.structureUnits}>заданий</span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${sec.pct}%`,
                      backgroundColor: sec.color,
                    }}
                  />
                </div>
                <p className={styles.structureDesc}>{sec.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
