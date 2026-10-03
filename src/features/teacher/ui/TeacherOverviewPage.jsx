import { Link } from 'react-router-dom';
import { useTeacherOverview } from '../hooks/useTeacherOverview';
import styles from './TeacherOverviewPage.module.css';

export function TeacherOverviewPage() {
  const { overview, loading, error, refresh } = useTeacherOverview();

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBox}>Загрузка аналитики учителя...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>
          <p>{error}</p>
          <button type="button" onClick={refresh} className={styles.actionButton} style={{ marginTop: '12px' }}>
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  const kpis = overview?.kpis || {
    totalStudents: 0,
    totalGroups: 0,
    averageScore: null,
    completedTestsCount: 0,
    activeStudentsLast7Days: 0,
  };

  const recentStudents = overview?.recentStudents || [];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Общая сводка</h1>
          <p className={styles.subtitle}>
            Сводные показатели успеваемости по всем учебным группам и ученикам
          </p>
        </div>

        <div className={styles.actions}>
          <Link to="/teacher/groups" className={styles.actionButton}>
            + Создать группу
          </Link>
          <Link to="/teacher/students" className={`${styles.actionButton} ${styles.actionButtonPrimary}`}>
            Все ученики &rarr;
          </Link>
        </div>
      </header>

      {/* KPI Grid */}
      <section className={styles.kpiGrid} aria-label="Ключевые показатели">
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Всего учеников</span>
          <span className={styles.kpiValue}>{kpis.totalStudents}</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Учебных групп</span>
          <span className={styles.kpiValue}>{kpis.totalGroups}</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Средний балл</span>
          <span className={styles.kpiValue}>
            {kpis.averageScore !== null ? kpis.averageScore : '—'}
            {kpis.averageScore !== null && <span className={styles.kpiScale}>/ 50</span>}
          </span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Завершено тестов</span>
          <span className={styles.kpiValue}>{kpis.completedTestsCount}</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Активны (7 дней)</span>
          <span className={styles.kpiValue}>{kpis.activeStudentsLast7Days}</span>
        </div>
      </section>

      {/* Recent Students Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Недавние ученики</h2>
          {recentStudents.length > 0 && (
            <Link to="/teacher/students" className={styles.viewAllLink}>
              Смотреть всех ({kpis.totalStudents}) &rarr;
            </Link>
          )}
        </div>

        {recentStudents.length === 0 ? (
          <div className={styles.emptyBox}>
            <p>У вас пока нет прикрепленных учеников.</p>
            <p className={styles.emptyText}>
              Создайте группу в разделе «Группы» и добавьте учеников по их зарегистрированному email или UID.
            </p>
            <Link to="/teacher/groups" className={`${styles.actionButton} ${styles.actionButtonPrimary}`}>
              Перейти к группам
            </Link>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Ученик</th>
                  <th className={styles.th}>Школа / Класс</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Действие</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.map((st) => (
                  <tr key={st.uid} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.studentCell}>
                        <span className={styles.studentName}>
                          {st.displayName || 'Без имени'}
                        </span>
                        <span className={styles.studentEmail}>{st.email}</span>
                      </div>
                    </td>
                    <td className={styles.td}>
                      {st.school ? `${st.school}${st.grade ? `, ${st.grade} класс` : ''}` : '—'}
                    </td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>
                      <Link to={`/teacher/students/${st.uid}`} className={styles.detailLink}>
                        Профиль &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
