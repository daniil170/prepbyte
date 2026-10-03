import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getTopicById,
  isMultipleAnswer,
  listTopics,
  questionRepository,
  validateQuestionFormData,
} from '@features/question-bank';
import styles from './TeacherQuestionFormPage.module.css';

const DEFAULT_FORM_STATE = {
  questionText: '',
  topic: 'python_loops',
  difficulty: 'medium',
  type: 'single',
  options: ['', '', '', ''],
  correctAnswers: [0],
  explanation: '',
};

export function TeacherQuestionFormPage() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(questionId);

  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState(null);

  const topics = listTopics();

  useEffect(() => {
    if (!isEditMode || !questionId) return;

    let isMounted = true;

    questionRepository
      .getQuestionWithAnswer(questionId)
      .then((q) => {
        if (!isMounted) return;
        if (!q) {
          setServerError('Вопрос не найден.');
          return;
        }

        const isMultiple = isMultipleAnswer(q);
        const validTopics = listTopics();
        const fallbackTopic = validTopics[0]?.id || 'python_loops';
        setFormData({
          questionText: q.questionText || '',
          topic: getTopicById(q.topic) ? q.topic : fallbackTopic,
          difficulty: q.difficulty || 'medium',
          type: isMultiple ? 'multiple' : 'single',
          options: q.options ? [...q.options] : ['', ''],
          correctAnswers: Array.isArray(q.correctAnswers)
            ? [...q.correctAnswers]
            : [0],
          explanation: q.explanation || '',
        });
      })
      .catch((err) => {
        if (isMounted) {
          setServerError(err.message || 'Ошибка загрузки вопроса.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingQuestion(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isEditMode, questionId]);

  const handleTypeChange = (newType) => {
    setFormData((prev) => {
      let updatedAnswers = [...prev.correctAnswers];
      if (newType === 'single' && updatedAnswers.length > 1) {
        updatedAnswers = [updatedAnswers[0]];
      } else if (updatedAnswers.length === 0) {
        updatedAnswers = [0];
      }
      return {
        ...prev,
        type: newType,
        correctAnswers: updatedAnswers,
      };
    });
    setFormErrors((prev) => ({ ...prev, type: null, correctAnswers: null }));
  };

  const handleOptionTextChange = (index, value) => {
    setFormData((prev) => {
      const updatedOptions = [...prev.options];
      updatedOptions[index] = value;
      return { ...prev, options: updatedOptions };
    });
    setFormErrors((prev) => ({
      ...prev,
      options: null,
      optionItems: null,
      optionsDuplicate: null,
    }));
  };

  const handleAddOption = () => {
    if (formData.options.length >= 6) return;
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, ''],
    }));
  };

  const handleRemoveOption = (indexToRemove) => {
    if (formData.options.length <= 2) return;

    setFormData((prev) => {
      const updatedOptions = prev.options.filter(
        (_, idx) => idx !== indexToRemove
      );
      // Adjust correct answer indices after array contraction
      let updatedAnswers = prev.correctAnswers
        .filter((idx) => idx !== indexToRemove)
        .map((idx) => (idx > indexToRemove ? idx - 1 : idx));

      if (updatedAnswers.length === 0) {
        updatedAnswers = [0];
      }

      return {
        ...prev,
        options: updatedOptions,
        correctAnswers: updatedAnswers,
      };
    });
  };

  const handleToggleCorrectAnswer = (index) => {
    setFormData((prev) => {
      if (prev.type === 'single') {
        return { ...prev, correctAnswers: [index] };
      }
      // Multiple selection
      const exists = prev.correctAnswers.includes(index);
      let updated = [];
      if (exists) {
        updated = prev.correctAnswers.filter((i) => i !== index);
      } else {
        updated = [...prev.correctAnswers, index].sort((a, b) => a - b);
      }
      return { ...prev, correctAnswers: updated };
    });
    setFormErrors((prev) => ({ ...prev, correctAnswers: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const validation = validateQuestionFormData(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});
    setIsSaving(true);

    try {
      const payload = {
        id: isEditMode ? questionId : undefined,
        questionText: formData.questionText.trim(),
        topic: formData.topic.trim(),
        difficulty: formData.difficulty,
        multiple: formData.type === 'multiple',
        options: formData.options.map((opt) => opt.trim()),
        correctAnswers: formData.correctAnswers,
        explanation: formData.explanation.trim() || 'Пояснение к вопросу',
      };

      await questionRepository.saveQuestion(payload);
      navigate('/teacher/questions');
    } catch (err) {
      setServerError(err.message || 'Не удалось сохранить вопрос.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingQuestion) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBox}>Загрузка данных вопроса...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/teacher/questions" className={styles.backLink}>
          &larr; Назад к банку вопросов
        </Link>
        <h1 className={styles.title}>
          {isEditMode ? 'Редактирование вопроса' : 'Создание вопроса'}
        </h1>
        {isEditMode && questionId && (
          <div className={styles.questionIdBadge}>
            Question ID: <code>{questionId}</code>
          </div>
        )}
      </header>

      {serverError && (
        <div className={styles.serverError} role="alert">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {/* Question Text */}
        <div className={styles.formGroup}>
          <label htmlFor="questionText" className={styles.label}>
            Текст вопроса <span className={styles.required}>*</span>
          </label>
          <textarea
            id="questionText"
            className={`${styles.textarea} ${
              formErrors.questionText ? styles.inputError : ''
            }`}
            rows={4}
            placeholder="Введите текст вопроса..."
            value={formData.questionText}
            onChange={(e) => {
              setFormData({ ...formData, questionText: e.target.value });
              setFormErrors({ ...formErrors, questionText: null });
            }}
          />
          {formErrors.questionText && (
            <span className={styles.errorText}>{formErrors.questionText}</span>
          )}
        </div>

        {/* Metadata Controls: Topic, Difficulty, Type */}
        <div className={styles.metaRow}>
          <div className={styles.formGroup}>
            <label htmlFor="topic" className={styles.label}>
              Тема <span className={styles.required}>*</span>
            </label>
            <select
              id="topic"
              className={`${styles.select} ${
                formErrors.topic ? styles.inputError : ''
              }`}
              value={formData.topic}
              onChange={(e) => {
                setFormData({ ...formData, topic: e.target.value });
                setFormErrors({ ...formErrors, topic: null });
              }}
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            {formErrors.topic && (
              <span className={styles.errorText}>{formErrors.topic}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="difficulty" className={styles.label}>
              Сложность <span className={styles.required}>*</span>
            </label>
            <select
              id="difficulty"
              className={`${styles.select} ${
                formErrors.difficulty ? styles.inputError : ''
              }`}
              value={formData.difficulty}
              onChange={(e) => {
                setFormData({ ...formData, difficulty: e.target.value });
                setFormErrors({ ...formErrors, difficulty: null });
              }}
            >
              <option value="easy">easy (Лёгкая)</option>
              <option value="medium">medium (Средняя)</option>
              <option value="hard">hard (Сложная)</option>
            </select>
            {formErrors.difficulty && (
              <span className={styles.errorText}>{formErrors.difficulty}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="type" className={styles.label}>
              Тип вопроса <span className={styles.required}>*</span>
            </label>
            <select
              id="type"
              className={`${styles.select} ${
                formErrors.type ? styles.inputError : ''
              }`}
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              <option value="single">single (Один ответ)</option>
              <option value="multiple">multiple (Несколько ответов)</option>
            </select>
            {formErrors.type && (
              <span className={styles.errorText}>{formErrors.type}</span>
            )}
          </div>
        </div>

        {/* Options Section */}
        <div className={styles.optionsSection}>
          <div className={styles.optionsHeader}>
            <h2 className={styles.sectionTitle}>
              Варианты ответов <span className={styles.required}>*</span>
            </h2>
            <span className={styles.sectionSubtitle}>
              Отметьте правильные варианты ({formData.type === 'single' ? 'ровно один' : 'один или несколько'})
            </span>
          </div>

          {formErrors.options && (
            <div className={styles.errorText}>{formErrors.options}</div>
          )}
          {formErrors.optionsDuplicate && (
            <div className={styles.errorText}>{formErrors.optionsDuplicate}</div>
          )}
          {formErrors.correctAnswers && (
            <div className={styles.errorText}>{formErrors.correctAnswers}</div>
          )}

          <div className={styles.optionsList}>
            {formData.options.map((optionText, idx) => {
              const letter = String.fromCharCode(65 + idx); // A, B, C, D...
              const isChecked = formData.correctAnswers.includes(idx);
              const itemError = formErrors.optionItems?.[idx];

              return (
                <div key={idx} className={styles.optionRow}>
                  <label
                    className={styles.radioLabel}
                    title="Отметить как правильный вариант"
                  >
                    <input
                      type={formData.type === 'single' ? 'radio' : 'checkbox'}
                      name="correctAnswer"
                      checked={isChecked}
                      onChange={() => handleToggleCorrectAnswer(idx)}
                      className={styles.choiceInput}
                    />
                    <span className={styles.optionBadge}>Вариант {letter}</span>
                  </label>

                  <div className={styles.optionInputWrapper}>
                    <input
                      type="text"
                      className={`${styles.input} ${
                        itemError ? styles.inputError : ''
                      }`}
                      placeholder={`Текст варианта ${letter}...`}
                      value={optionText}
                      onChange={(e) =>
                        handleOptionTextChange(idx, e.target.value)
                      }
                    />
                    {itemError && (
                      <span className={styles.errorText}>{itemError}</span>
                    )}
                  </div>

                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      className={styles.removeOptionBtn}
                      onClick={() => handleRemoveOption(idx)}
                      title="Удалить вариант"
                    >
                      &times;
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {formData.options.length < 6 && (
            <button
              type="button"
              className={styles.addOptionBtn}
              onClick={handleAddOption}
            >
              + Добавить вариант
            </button>
          )}
        </div>

        {/* Explanation */}
        <div className={styles.formGroup}>
          <label htmlFor="explanation" className={styles.label}>
            Пояснение к решению (опционально)
          </label>
          <textarea
            id="explanation"
            className={styles.textarea}
            rows={2}
            placeholder="Подробное объяснение правильного ответа..."
            value={formData.explanation}
            onChange={(e) =>
              setFormData({ ...formData, explanation: e.target.value })
            }
          />
        </div>

        {/* Submit Actions */}
        <div className={styles.formActions}>
          <Link to="/teacher/questions" className={styles.cancelBtn}>
            Отмена
          </Link>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSaving}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить вопрос'}
          </button>
        </div>
      </form>
    </div>
  );
}
