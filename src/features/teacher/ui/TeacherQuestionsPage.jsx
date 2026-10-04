import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getTopicLabel,
  isMultipleAnswer,
  listTopics,
} from '@features/question-bank';
import { ConfirmDialog } from '@shared/ui/ConfirmDialog/ConfirmDialog';
import { useTeacherQuestions } from '../hooks/useTeacherQuestions';
import styles from './TeacherQuestionsPage.module.css';

const DIFFICULTY_MAP = {
  easy: 'Лёгкая',
  medium: 'Средняя',
  hard: 'Сложная',
};

export function TeacherQuestionsPage() {
  const {
    filteredQuestions,
    isLoading,
    error,
    actionError,
    setActionError,
    searchQuery,
    setSearchQuery,
    selectedTopic,
    setSelectedTopic,
    selectedDifficulty,
    setSelectedDifficulty,
    selectedType,
    setSelectedType,
    selectedStatus,
    setSelectedStatus,
    deleteQuestion,
  } = useTeacherQuestions();

  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const topics = listTopics();

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    setActionError(null);
    const result = await deleteQuestion(deletingId);
    setIsDeleting(false);
    if (result.success) {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Банк вопросов</h1>
          <p className={styles.subtitle}>
            Просмотр, управление и подготовка тестовых вопросов
          </p>
        </div>

        <Link to="/teacher/questions/new" className={styles.createButton}>
          + Создать вопрос
        </Link>
      </header>

      {/* Control Bar: Search & Filters */}
      <div className={styles.controlsBar}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Поиск по тексту или теме..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filtersGroup}>
          <div className={styles.filterField}>
            <label htmlFor="topic-filter" className={styles.filterLabel}>
              Тема:
            </label>
            <select
              id="topic-filter"
              className={styles.selectInput}
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              <option value="all">Все</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterField}>
            <label htmlFor="difficulty-filter" className={styles.filterLabel}>
              Сложность:
            </label>
            <select
              id="difficulty-filter"
              className={styles.selectInput}
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="all">Все</option>
              <option value="easy">Лёгкая</option>
              <option value="medium">Средняя</option>
              <option value="hard">Сложная</option>
            </select>
          </div>

          <div className={styles.filterField}>
            <label htmlFor="type-filter" className={styles.filterLabel}>
              Тип:
            </label>
            <select
              id="type-filter"
              className={styles.selectInput}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">Все</option>
              <option value="single">Один ответ</option>
              <option value="multiple">Несколько ответов</option>
            </select>
          </div>

          <div className={styles.filterField}>
            <label htmlFor="status-filter" className={styles.filterLabel}>
              Статус:
            </label>
            <select
              id="status-filter"
              className={styles.selectInput}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="active">Активные</option>
              <option value="archived">В архиве</option>
              <option value="all">Все</option>
            </select>
          </div>
        </div>
      </div>

      {actionError && (
        <div className={styles.alertError} role="alert">
          {actionError}
        </div>
      )}

      {isLoading && (
        <div className={styles.loadingBox}>Загрузка банка вопросов...</div>
      )}

      {error && <div className={styles.errorBox}>{error}</div>}

      {!isLoading && !error && filteredQuestions.length === 0 && (
        <div className={styles.emptyBox}>
          {searchQuery ||
          selectedTopic !== 'all' ||
          selectedDifficulty !== 'all' ||
          selectedType !== 'all'
            ? 'Вопросы с указанными фильтрами не найдены.'
            : 'В банке пока нет вопросов. Нажмите "+ Создать вопрос", чтобы добавить первый вопрос.'}
        </div>
      )}

      {!isLoading && !error && filteredQuestions.length > 0 && (
        <div className={styles.questionsGrid}>
          {filteredQuestions.map((q) => {
            const isMultiple = isMultipleAnswer(q);
            const topicLabel = getTopicLabel(q.topic) || q.topic;
            const diffLabel = DIFFICULTY_MAP[q.difficulty] || q.difficulty;

            return (
              <div key={q.id} className={styles.questionCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.badgesGroup}>
                    <span
                      className={styles.badgeTopic}
                      title={`Тема: ${topicLabel}`}
                    >
                      {topicLabel}
                    </span>
                    <span
                      className={`${styles.badgeDifficulty} ${
                        styles[`diff_${q.difficulty}`] || ''
                      }`}
                    >
                      {diffLabel}
                    </span>
                    <span className={styles.badgeType}>
                      {isMultiple ? 'Несколько ответов' : 'Один ответ'}
                    </span>
                  </div>

                  <span className={styles.optionsCount}>
                    Вариантов: {q.options?.length || 0}
                  </span>
                </div>

                <div className={styles.questionContent}>
                  <p className={styles.questionText}>{q.questionText}</p>
                </div>

                <div className={styles.cardActions}>
                  <Link
                    to={`/teacher/questions/${q.id}/edit`}
                    className={styles.editBtn}
                  >
                    Редактировать
                  </Link>

                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => {
                      setActionError(null);
                      setDeletingId(q.id);
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deletingId)}
        title="Архивировать вопрос?"
        description="Этот вопрос будет перемещён в архив и скрыт из основного банка вопросов."
        confirmLabel={isDeleting ? 'Архивация...' : 'Архивировать'}
        cancelLabel="Отмена"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) setDeletingId(null);
        }}
      />
    </div>
  );
}
