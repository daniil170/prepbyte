import { Link, useParams } from 'react-router-dom';
import { useTeacherExamLive } from '../hooks/useTeacherExamLive';
import { EXAM_STATUS } from '../domain/examLifecycle';
import styles from './TeacherExamLivePage.module.css';

export function TeacherExamLivePage() {
  const { examId } = useParams();
  const {
    exam,
    group,
    sessions,
    stats,
    isLoading,
    error,
    actionLoading,
    publishExam,
    startExam,
    finishExam,
  } = useTeacherExamLive(examId);

  if (isLoading) {
    return <div className={styles.loadingBox}>Загрузка данных экзамена...</div>;
  }

  if (error || !exam) {
    return (
      <div className={styles.errorBox}>
        {error || 'Экзамен не найден или у вас нет прав доступа к нему.'}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link to="/teacher/exams" className={styles.backLink}>
        ← Все экзамены
      </Link>

      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{exam.title}</h1>
          <div className={styles.metaRow}>
            <span>Группа: <strong>{group?.name || exam.groupName || 'Группа'}</strong></span>
            <span>Заданий: <strong>{exam.totalQuestions}</strong></span>
            <span>Длительность: <strong>{exam.durationMinutes} мин</strong></span>
            <span>Статус: <strong>{exam.status}</strong></span>
          </div>
        </div>

        {(exam.status === EXAM_STATUS.WAITING ||
          exam.status === EXAM_STATUS.ACTIVE) && (
          <div className={styles.pinBanner}>
            <span className={styles.pinLabel}>PIN для учеников</span>
            <span className={styles.pinValue}>{exam.pin}</span>
          </div>
        )}

        <div className={styles.headerControls}>
          {exam.status === EXAM_STATUS.DRAFT && (
            <button
              type="button"
              className={styles.actionBtn}
              onClick={publishExam}
              disabled={actionLoading}
            >
              {actionLoading ? 'Ожидание...' : 'Опубликовать (PIN)'}
            </button>
          )}

          {exam.status === EXAM_STATUS.WAITING && (
            <button
              type="button"
              className={styles.actionBtn}
              onClick={startExam}
              disabled={actionLoading}
            >
              {actionLoading ? 'Запуск...' : 'Запустить экзамен ▶'}
            </button>
          )}

          {exam.status === EXAM_STATUS.ACTIVE && (
            <button
              type="button"
              className={styles.actionBtn}
              onClick={finishExam}
              disabled={actionLoading}
            >
              {actionLoading ? 'Завершение...' : 'Завершить экзамен ⏹'}
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.totalEnrolled}</span>
          <span className={styles.statLabel}>Всего в группе</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.joinedCount}</span>
          <span className={styles.statLabel}>Присоединились</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.inProgressCount}</span>
          <span className={styles.statLabel}>Пишут тест</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.submittedCount}</span>
          <span className={styles.statLabel}>Завершили</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>
            {stats.gradedCount > 0 ? `${stats.averageScore} б.` : '—'}
          </span>
          <span className={styles.statLabel}>Средний балл</span>
        </div>
      </div>

      {/* Live Participants Table */}
      <div className={styles.tableContainer}>
        <h2 className={styles.tableTitle}>
          Участники тестирования ({sessions.length})
        </h2>

        {sessions.length === 0 ? (
          <div className={styles.emptyBox}>
            Пока ни один ученик не ввёл PIN-код экзамена.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Ученик</th>
                <th className={styles.th}>Статус</th>
                <th className={styles.th}>Отвечено</th>
                <th className={styles.th}>Результат</th>
                <th className={styles.th}>Время</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const answeredCount = Object.keys(s.answers || {}).length;

                return (
                  <tr key={s.id}>
                    <td className={styles.td}>
                      <strong>{s.studentName || s.studentId}</strong>
                    </td>
                    <td className={styles.td}>
                      {s.status === 'waiting' && (
                        <span className={styles.statusWaiting}>Ожидает</span>
                      )}
                      {s.status === 'in_progress' && (
                        <span className={styles.statusInProgress}>
                          ● В процессе
                        </span>
                      )}
                      {s.status === 'submitted' && (
                        <span className={styles.statusSubmitted}>
                          ✓ Завершил
                        </span>
                      )}
                    </td>
                    <td className={styles.td}>
                      {answeredCount} / {exam.totalQuestions}
                    </td>
                    <td className={styles.td}>
                      {s.status === 'submitted' && typeof s.totalScore === 'number' ? (
                        <span className={styles.scoreBadge}>
                          {s.totalScore} б. ({s.percentage}%)
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={styles.td}>
                      {s.submittedAt
                        ? new Date(s.submittedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : s.startedAt
                        ? `Начал в ${new Date(s.startedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
