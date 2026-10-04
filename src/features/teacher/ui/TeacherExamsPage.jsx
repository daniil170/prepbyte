import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTeacherExams } from '../hooks/useTeacherExams';
import { CreateExamModal } from './CreateExamModal';
import { EXAM_STATUS } from '../domain/examLifecycle';
import styles from './TeacherExamsPage.module.css';

export function TeacherExamsPage() {
  const {
    exams,
    groups,
    statusFilter,
    setStatusFilter,
    isLoading,
    error,
    actionLoadingId,
    createExam,
    publishExam,
    startExam,
    finishExam,
    deleteExam,
  } = useTeacherExams();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusBadge = (status) => {
    switch (status) {
      case EXAM_STATUS.WAITING:
        return (
          <span className={`${styles.badge} ${styles.badgeWaiting}`}>
            Ожидание входа
          </span>
        );
      case EXAM_STATUS.ACTIVE:
        return (
          <span className={`${styles.badge} ${styles.badgeActive}`}>
            ● Идёт экзамен
          </span>
        );
      case EXAM_STATUS.FINISHED:
        return (
          <span className={`${styles.badge} ${styles.badgeFinished}`}>
            Завершён
          </span>
        );
      case EXAM_STATUS.DRAFT:
      default:
        return (
          <span className={`${styles.badge} ${styles.badgeDraft}`}>
            Черновик
          </span>
        );
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Экзамены и тестирования</h1>
          <p className={styles.subtitle}>
            Создание, запуск и мониторинг онлайн-экзаменов по 6-значному PIN-коду
          </p>
        </div>

        <Link
          to="/teacher/exams/new"
          className={`${styles.createButton} ${groups.length === 0 ? styles.disabledLink : ''}`}
          onClick={(e) => {
            if (groups.length === 0) e.preventDefault();
          }}
          title={
            groups.length === 0
              ? 'Сначала создайте группу во вкладке "Группы"'
              : 'Создать новый экзамен'
          }
        >
          + Создать экзамен
        </Link>
      </header>

      {/* Filter Tabs */}
      <div className={styles.filters}>
        {[
          { key: 'all', label: 'Все' },
          { key: EXAM_STATUS.ACTIVE, label: 'Активные' },
          { key: EXAM_STATUS.WAITING, label: 'Ожидают' },
          { key: EXAM_STATUS.DRAFT, label: 'Черновики' },
          { key: EXAM_STATUS.FINISHED, label: 'Завершённые' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.filterBtn} ${
              statusFilter === tab.key ? styles.filterBtnActive : ''
            }`}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className={styles.loadingBox}>Загрузка экзаменов...</div>
      )}

      {error && <div className={styles.errorBox}>{error}</div>}

      {!isLoading && !error && exams.length === 0 && (
        <div className={styles.emptyBox}>
          {statusFilter === 'all'
            ? 'У вас пока нет созданных экзаменов. Нажмите "+ Создать экзамен", чтобы подготовить тестирование.'
            : 'В этой категории пока нет экзаменов.'}
        </div>
      )}

      {!isLoading && !error && exams.length > 0 && (
        <div className={styles.examsGrid}>
          {exams.map((exam) => {
            const isActing = actionLoadingId === exam.id;

            return (
              <div key={exam.id} className={styles.examCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.examTitle}>{exam.title}</h3>
                  {getStatusBadge(exam.status)}
                </div>

                <div className={styles.cardDetails}>
                  <div className={styles.detailRow}>
                    <span>Группа:</span>
                    <strong>{exam.groupName || 'Все ученики'}</strong>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Заданий:</span>
                    <strong>{exam.totalQuestions}</strong>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Длительность:</span>
                    <strong>{exam.durationMinutes} мин</strong>
                  </div>

                  {(exam.status === EXAM_STATUS.WAITING ||
                    exam.status === EXAM_STATUS.ACTIVE) && (
                    <div className={styles.pinContainer}>
                      <span className={styles.pinLabel}>PIN для входа:</span>
                      <span className={styles.pinValue}>{exam.pin}</span>
                    </div>
                  )}
                </div>

                <div className={styles.cardActions}>
                  {exam.status === EXAM_STATUS.DRAFT && (
                    <button
                      type="button"
                      className={styles.primaryActionBtn}
                      onClick={() => publishExam(exam.id)}
                      disabled={isActing}
                    >
                      {isActing ? 'Публикация...' : 'Опубликовать (PIN)'}
                    </button>
                  )}

                  {exam.status === EXAM_STATUS.WAITING && (
                    <button
                      type="button"
                      className={styles.primaryActionBtn}
                      onClick={() => startExam(exam.id)}
                      disabled={isActing}
                    >
                      {isActing ? 'Запуск...' : 'Запустить экзамен ▶'}
                    </button>
                  )}

                  {exam.status === EXAM_STATUS.ACTIVE && (
                    <button
                      type="button"
                      className={styles.primaryActionBtn}
                      onClick={() => finishExam(exam.id)}
                      disabled={isActing}
                    >
                      {isActing ? 'Завершение...' : 'Завершить ⏹'}
                    </button>
                  )}

                  {exam.status === EXAM_STATUS.DRAFT && (
                    <Link
                      to={`/teacher/exams/${exam.id}/edit`}
                      className={styles.editLink}
                    >
                      Редактировать
                    </Link>
                  )}

                  <Link
                    to={`/teacher/exams/${exam.id}`}
                    className={styles.liveLink}
                  >
                    {exam.status === EXAM_STATUS.ACTIVE
                      ? 'Мониторинг LIVE →'
                      : exam.status === EXAM_STATUS.FINISHED
                      ? 'Результаты →'
                      : 'Подробнее →'}
                  </Link>

                  {exam.status === EXAM_STATUS.DRAFT && (
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => deleteExam(exam.id)}
                      disabled={isActing}
                      title="Удалить черновик"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateExamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={createExam}
        groups={groups}
      />
    </div>
  );
}
