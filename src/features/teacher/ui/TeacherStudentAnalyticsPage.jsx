import { Link, useParams } from 'react-router-dom';
import { useTeacherStudentAnalytics } from '../hooks/useTeacherStudentAnalytics';
import styles from './TeacherStudentAnalyticsPage.module.css';

function formatDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTimeOnly(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return '—';
  const mins = Math.floor(sec / 60);
  const remainderSec = Math.floor(sec % 60);
  return `${mins} мин ${remainderSec} сек`;
}

const VIOLATION_DESCRIPTIONS = {
  EXIT_FULLSCREEN: 'Выход из полноэкранного режима',
  TAB_SWITCH: 'Переключение вкладки браузера',
  WINDOW_BLUR: 'Потеря фокуса окна',
  COPY_ATTEMPT: 'Попытка копирования текста',
  CUT_ATTEMPT: 'Попытка вырезания текста',
  PASTE_ATTEMPT: 'Попытка вставки текста',
  CONTEXT_MENU: 'Попытка вызова контекстного меню',
  KEYBOARD_SHORTCUT: 'Использование системного сочетания клавиш',
};

export function TeacherStudentAnalyticsPage() {
  const { examId, studentId } = useParams();
  const {
    exam,
    student,
    attemptsList = [],
    violations = [],
    topicBreakdown,
    questions,
    selectedAttempt,
    setSelectedAttempt,
    isLoading,
    error,
  } = useTeacherStudentAnalytics({ examId, studentId });

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBox}>Загрузка аналитики ученика...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <Link to={`/teacher/exams/${examId}/results`} className={styles.backLink}>
          &larr; Назад к результатам экзамена
        </Link>
        <div className={styles.errorBox}>{error}</div>
      </div>
    );
  }

  const scorePct = student?.percentage || 0;
  const correctCount = student?.correctAnswersCount || 0;
  const incorrectCount = student?.incorrectAnswersCount || 0;
  const unansweredCount = student?.unansweredCount || 0;
  const totalQCount = questions.length || 1;

  const correctPct = Math.round((correctCount / totalQCount) * 100);
  const incorrectPct = Math.round((incorrectCount / totalQCount) * 100);
  const unansweredPct = Math.max(0, 100 - (correctPct + incorrectPct));

  const currentAttemptNum = student?.attemptNumber || 1;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to={`/teacher/exams/${examId}/results`} className={styles.backLink}>
          &larr; Назад к результатам экзамена
        </Link>
        <div className={styles.headerTitleRow}>
          <div>
            <h1 className={styles.title}>
              Аналитика ученика: {student?.studentName || studentId}
            </h1>
            <div className={styles.subtitle}>
              Экзамен: <strong>{exam?.title || 'Экзамен'}</strong> • Статус:{' '}
              <span className={styles.statusBadge}>{student?.status}</span>
            </div>
          </div>
        </div>

        {/* Attempt History Switcher (Requirement 6L) */}
        {attemptsList.length > 0 && (
          <div className={styles.attemptsBar}>
            <span className={styles.attemptsLabel}>Попытка:</span>
            <div className={styles.attemptsTabsWrapper}>
              {attemptsList.map((att) => {
                const isSelected = (selectedAttempt || currentAttemptNum) === att.attemptNumber;
                return (
                  <button
                    key={att.attemptNumber}
                    type="button"
                    className={`${styles.attemptTab} ${isSelected ? styles.attemptTabActive : ''}`}
                    onClick={() => setSelectedAttempt(att.attemptNumber)}
                  >
                    Попытка {att.attemptNumber} {att.status === 'disqualified' ? '(Аннулирован)' : `(${att.percentage}%)`}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Summary KPI Cards Grid (Linear / SaaS Style) */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Итоговый результат</div>
          <div className={styles.kpiValue}>
            {student?.score ?? 0} / {student?.maxPossibleScore ?? 0}
          </div>
          <div className={styles.kpiSub}>
            <span>{scorePct}% от максимального балла</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Ответы</div>
          <div className={styles.kpiAnswersRow}>
            <div className={styles.kpiAnswerStat}>
              <span className={styles.kpiAnswerValCorrect}>{correctCount}</span>
              <span className={styles.kpiAnswerLabel}>Верно</span>
            </div>
            <div className={styles.kpiAnswerDivider} />
            <div className={styles.kpiAnswerStat}>
              <span className={styles.kpiAnswerValIncorrect}>{incorrectCount}</span>
              <span className={styles.kpiAnswerLabel}>Ошибка</span>
            </div>
            <div className={styles.kpiAnswerDivider} />
            <div className={styles.kpiAnswerStat}>
              <span className={styles.kpiAnswerValUnanswered}>{unansweredCount}</span>
              <span className={styles.kpiAnswerLabel}>Пропуск</span>
            </div>
          </div>
          <div className={styles.kpiSub}>
            <span>Всего вопросов: {totalQCount}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Время и длительность</div>
          <div className={styles.kpiValue}>
            {formatDuration(student?.durationSeconds)}
          </div>
          <div className={styles.kpiSub}>
            <span>{formatDate(student?.startedAt)} → {formatDate(student?.submittedAt)}</span>
          </div>
        </div>
      </div>

      {/* Exam Security Block (Requirement 6K) */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.securityHeaderLeft}>
            <h2 className={styles.cardTitle}>Безопасность сессии</h2>
            <span className={styles.cardHint}>Контроль честности и прокторинг</span>
          </div>
          <div className={styles.securityBadges}>
            <span className={styles.securityBadge}>
              Попытка {student?.attemptNumber || 1} из 3
            </span>
            <span
              className={
                (student?.violationCount || 0) > 0
                  ? styles.securityBadgeWarn
                  : styles.securityBadgeGood
              }
            >
              Нарушений: {student?.violationCount || 0} / {student?.maxViolations || 3}
            </span>
            {student?.status === 'disqualified' && (
              <span className={styles.securityBadgeDanger}>
                Аннулирован ({student?.disqualificationReason || 'Превышен лимит'})
              </span>
            )}
          </div>
        </div>

        <div className={styles.timelineSection}>
          <div className={styles.timelineHeader}>
            <span className={styles.timelineTitle}>Хронология событий (Timeline)</span>
          </div>
          {violations.length === 0 ? (
            <div className={styles.emptyTimelineBox}>
              ✓ Нарушений во время этой попытки не зафиксировано
            </div>
          ) : (
            <div className={styles.timelineContainer}>
              {violations.map((viol) => (
                <div key={viol.id} className={styles.timelineItem}>
                  <span className={styles.timelineTime}>{formatTimeOnly(viol.timestamp)}</span>
                  <span className={styles.timelineLabel}>
                    {VIOLATION_DESCRIPTIONS[viol.type] || viol.type}
                  </span>
                  <span className={styles.timelineTypeCode}>{viol.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className={styles.visualsGrid}>
        {/* Score Overview Chart */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Обзор результатов по вопросам</h2>
            <span className={styles.cardHint}>Структура ответов</span>
          </div>

          <div className={styles.scoreOverviewBar}>
            {correctPct > 0 && (
              <div
                className={styles.segCorrect}
                style={{ width: `${correctPct}%` }}
                title={`Правильно: ${correctCount} (${correctPct}%)`}
              />
            )}
            {incorrectPct > 0 && (
              <div
                className={styles.segIncorrect}
                style={{ width: `${incorrectPct}%` }}
                title={`Неправильно: ${incorrectCount} (${incorrectPct}%)`}
              />
            )}
            {unansweredPct > 0 && (
              <div
                className={styles.segUnanswered}
                style={{ width: `${unansweredPct}%` }}
                title={`Пропущено: ${unansweredCount} (${unansweredPct}%)`}
              />
            )}
          </div>

          <div className={styles.chartLegend}>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotCorrect}`} />
              <span>Правильно: <strong>{correctCount}</strong> ({correctPct}%)</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotIncorrect}`} />
              <span>Ошибка: <strong>{incorrectCount}</strong> ({incorrectPct}%)</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotUnanswered}`} />
              <span>Пропущено: <strong>{unansweredCount}</strong> ({unansweredPct}%)</span>
            </div>
          </div>
        </div>

        {/* Topic Breakdown Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Успеваемость по темам</h2>
            <span className={styles.cardHint}>Процент освоения</span>
          </div>

          {Object.keys(topicBreakdown).length === 0 ? (
            <div className={styles.emptyBox}>Данные по темам отсутствуют</div>
          ) : (
            <div className={styles.topicsContainer}>
              {Object.entries(topicBreakdown).map(([tKey, tData]) => {
                const tScore = tData.score || 0;
                const tMax = tData.maxScore || 1;
                const tPct = tData.percentage ?? Math.round((tScore / tMax) * 100);
                return (
                  <div key={tKey} className={styles.progressItem}>
                    <div className={styles.progressHeader}>
                      <span className={styles.progressLabel}>{tKey}</span>
                      <span className={styles.progressValue}>
                        {tScore} / {tMax} б. ({tPct}%)
                      </span>
                    </div>
                    <div className={styles.progressBarTrack}>
                      <div
                        className={styles.progressBarFillPrimary}
                        style={{ width: `${tPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Questions Review (Requirement 5) */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Детальный разбор вопросов</h2>
            <span className={styles.cardHint}>Анализ ответов ученика с пояснениями</span>
          </div>
          <span className={styles.questionCounterBadge}>
            Вопросов: {questions.length}
          </span>
        </div>

        {questions.length === 0 ? (
          <div className={styles.emptyBox}>Список вопросов пуст.</div>
        ) : (
          <div className={styles.questionsList}>
            {questions.map((q) => {
              const isCorrect = q.status === 'correct';
              const isIncorrect = q.status === 'incorrect';

              return (
                <div
                  key={q.id || q.index}
                  className={`${styles.qCard} ${
                    isCorrect
                      ? styles.qCardCorrect
                      : isIncorrect
                        ? styles.qCardIncorrect
                        : styles.qCardUnanswered
                  }`}
                >
                  <div className={styles.qHeader}>
                    <div className={styles.qHeaderLeft}>
                      <span className={styles.qIndexBadge}>№ {q.index}</span>
                      {q.topic && <span className={styles.qTopicBadge}>{q.topic}</span>}
                      {q.difficulty && (
                        <span className={`${styles.diffTag} ${styles[`diff_${q.difficulty}`]}`}>
                          {q.difficulty}
                        </span>
                      )}
                    </div>
                    <div className={styles.qHeaderRight}>
                      <span
                        className={
                          isCorrect
                            ? styles.tagCorrect
                            : isIncorrect
                              ? styles.tagIncorrect
                              : styles.tagUnanswered
                        }
                      >
                        {isCorrect
                          ? `✓ Верно (${q.pointsAwarded}/${q.maxPoints} б.)`
                          : isIncorrect
                            ? `✗ Ошибка (${q.pointsAwarded}/${q.maxPoints} б.)`
                            : '— Не отвечен (0 б.)'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.qText}>{q.questionText}</div>

                  <div className={styles.optionsList}>
                    {Array.isArray(q.options) &&
                      q.options.map((optText, oIdx) => {
                        const isStudentChoice =
                          Array.isArray(q.studentAnswer) && q.studentAnswer.includes(oIdx);
                        const isCorrectChoice =
                          Array.isArray(q.correctAnswers) && q.correctAnswers.includes(oIdx);

                        let optClass = styles.optItem;
                        if (isStudentChoice && isCorrectChoice) {
                          optClass += ` ${styles.optStudentCorrect}`;
                        } else if (isStudentChoice && !isCorrectChoice) {
                          optClass += ` ${styles.optStudentIncorrect}`;
                        } else if (!isStudentChoice && isCorrectChoice) {
                          optClass += ` ${styles.optCorrectAnswer}`;
                        }

                        return (
                          <div key={oIdx} className={optClass}>
                            <span className={styles.optLetter}>
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className={styles.optText}>{optText}</span>
                            <div className={styles.optBadges}>
                              {isStudentChoice && (
                                <span className={styles.choiceBadge}>Выбор ученика</span>
                              )}
                              {isCorrectChoice && (
                                <span className={styles.correctBadge}>Правильный ответ</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {q.explanation && (
                    <div className={styles.explanationBox}>
                      <div className={styles.explanationHeader}>
                        <span className={styles.explanationIcon}>💡</span>
                        <strong className={styles.explanationTitle}>Пояснение к вопросу:</strong>
                      </div>
                      <div className={styles.explanationText}>{q.explanation}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
