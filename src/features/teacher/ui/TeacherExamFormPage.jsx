import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useExamBuilder } from '../hooks/useExamBuilder';
import styles from './TeacherExamFormPage.module.css';

export function TeacherExamFormPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const {
    isEditMode,
    title,
    setTitle,
    groupId,
    setGroupId,
    durationMinutes,
    setDurationMinutes,
    selectedQuestions,
    groups,
    pickerQuestions,
    availableTopics,
    availableVariants = [],
    variantFilter = 'all',
    setVariantFilter,
    loadVariantQuestions,
    searchQuery,
    setSearchQuery,
    topicFilter,
    setTopicFilter,
    difficultyFilter,
    setDifficultyFilter,
    typeFilter,
    setTypeFilter,
    addQuestion,
    removeQuestion,
    removeAllQuestions,
    moveQuestionUp,
    moveQuestionDown,
    saveDraft,
    deleteDraft,
    isLoading,
    isSaving,
    error,
    validationErrors,
  } = useExamBuilder({ examId });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedVariantToLoad, setSelectedVariantToLoad] = useState('');
  const [isListCollapsed, setIsListCollapsed] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    const saved = await saveDraft();
    if (saved) {
      navigate('/teacher/exams');
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = async () => {
    const deleted = await deleteDraft();
    if (deleted) {
      navigate('/teacher/exams');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBox}>Загрузка данных конструктора...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/teacher/exams" className={styles.backLink}>
          &larr; Назад к экзаменам
        </Link>
        <h1 className={styles.title}>
          {isEditMode ? 'Редактирование черновика экзамена' : 'Конструктор экзамена'}
        </h1>
        <p className={styles.subtitle}>
          Настройте основные параметры тестирования, выберите группу и сформируйте список вопросов
        </p>
      </header>

      {error && <div className={styles.errorBox}>{error}</div>}

      <form onSubmit={handleSave} className={styles.form} noValidate>
        {/* Basic Exam Info Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Параметры экзамена</h2>
              <span className={styles.cardHint}>Основные настройки и ограничения сессии</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="examTitle" className={styles.label}>
              Название экзамена <span className={styles.required}>*</span>
            </label>
            <input
              id="examTitle"
              type="text"
              className={`${styles.input} ${
                validationErrors.title ? styles.inputError : ''
              }`}
              placeholder="Например: Итоговый тест 10-А класс..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {validationErrors.title && (
              <span className={styles.errorText}>{validationErrors.title}</span>
            )}
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label htmlFor="examGroup" className={styles.label}>
                Целевая группа <span className={styles.required}>*</span>
              </label>
              <select
                id="examGroup"
                className={`${styles.select} ${
                  validationErrors.groupId ? styles.inputError : ''
                }`}
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
              >
                <option value="" disabled>
                  Выберите группу...
                </option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.studentIds?.length || 0} учеников)
                  </option>
                ))}
              </select>
              {validationErrors.groupId && (
                <span className={styles.errorText}>{validationErrors.groupId}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="examDuration" className={styles.label}>
                Длительность (минуты) <span className={styles.required}>*</span>
              </label>
              <input
                id="examDuration"
                type="number"
                min={5}
                max={240}
                className={`${styles.input} ${
                  validationErrors.durationMinutes ? styles.inputError : ''
                }`}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
              {validationErrors.durationMinutes && (
                <span className={styles.errorText}>
                  {validationErrors.durationMinutes}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Load Variant Card */}
        {availableVariants && availableVariants.length > 0 && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>⚡ Быстрая загрузка варианта (Пробник ЕНТ)</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>
              Выберите готовый вариант ЕНТ из банка заданий, чтобы автоматически заполнить экзамен всеми его вопросами.
            </p>
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <select
                  className={styles.select}
                  value={selectedVariantToLoad}
                  onChange={(e) => setSelectedVariantToLoad(e.target.value)}
                >
                  <option value="">Выберите вариант / пробник...</option>
                  {availableVariants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title} ({v.count} вопросов)
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className={styles.addBtn}
                disabled={!selectedVariantToLoad}
                onClick={() => {
                  if (loadVariantQuestions && selectedVariantToLoad) {
                    loadVariantQuestions(selectedVariantToLoad);
                  }
                }}
                style={{ height: 42, alignSelf: 'flex-end', marginBottom: 16 }}
              >
                + Загрузить весь вариант
              </button>
            </div>
          </div>
        )}

        {/* Selected Questions List Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Состав экзамена</h2>
              <span className={styles.cardHint}>Порядок и перечень включенных в экзамен вопросов</span>
            </div>
            <div className={styles.headerControls}>
              <span className={styles.counterBadge}>
                {selectedQuestions.length} вопросов
              </span>
              {selectedQuestions.length > 0 && (
                <>
                  <button
                    type="button"
                    className={styles.compactToggleBtn}
                    onClick={() => setIsListCollapsed((prev) => !prev)}
                  >
                    {isListCollapsed ? 'Развернуть список' : 'Свернуть список'}
                  </button>
                  {removeAllQuestions && (
                    <button
                      type="button"
                      className={styles.clearAllBtn}
                      onClick={() => removeAllQuestions()}
                      title="Очистить все выбранные вопросы"
                    >
                      Очистить все
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {validationErrors.questions && (
            <div className={styles.errorBox}>{validationErrors.questions}</div>
          )}

          {selectedQuestions.length === 0 ? (
            <div className={styles.emptySelectedBox}>
              Вопросы ещё не добавлены. Выберите необходимые вопросы из Банка
              Вопросов ниже или загрузите готовый вариант ЕНТ.
            </div>
          ) : isListCollapsed ? (
            <div className={styles.collapsedSummaryBox}>
              <span>
                📋 Все <strong>{selectedQuestions.length} вопросов</strong> загружены в экзамен.
              </span>
              <button
                type="button"
                className={styles.compactToggleBtn}
                onClick={() => setIsListCollapsed(false)}
              >
                Развернуть для настройки порядка
              </button>
            </div>
          ) : (
            <div className={styles.scrollableContainer}>
              <div className={styles.selectedList}>
                {selectedQuestions.map((q, index) => (
                  <div key={q.id || index} className={styles.selectedRow}>
                    <div className={styles.numBadge}>#{index + 1}</div>

                    <div className={styles.questionContent}>
                      <div className={styles.questionText}>
                        {q.questionText || `Вопрос ID: ${q.id}`}
                      </div>
                      <div className={styles.questionMeta}>
                        {q.topic && <span className={styles.tag}>{q.topic}</span>}
                        {q.difficulty && (
                          <span
                            className={`${styles.tag} ${
                              styles[`diff_${q.difficulty}`] || ''
                            }`}
                          >
                            {q.difficulty}
                          </span>
                        )}
                        <span className={styles.tag}>
                          {q.multiple ? 'Несколько ответов' : 'Один ответ'}
                        </span>
                      </div>
                    </div>

                    <div className={styles.orderActions}>
                      <button
                        type="button"
                        className={styles.orderBtn}
                        onClick={() => moveQuestionUp(index)}
                        disabled={index === 0}
                        title="Переместить вверх"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className={styles.orderBtn}
                        onClick={() => moveQuestionDown(index)}
                        disabled={index === selectedQuestions.length - 1}
                        title="Переместить вниз"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeQuestion(q.id)}
                        title="Удалить из экзамена"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Question Bank Picker Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Банк Вопросов (Добавление вопросов)</h2>
              <span className={styles.cardHint}>Поиск и добавление заданий из общей базы</span>
            </div>
            <span className={styles.counterBadge}>
              Доступно: {pickerQuestions.length}
            </span>
          </div>

          {/* Filters Bar */}
          <div className={styles.filtersBar}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Поиск вопросов по тексту или теме..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {availableVariants && availableVariants.length > 0 && (
              <select
                className={styles.filterSelect}
                value={variantFilter || 'all'}
                onChange={(e) => setVariantFilter && setVariantFilter(e.target.value)}
              >
                <option value="all">Все варианты</option>
                {availableVariants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title} ({v.count} вопр.)
                  </option>
                ))}
              </select>
            )}

            <select
              className={styles.filterSelect}
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
            >
              <option value="all">Все темы</option>
              {availableTopics.map((top) => (
                <option key={top} value={top}>
                  {top}
                </option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
            >
              <option value="all">Любая сложность</option>
              <option value="easy">easy (Лёгкая)</option>
              <option value="medium">medium (Средняя)</option>
              <option value="hard">hard (Сложная)</option>
            </select>

            <select
              className={styles.filterSelect}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Все типы</option>
              <option value="single">Один ответ</option>
              <option value="multiple">Несколько ответов</option>
            </select>
          </div>

          {/* Available Questions List */}
          {pickerQuestions.length === 0 ? (
            <div className={styles.emptyPickerBox}>
              Доступных вопросов не найдено (или все подходящие вопросы уже добавлены в экзамен).
            </div>
          ) : (
            <div className={styles.scrollableContainer}>
              <div className={styles.pickerList}>
                {pickerQuestions.map((q) => (
                  <div key={q.id} className={styles.pickerRow}>
                    <div className={styles.questionContent}>
                      <div className={styles.questionText}>{q.questionText}</div>
                      <div className={styles.questionMeta}>
                        {q.topic && <span className={styles.tag}>{q.topic}</span>}
                        {q.difficulty && (
                          <span
                            className={`${styles.tag} ${
                              styles[`diff_${q.difficulty}`] || ''
                            }`}
                          >
                            {q.difficulty}
                          </span>
                        )}
                        <span className={styles.tag}>
                          {q.multiple ? 'Несколько ответов' : 'Один ответ'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.addBtn}
                      onClick={() => addQuestion(q)}
                    >
                      + Добавить
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Form Actions Bar */}
        <div className={styles.actionsRow}>
          <div className={styles.leftActions}>
            <Link to="/teacher/exams" className={styles.cancelBtn}>
              Отмена
            </Link>
            {isEditMode && (
              <button
                type="button"
                className={styles.deleteDraftBtn}
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSaving}
              >
                Удалить черновик
              </button>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSaving}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить черновик'}
          </button>
        </div>
      </form>

      {/* Delete Draft Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <h3>Удалить черновик экзамена?</h3>
            <p>Вы действительно хотите удалить этот черновик экзамена? Действие необратимо.</p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Отмена
              </button>
              <button
                type="button"
                className={styles.modalConfirmDeleteBtn}
                onClick={handleDelete}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
