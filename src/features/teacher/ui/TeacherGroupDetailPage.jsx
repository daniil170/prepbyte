import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTeacherGroupDetails } from '../hooks/useTeacherGroupDetails';
import { formatActivityDate } from '../domain/studentProfile';
import styles from './TeacherGroupDetailPage.module.css';

export function TeacherGroupDetailPage() {
  const { groupId } = useParams();
  const {
    group,
    students,
    loading,
    error,
    refresh,
    renameGroup,
    addStudentByEmailOrId,
    removeStudentFromGroup,
  } = useTeacherGroupDetails(groupId);

  // Rename state
  const [isRenaming, setIsRenaming] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  // Add student state
  const [searchQuery, setSearchQuery] = useState('');
  const [addError, setAddError] = useState(null);
  const [addSuccess, setAddSuccess] = useState(null);
  const [addLoading, setAddLoading] = useState(false);

  // Remove student state
  const [removingId, setRemovingId] = useState(null);

  const handleStartRename = () => {
    setEditedName(group?.name || '');
    setIsRenaming(true);
  };

  const handleSaveRename = async (e) => {
    e.preventDefault();
    if (!editedName.trim()) return;
    setRenameLoading(true);
    try {
      await renameGroup(editedName.trim());
      setIsRenaming(false);
    } catch (err) {
      alert(err?.message || 'Не удалось переименовать группу');
    } finally {
      setRenameLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setAddLoading(true);
    setAddError(null);
    setAddSuccess(null);
    try {
      const added = await addStudentByEmailOrId(searchQuery.trim());
      setAddSuccess(`Ученик ${added.displayName || added.email} успешно добавлен в группу.`);
      setSearchQuery('');
    } catch (err) {
      setAddError(err?.message || 'Не удалось прикрепить ученика');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId, studentName) => {
    if (!window.confirm(`Исключить ученика ${studentName || studentId} из группы?`)) {
      return;
    }
    setRemovingId(studentId);
    try {
      await removeStudentFromGroup(studentId);
    } catch (err) {
      alert(err?.message || 'Не удалось исключить ученика');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBox}>Загрузка данных группы...</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className={styles.page}>
        <Link to="/teacher/groups" className={styles.backLink}>
          &larr; Назад к группам
        </Link>
        <div className={styles.errorBox}>
          <p>{error || 'Группа не найдена'}</p>
          <button
            type="button"
            onClick={refresh}
            className={styles.button}
            style={{ marginTop: '12px' }}
          >
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link to="/teacher/groups" className={styles.backLink}>
        &larr; Назад к группам
      </Link>

      <header className={styles.groupHeader}>
        <div className={styles.titleArea}>
          {isRenaming ? (
            <form onSubmit={handleSaveRename} className={styles.renameForm}>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className={styles.input}
                autoFocus
                disabled={renameLoading}
              />
              <button
                type="submit"
                className={`${styles.button} ${styles.buttonPrimary}`}
                disabled={renameLoading}
              >
                {renameLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={() => setIsRenaming(false)}
                className={styles.button}
                disabled={renameLoading}
              >
                Отмена
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 className={styles.groupTitle}>{group.name}</h1>
              <button
                type="button"
                onClick={handleStartRename}
                className={styles.button}
                title="Переименовать группу"
              >
                ✎ Изменить
              </button>
            </div>
          )}

          <div className={styles.groupMeta}>
            Учеников: <strong>{students.length}</strong> &bull; Создана:{' '}
            {formatActivityDate(group.createdAt)}
          </div>
        </div>
      </header>

      {/* Add student card */}
      <section className={styles.addStudentCard} aria-label="Прикрепление ученика">
        <h2 className={styles.addStudentTitle}>Прикрепить ученика в группу</h2>
        <p className={styles.addStudentDescription}>
          Введите зарегистрированный email или UID ученика на платформе PrepByte.
        </p>

        <form onSubmit={handleAddStudent} className={styles.addStudentForm}>
          <input
            type="text"
            placeholder="student@example.com или UID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.addInput}
            disabled={addLoading}
          />
          <button
            type="submit"
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={addLoading || !searchQuery.trim()}
          >
            {addLoading ? 'Поиск...' : '+ Добавить в группу'}
          </button>
        </form>

        {addError && <p className={styles.errorText}>{addError}</p>}
        {addSuccess && <p className={styles.successText}>{addSuccess}</p>}
      </section>

      {/* Students Roster */}
      <section className={styles.section} aria-label="Состав группы">
        <h2 className={styles.sectionTitle}>Состав группы ({students.length})</h2>

        {students.length === 0 ? (
          <div className={styles.emptyBox}>
            <p>В этой группе пока нет учеников.</p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginTop: '6px' }}>
              Воспользуйтесь формой выше, чтобы добавить первых учеников.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Ученик</th>
                  <th className={styles.th}>Тестов</th>
                  <th className={styles.th}>Средний балл</th>
                  <th className={styles.th}>Лучший балл</th>
                  <th className={styles.th}>Посл. активность</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((st) => (
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
                      <span style={{ fontFamily: 'var(--font-mono)' }}>
                        {st.completedTestsCount}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {st.averageScore !== null ? `${st.averageScore} / 50` : '—'}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>
                        {st.bestScore !== null ? `${st.bestScore} / 50` : '—'}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span style={{ fontSize: '0.8125rem' }}>
                        {formatActivityDate(st.lastActivityAt)}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.actionsCell}>
                        <Link
                          to={`/teacher/students/${st.uid}`}
                          className={styles.detailLink}
                        >
                          Профиль &rarr;
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveStudent(st.uid, st.displayName || st.email)
                          }
                          className={styles.removeButton}
                          disabled={removingId === st.uid}
                        >
                          {removingId === st.uid ? '...' : 'Исключить'}
                        </button>
                      </div>
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
