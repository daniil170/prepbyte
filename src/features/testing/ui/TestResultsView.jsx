import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTopicLabel } from '@features/question-bank';
import { Logo } from '@shared/ui/Logo/Logo';
import { calculateExamScore } from '../domain/scoringEngine';
import { QuestionContent } from './QuestionContent';
import styles from './TestResultsView.module.css';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function TestResultsView({ session, questions = [] }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'mistakes' | 'partial' | 'correct'
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  // Derive complete score evaluation
  const scoreData = useMemo(() => {
    if (session?.score && Array.isArray(session?.questionSnapshots)) {
      return {
        ...session.score,
        detailedResults: session.questionSnapshots,
      };
    }
    return calculateExamScore(session, questions);
  }, [session, questions]);

  const {
    totalScore = 0,
    maxPossibleScore = 50,
    percentage = 0,
    passed = false,
    byTopicBreakdown = {},
    detailedResults = [],
  } = scoreData;

  // Question counts
  const totalQuestions = detailedResults.length;
  const correctCount = detailedResults.filter((r) => r.isCorrect).length;
  const partialCount = detailedResults.filter(
    (r) => r.isPartiallyCorrect
  ).length;
  const mistakeCount = detailedResults.filter(
    (r) => !r.isCorrect && !r.isPartiallyCorrect
  ).length;

  // Filtered results
  const filteredResults = useMemo(() => {
    return detailedResults.filter((result) => {
      if (filter === 'mistakes') {
        return !result.isCorrect && !result.isPartiallyCorrect;
      }
      if (filter === 'partial') {
        return result.isPartiallyCorrect;
      }
      if (filter === 'correct') {
        return result.isCorrect;
      }
      return true;
    });
  }, [detailedResults, filter]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (expandedIds.size === filteredResults.length) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(filteredResults.map((r) => r.id)));
    }
  };

  const topicEntries = useMemo(() => {
    return Object.values(byTopicBreakdown).sort(
      (a, b) => b.percentage - a.percentage
    );
  }, [byTopicBreakdown]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/" className={styles.homeLink} title="PrepByte Главная">
            <Logo variant="mark" size={24} />
          </Link>
          <span className={styles.headerTitle}>Результаты тестирования</span>
        </div>

        <div className={styles.headerRight}>
          <Link to="/" className={styles.backHomeButton}>
            ← На главную
          </Link>
        </div>
      </header>

      <main className={styles.mainContent}>
        {/* Score Summary Card */}
        <section className={styles.summaryCard} aria-label="Итоги тестирования">
          <div className={styles.summaryHeader}>
            <div className={styles.summaryScoreBlock}>
              <span className={styles.summaryLabel}>
                Итоговый балл (ЕНТ Информатика)
              </span>
              <div className={styles.scoreValueRow}>
                <span className={styles.scoreNumber}>{totalScore}</span>
                <span className={styles.scoreMax}>/ {maxPossibleScore}</span>
                <span className={styles.scorePercentage}>({percentage}%)</span>
              </div>
            </div>

            <div
              className={`${styles.statusBadge} ${
                passed ? styles.statusPassed : styles.statusFailed
              }`}
            >
              <span aria-hidden="true">{passed ? '✓' : '✗'}</span>
              <span>{passed ? 'Тест сдан' : 'Пороговый балл не набран'}</span>
            </div>
          </div>

          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <span className={styles.metricTitle}>Всего вопросов</span>
              <span className={styles.metricValue}>{totalQuestions}</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricTitle}>Полный балл</span>
              <span className={styles.metricValue}>{correctCount}</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricTitle}>Частичный балл</span>
              <span className={styles.metricValue}>{partialCount}</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricTitle}>Ошибки</span>
              <span className={styles.metricValue}>{mistakeCount}</span>
            </div>
          </div>
        </section>

        {/* Topic Breakdown Section */}
        {topicEntries.length > 0 ? (
          <section
            className={styles.section}
            aria-label="Распределение баллов по темам"
          >
            <h2 className={styles.sectionHeading}>Результаты по темам</h2>

            <div className={styles.topicsGrid}>
              {topicEntries.map((topicData) => {
                const label =
                  getTopicLabel(topicData.topic) || topicData.topic;
                const isStrong = topicData.percentage >= 75;
                const isWeak = topicData.percentage < 50;

                return (
                  <div key={topicData.topic} className={styles.topicCard}>
                    <div className={styles.topicCardHeader}>
                      <h3 className={styles.topicName}>{label}</h3>
                      <span className={styles.topicScoreBadge}>
                        {topicData.score} / {topicData.maxScore} б.
                      </span>
                    </div>

                    <div className={styles.progressBarTrack}>
                      <div
                        className={styles.progressBarFill}
                        style={{ width: `${topicData.percentage}%` }}
                      />
                    </div>

                    <div className={styles.topicFooter}>
                      <span>
                        {topicData.correctCount} из {topicData.totalQuestions}{' '}
                        верно
                      </span>
                      <span
                        className={`${styles.topicPerformanceTag} ${
                          isStrong
                            ? styles.strongTopic
                            : isWeak
                              ? styles.weakTopic
                              : ''
                        }`}
                      >
                        {topicData.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Detailed Question Review */}
        <section
          className={styles.section}
          aria-label="Подробный разбор заданий"
        >
          <div className={styles.sectionHeading}>
            <span>Разбор заданий</span>
            <button
              type="button"
              onClick={toggleAll}
              className={styles.filterButton}
            >
              {expandedIds.size === filteredResults.length
                ? 'Свернуть все'
                : 'Развернуть все'}
            </button>
          </div>

          <div className={styles.filterBar} role="tablist">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`${styles.filterButton} ${
                filter === 'all' ? styles.filterButtonActive : ''
              }`}
            >
              Все ({totalQuestions})
            </button>
            <button
              type="button"
              onClick={() => setFilter('mistakes')}
              className={`${styles.filterButton} ${
                filter === 'mistakes' ? styles.filterButtonActive : ''
              }`}
            >
              Ошибки ({mistakeCount})
            </button>
            {partialCount > 0 ? (
              <button
                type="button"
                onClick={() => setFilter('partial')}
                className={`${styles.filterButton} ${
                  filter === 'partial' ? styles.filterButtonActive : ''
                }`}
              >
                Частично ({partialCount})
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setFilter('correct')}
              className={`${styles.filterButton} ${
                filter === 'correct' ? styles.filterButtonActive : ''
              }`}
            >
              Верно ({correctCount})
            </button>
          </div>

          <div className={styles.questionList}>
            {filteredResults.map((result, idx) => {
              const isExpanded =
                expandedIds.has(result.id) ||
                (!result.isCorrect && !result.isPartiallyCorrect);
              const pointsClass = result.isCorrect
                ? styles.pointsFull
                : result.isPartiallyCorrect
                  ? styles.pointsPartial
                  : styles.pointsZero;

              const pointsText = result.isCorrect
                ? `+${result.pointsAwarded} / ${result.maxPoints} б.`
                : result.isPartiallyCorrect
                  ? `+${result.pointsAwarded} / ${result.maxPoints} б.`
                  : `0 / ${result.maxPoints} б.`;

              const topicTitle =
                getTopicLabel(result.topic) || result.topic;

              return (
                <article key={result.id} className={styles.reviewCard}>
                  <button
                    type="button"
                    onClick={() => toggleExpand(result.id)}
                    className={styles.reviewCardHeader}
                    aria-expanded={isExpanded}
                  >
                    <div className={styles.reviewHeaderLeft}>
                      <span className={styles.questionNumber}>
                        #{idx + 1}
                      </span>
                      <span className={styles.reviewTopicBadge}>
                        {topicTitle}
                      </span>
                    </div>

                    <div className={styles.reviewHeaderRight}>
                      <span
                        className={`${styles.pointsBadge} ${pointsClass}`}
                      >
                        {pointsText}
                      </span>
                      <span
                        className={`${styles.expandIcon} ${
                          isExpanded ? styles.expandIconOpen : ''
                        }`}
                        aria-hidden="true"
                      >
                        ▼
                      </span>
                    </div>
                  </button>

                  {isExpanded ? (
                    <div className={styles.reviewCardBody}>
                      <QuestionContent text={result.questionText} />

                      <div className={styles.optionsSection}>
                        <h4 className={styles.optionsTitle}>
                          {result.isMultipleChoice
                            ? 'Варианты ответов (несколько вариантов)'
                            : 'Варианты ответов'}
                        </h4>

                        {result.options.map((option, optIdx) => {
                          const isUserSelected =
                            result.userAnswers.includes(optIdx);
                          const isCorrectOption =
                            result.correctAnswers.includes(optIdx);

                          let optionStyle = styles.optionItem;
                          if (isUserSelected && isCorrectOption) {
                            optionStyle = `${styles.optionItem} ${styles.optionSelectedCorrect}`;
                          } else if (isUserSelected && !isCorrectOption) {
                            optionStyle = `${styles.optionItem} ${styles.optionSelectedIncorrect}`;
                          } else if (!isUserSelected && isCorrectOption) {
                            optionStyle = `${styles.optionItem} ${styles.optionMissedCorrect}`;
                          }

                          return (
                            <div key={optIdx} className={optionStyle}>
                              <div className={styles.optionLeft}>
                                <span className={styles.optionLetter}>
                                  {OPTION_LETTERS[optIdx] || optIdx + 1}.
                                </span>
                                <span className={styles.optionText}>
                                  {option}
                                </span>
                              </div>

                              <div className={styles.optionTags}>
                                {isUserSelected && isCorrectOption ? (
                                  <span className={styles.tagCorrect}>
                                    ✓ Ваш ответ
                                  </span>
                                ) : null}
                                {isUserSelected && !isCorrectOption ? (
                                  <span className={styles.tagUserMistake}>
                                    ✗ Ваш ответ
                                  </span>
                                ) : null}
                                {!isUserSelected && isCorrectOption ? (
                                  <span className={styles.tagCorrect}>
                                    Правильный
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {result.explanation ? (
                        <div className={styles.explanationBox}>
                          <h4 className={styles.explanationTitle}>
                            Пояснение к решению
                          </h4>
                          <p className={styles.explanationText}>
                            {result.explanation}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
