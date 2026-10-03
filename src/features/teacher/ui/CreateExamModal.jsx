import { useState } from 'react';
import { validateExamInput } from '../domain/exam';
import styles from './CreateExamModal.module.css';

export function CreateExamModal({
  isOpen,
  onClose,
  onSubmit,
  groups = [],
  isLoading = false,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState(groups[0]?.id || '');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [formError, setFormError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const validation = validateExamInput({
      title,
      groupId,
      durationMinutes: Number(durationMinutes),
    });

    if (!validation.valid) {
      setFormError(Object.values(validation.errors)[0]);
      return;
    }

    try {
      await onSubmit({
        title,
        description,
        groupId,
        durationMinutes: Number(durationMinutes),
      });

      onClose();
    } catch (err) {
      setFormError(err.message || 'Ошибка создания экзамена.');
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Создание онлайн-экзамена</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Закрыть"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="exam-title" className={styles.label}>
              Название экзамена *
            </label>
            <input
              id="exam-title"
              type="text"
              className={styles.input}
              placeholder="Например: Пробный ЕНТ 11-А (Февраль)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="exam-group" className={styles.label}>
              Целевая группа учащихся *
            </label>
            <select
              id="exam-group"
              className={styles.select}
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              required
            >
              <option value="" disabled>
                Выберите группу
              </option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.studentIds?.length || 0} уч.)
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="exam-duration" className={styles.label}>
              Длительность (минут) *
            </label>
            <input
              id="exam-duration"
              type="number"
              min="5"
              max="240"
              className={styles.input}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="exam-desc" className={styles.label}>
              Описание / Инструкции (опционально)
            </label>
            <textarea
              id="exam-desc"
              className={styles.textarea}
              placeholder="Инструкции для учеников перед началом тестирования..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={styles.infoBox}>
            ℹ️ При создании будет сформирован сбалансированный вариант ЕНТ из 40
            заданий по спецификации (30 с одним ответом и 10 с несколькими).
          </div>

          {formError && <div className={styles.errorText}>{formError}</div>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading || !title || !groupId}
            >
              {isLoading ? 'Создание...' : 'Создать экзамен'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
