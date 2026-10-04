import { Link, useParams } from 'react-router-dom';
import { useTeacherExamResults } from '../hooks/useTeacherExamResults';
import styles from './TeacherExamResultsPage.module.css';

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

function getStatusBadge(status) {
  switch (status) {
    case 'completed':
      return <span className={`${styles.badge} ${styles.badgeCompleted}`}>Завершён</span>;
    case 'disqualified':
      return <span className={`${styles.badge} ${styles.badgeDisqualified}`}>Аннулирован</span>;
    case 'in_progress':
      return <span className={`${styles.badge} ${styles.badgeInProgress}`}>● В процессе</span>;
    case 'waiting':
      return <span className={`${styles.badge} ${styles.badgeWaiting}`}>Ожидает</span>;
    case 'not_started':
    default:
      return <span className={`${styles.badge} ${styles.badgeNotStarted}`}>Не начал</span>;
  }
}

export function TeacherExamResultsPage() {
  const { examId } = useParams();
  const {
    exam,
    summary,
    participants,
    allParticipantsCount,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    isLoading,
    error,
  } = useTeacherExamResults({ examId });

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBox}>Загрузка результатов экзамена...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <Link to="/teacher/exams" className={styles.backLink}>
          &larr; Назад к экзаменам
        </Link>
        <div className={styles.errorBox}>{error}</div>
      </div>
    );
  }

  const scoreDist = summary?.scoreDistribution || {};
  const maxDistCount = Math.max(...Object.values(scoreDist), 1);
  const topicPerf = summary?.topicPerformance || {};

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/teacher/exams" className={styles.backLink}>
          &larr; Назад к экзаменам
        </Link>
        <h1 className={styles.title}>
          Результаты: {exam?.title || 'Экзамен'}
        </h1>
        <div className={styles.subtitle}>
          Группа: <strong>{exam?.groupName || 'Все'}</strong> • Вопросов:{' '}
          <strong>{exam?.totalQuestions || 0}</strong> • Статус:{' '}
          <strong>{exam?.status || 'draft'}</strong>
        </div>
      </header>

      {/* Summary KPI Cards Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Участников</div>
          <div className={styles.kpiValue}>{summary?.totalParticipants || 0}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Сдали</div>
          <div className={styles.kpiValue}>{summary?.completedCount || 0}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>В процессе</div>
          <div className={styles.kpiValue}>{summary?.inProgressCount || 0}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Не начали</div>
          <div className={styles.kpiValue}>
            {(summary?.notStartedCount || 0) + (summary?.waitingCount || 0)}
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Средний балл</div>
          <div className={styles.kpiValue}>{summary?.averageScore || 0}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Средний %</div>
          <div className={styles.kpiValue}>{summary?.averagePercentage || 0}%</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Макс. балл</div>
          <div className={styles.kpiValue}>{summary?.highestScore || 0}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Мин. балл</div>
          <div className={styles.kpiValue}>{summary?.lowestScore || 0}</div>
        </div>
      </div>

      {/* Analytics Visuals Grid */}
      <div className={styles.visualsGrid}>
        {/* Score Distribution Chart */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Распределение результатов</h2>
          <div className={styles.distContainer}>
            {Object.entries(scoreDist).map(([range, count]) => {
              const pctWidth = Math.round((count / maxDistCount) * 100);
              return (
                <div key={range} className={styles.distRow}>
                  <span className={styles.distLabel}>{range}</span>
                  <div className={styles.distBarBg}>
                    <div
                      className={styles.distBarFill}
                      style={{ width: `${pctWidth}%` }}
                    />
                  </div>
                  <span className={styles.distCount}>{count} чел.</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Topic Performance Chart */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Успеваемость по темам (класс)</h2>
          {Object.keys(topicPerf).length === 0 ? (
            <div className={styles.emptyChartBox}>Данные по темам отсутствуют</div>
          ) : (
            <div className={styles.topicsContainer}>
              {Object.entries(topicPerf).map(([tName, tPct]) => (
                <div key={tName} className={styles.topicRow}>
                  <span className={styles.topicName}>{tName}</span>
                  <div className={styles.topicBarBg}>
                    <div
                      className={styles.topicBarFill}
                      style={{ width: `${tPct}%` }}
                    />
                  </div>
                  <span className={styles.topicPct}>{tPct}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Participants List & Table (Requirements 6J) */}
      <div className={styles.card}>
        <div className={styles.tableHeaderRow}>
          <h2 className={styles.cardTitle}>
            Список участников ({allParticipantsCount})
          </h2>

          <div className={styles.filtersBar}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Поиск по имени ученика..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Все статусы</option>
              <option value="completed">Завершённые</option>
              <option value="disqualified">Аннулированные</option>
              <option value="in_progress">В процессе</option>
              <option value="waiting">Ожидают</option>
              <option value="not_started">Не начали</option>
            </select>

            <select
              className={styles.filterSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="score">Сортировка: Балл</option>
              <option value="percentage">Сортировка: Процент</option>
              <option value="studentName">Сортировка: Имя</option>
            </select>

            <button
              type="button"
              className={styles.sortOrderBtn}
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              title="Переключить порядок сортировки"
            >
              {sortOrder === 'asc' ? '▲ Возр.' : '▼ Убыв.'}
            </button>
          </div>
        </div>

        {participants.length === 0 ? (
          <div className={styles.emptyTableBox}>Участники не найдены.</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ученик</th>
                  <th>Статус</th>
                  <th>Попытка</th>
                  <th>Нарушения</th>
                  <th>Балл</th>
                  <th>Процент</th>
                  <th>Начало</th>
                  <th>Сдача</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.studentId}>
                    <td>
                      <strong className={styles.studentName}>{p.studentName}</strong>
                    </td>
                    <td>{getStatusBadge(p.status)}</td>
                    <td>
                      {p.attemptNumber ? `Attempt ${p.attemptNumber}` : '—'}
                    </td>
                    <td>
                      {p.status !== 'not_started' ? (
                        <span style={{ color: p.violationCount > 0 ? '#ef4444' : 'inherit' }}>
                          {p.violationCount || 0} / {p.maxViolations || 3}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {p.status === 'completed'
                        ? `${p.score} / ${p.maxPossibleScore}`
                        : '—'}
                    </td>
                    <td>
                      {p.status === 'completed' ? (
                        <strong className={styles.percentageText}>{p.percentage}%</strong>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{formatDate(p.startedAt)}</td>
                    <td>{formatDate(p.submittedAt)}</td>
                    <td>
                      {p.status !== 'not_started' ? (
                        <Link
                          to={`/teacher/exams/${examId}/results/${p.studentId}`}
                          className={styles.analyticsLink}
                        >
                          Аналитика &rarr;
                        </Link>
                      ) : (
                        <span className={styles.disabledLink}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
