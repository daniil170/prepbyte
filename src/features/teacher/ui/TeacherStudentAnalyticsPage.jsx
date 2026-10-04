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

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return '—';
  const mins = Math.floor(sec / 60);
  const remainderSec = Math.floor(sec % 60);
  return `${mins} мин ${remainderSec} сек`;
}

export function TeacherStudentAnalyticsPage() {
  const { examId, studentId } = useParams();
  const {
    exam,
    student,
    topicBreakdown,
    questions,
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to={`/teacher/exams/${examId}/results`} className={styles.backLink}>
          &larr; Назад к результатам экзамена
        </Link>
        <h1 className={styles.title}>
          Аналитика ученика: {student?.studentName || studentId}
        </h1>
        <div className={styles.subtitle}>
          Экзамен: <strong>{exam?.title || 'Экзамен'}</strong> • Статус:{' '}
          <span className={styles.statusBadge}>{student?.status}</span>
        </div>
      </header>

      {/* Summary KPI Cards Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Итоговый балл</div>
          <div className={styles.kpiValue}>
            {student?.score ?? 0} / {student?.maxPossibleScore ?? 0}
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Результат %</div>
          <div className={styles.kpiValue}>{scorePct}%</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Правильных</div>
          <div className={`${styles.kpiValue} ${styles.valCorrect}`}>{correctCount}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Неправильных</div>
          <div className={`${styles.kpiValue} ${styles.valIncorrect}`}>{incorrectCount}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Пропущено</div>
          <div className={`${styles.kpiValue} ${styles.valUnanswered}`}>{unansweredCount}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Длительность</div>
          <div className={styles.kpiValueSub}>
            {formatDuration(student?.durationSeconds)}
          </div>
        </div>
      </div>

      {/* Timestamps Card */}
      <div className={styles.timestampsCard}>
        <div>Время начала: <strong>{formatDate(student?.startedAt)}</strong></div>
        <div>Время сдачи: <strong>{formatDate(student?.submittedAt)}</strong></div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className={styles.visualsGrid}>
        {/* Score Overview Chart */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Обзор результатов по вопросам</h2>
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
              <span>Правильно: {correctCount}</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotIncorrect}`} />
              <span>Неправильно: {incorrectCount}</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.dotUnanswered}`} />
              <span>Пропущено: {unansweredCount}</span>
            </div>
          </div>
        </div>

        {/* Topic Performance Bar Chart */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Результативность по темам</h2>
          {Object.keys(topicBreakdown).length === 0 ? (
            <div className={styles.emptyBox}>Данные по темам отсутствуют</div>
          ) : (
            <div className={styles.topicsContainer}>
              {Object.entries(topicBreakdown).map(([tName, tData]) => {
                const tPct = tData.percentage ?? 0;
                return (
                  <div key={tName} className={styles.topicRow}>
                    <span className={styles.topicName}>{tName}</span>
                    <div className={styles.topicBarBg}>
                      <div
                        className={styles.topicBarFill}
                        style={{ width: `${tPct}%` }}
                      />
                    </div>
                    <span className={styles.topicPct}>
                      {tData.score} / {tData.maxScore} ({tPct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Question-by-Question Breakdown Table */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Детальный разбор вопросов ({questions.length})</h2>

        {questions.length === 0 ? (
          <div className={styles.emptyBox}>Детальные данные вопросов отсутствуют.</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Вопрос</th>
                  <th>Тема</th>
                  <th>Сложность</th>
                  <th>Ответ ученика</th>
                  <th>Правильный ответ</th>
                  <th>Статус</th>
                  <th>Баллы</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => {
                  const options = q.options || [];
                  const studentAnsText =
                    Array.isArray(q.studentAnswer) && q.studentAnswer.length > 0
                      ? q.studentAnswer.map((idx) => options[idx] || `Вариант ${idx + 1}`).join(', ')
                      : '— (нет ответа)';

                  const correctAnsText =
                    Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0
                      ? q.correctAnswers.map((idx) => options[idx] || `Вариант ${idx + 1}`).join(', ')
                      : '—';

                  let statusBadge = <span className={styles.tagUnanswered}>Пропущен</span>;
                  if (q.status === 'correct') {
                    statusBadge = <span className={styles.tagCorrect}>✓ Верно</span>;
                  } else if (q.status === 'incorrect') {
                    statusBadge = <span className={styles.tagIncorrect}>✕ Неверно</span>;
                  }

                  return (
                    <tr key={q.id || q.index}>
                      <td>
                        <strong>#{q.index}</strong>
                      </td>
                      <td className={styles.qCell}>
                        <div className={styles.qText}>{q.questionText}</div>
                        {q.explanation && (
                          <div className={styles.explanationText}>
                            <em>Пояснение:</em> {q.explanation}
                          </div>
                        )}
                      </td>
                      <td>{q.topic}</td>
                      <td>
                        <span className={`${styles.diffTag} ${styles[`diff_${q.difficulty}`] || ''}`}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td>
                        <span className={q.status === 'correct' ? styles.txtCorrect : q.status === 'incorrect' ? styles.txtIncorrect : ''}>
                          {studentAnsText}
                        </span>
                      </td>
                      <td>
                        <strong className={styles.txtCorrect}>{correctAnsText}</strong>
                      </td>
                      <td>{statusBadge}</td>
                      <td>
                        <strong>
                          {q.pointsAwarded} / {q.maxPoints}
                        </strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
