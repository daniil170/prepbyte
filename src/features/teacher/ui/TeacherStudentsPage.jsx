import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTeacherStudents } from '../hooks/useTeacherStudents';
import { formatActivityDate } from '../domain/studentProfile';
import styles from './TeacherStudentsPage.module.css';

export function TeacherStudentsPage() {
  const { students, groups, loading, error, refresh } = useTeacherStudents();
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Group filter
      if (selectedGroupId !== 'all') {
        const isInGroup =
          Array.isArray(student.groupIds) && student.groupIds.includes(selectedGroupId);
        if (!isInGroup) return false;
      }

      // Search query (name or email)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const name = (student.displayName || '').toLowerCase();
        const email = (student.email || '').toLowerCase();
        if (!name.includes(query) && !email.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [students, selectedGroupId, searchQuery]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBox}>Загрузка списка учеников...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>
          <p>{error}</p>
          <button
            type="button"
            onClick={refresh}
            style={{
              marginTop: '12px',
              padding: '6px 12px',
              fontFamily: 'var(--font-mono)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              cursor: 'pointer',
            }}
          >
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Ученики</h1>
          <p className={styles.subtitle}>
            Список всех учеников с подробной статистикой и историей прохождения тестов
          </p>
        </div>

        <div className={styles.controls}>
          <input
            type="search"
            placeholder="Поиск по имени или email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            aria-label="Поиск по имени или email"
          />

          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className={styles.filterSelect}
            aria-label="Фильтр по группе"
          >
            <option value="all">Все группы ({groups.length})</option>
            {groups.map((grp) => (
              <option key={grp.id} value={grp.id}>
                {grp.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {filteredStudents.length === 0 ? (
        <div className={styles.emptyBox}>
          <p>
            {students.length === 0
              ? 'У вас пока нет учеников. Добавьте учеников в одну из групп.'
              : 'По заданным фильтрам ученики не найдены.'}
          </p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Ученик</th>
                <th className={styles.th}>Группы</th>
                <th className={styles.th}>Тестов</th>
                <th className={styles.th}>Средний балл</th>
                <th className={styles.th}>Лучший балл</th>
                <th className={styles.th}>Посл. активность</th>
                <th className={styles.th}>Статус</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>
                  Действие
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((st) => (
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
                    {st.groupNames && st.groupNames.length > 0 ? (
                      <div className={styles.groupBadges}>
                        {st.groupNames.map((name, i) => (
                          <span key={i} className={styles.groupBadge}>
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                    )}
                  </td>
                  <td className={styles.td}>
                    <span className={styles.scoreValue}>{st.completedTestsCount}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.scoreValue}>
                      {st.averageScore !== null ? `${st.averageScore} / 50` : '—'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.scoreValue}>
                      {st.bestScore !== null ? `${st.bestScore} / 50` : '—'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span style={{ fontSize: '0.8125rem' }}>
                      {formatActivityDate(st.lastActivityAt)}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span
                      className={
                        st.isActiveInLast7Days ? styles.statusActive : styles.statusInactive
                      }
                    >
                      {st.isActiveInLast7Days ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <Link
                      to={`/teacher/students/${st.uid}`}
                      className={styles.detailLink}
                    >
                      Подробнее &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
