import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '@shared/ui/ConfirmDialog/ConfirmDialog';
import { useTeacherGroups } from '../hooks/useTeacherGroups';
import { formatActivityDate } from '../domain/studentProfile';
import styles from './TeacherGroupsPage.module.css';

export function TeacherGroupsPage() {
  const { groups, loading, error, refresh, createGroup, deleteGroup } = useTeacherGroups();
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [createError, setCreateError] = useState(null);
  const [creatingSubmitting, setCreatingSubmitting] = useState(false);

  // Deletion modal state
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [deletingSubmitting, setDeletingSubmitting] = useState(false);

  const handleStartCreate = () => {
    setIsCreating(true);
    setNewGroupName('');
    setCreateError(null);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewGroupName('');
    setCreateError(null);
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      setCreateError('Название группы не может быть пустым');
      return;
    }

    setCreatingSubmitting(true);
    setCreateError(null);
    try {
      await createGroup(newGroupName.trim());
      setIsCreating(false);
      setNewGroupName('');
    } catch (err) {
      setCreateError(err?.message || 'Не удалось создать группу');
    } finally {
      setCreatingSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;
    setDeletingSubmitting(true);
    try {
      await deleteGroup(groupToDelete.id);
      setGroupToDelete(null);
    } catch (err) {
      alert(err?.message || 'Не удалось удалить группу');
    } finally {
      setDeletingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBox}>Загрузка учебных групп...</div>
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
          <h1 className={styles.title}>Учебные группы</h1>
          <p className={styles.subtitle}>
            Управление классами, потоками подготовки и прикрепленными учениками
          </p>
        </div>

        {!isCreating && (
          <button
            type="button"
            onClick={handleStartCreate}
            className={styles.createButton}
          >
            + Создать группу
          </button>
        )}
      </header>

      {isCreating && (
        <form onSubmit={handleSubmitCreate} className={styles.createCard}>
          <h3 className={styles.createCardTitle}>Новая учебная группа</h3>
          <input
            type="text"
            placeholder="Например: 11 «А» — Информатика ЕНТ"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className={styles.input}
            autoFocus
            disabled={creatingSubmitting}
          />
          {createError && <p className={styles.errorText}>{createError}</p>}
          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.createButton}
              disabled={creatingSubmitting}
            >
              {creatingSubmitting ? 'Создание...' : 'Сохранить группу'}
            </button>
            <button
              type="button"
              onClick={handleCancelCreate}
              className={styles.cancelButton}
              disabled={creatingSubmitting}
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {groups.length === 0 ? (
        <div className={styles.emptyBox}>
          <p>У вас еще нет созданных учебных групп.</p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '8px' }}>
            Создайте группу, чтобы прикрепить учеников и отслеживать их успеваемость.
          </p>
        </div>
      ) : (
        <div className={styles.groupsGrid}>
          {groups.map((grp) => {
            const studentCount = Array.isArray(grp.studentIds) ? grp.studentIds.length : 0;
            return (
              <div key={grp.id} className={styles.groupCard}>
                <div className={styles.groupHeader}>
                  <h2 className={styles.groupName}>{grp.name}</h2>
                  <span className={styles.groupStudentCount}>
                    {studentCount} {studentCount === 1 ? 'ученик' : 'учеников'}
                  </span>
                </div>

                <div className={styles.groupMeta}>
                  Создана: {formatActivityDate(grp.createdAt)}
                </div>

                <div className={styles.groupFooter}>
                  <Link to={`/teacher/groups/${grp.id}`} className={styles.openLink}>
                    Открыть группу &rarr;
                  </Link>

                  <button
                    type="button"
                    onClick={() => setGroupToDelete(grp)}
                    className={styles.deleteButton}
                    title="Удалить группу"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm deletion dialog */}
      <ConfirmDialog
        open={Boolean(groupToDelete)}
        title="Удалить учебную группу?"
        description={
          groupToDelete
            ? `Вы действительно хотите удалить группу «${groupToDelete.name}»? Данные учеников не будут удалены.`
            : ''
        }
        confirmLabel={deletingSubmitting ? 'Удаление...' : 'Удалить'}
        cancelLabel="Отмена"
        onConfirm={handleConfirmDelete}
        onCancel={() => setGroupToDelete(null)}
      />
    </div>
  );
}
