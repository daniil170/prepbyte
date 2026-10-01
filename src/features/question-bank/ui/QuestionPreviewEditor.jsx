import { useState } from 'react';
import { TOPICS } from '../domain/topics';
import styles from './QuestionPreviewEditor.module.css';

/**
 * Shared question preview and editor component for AI variants and document imports.
 */
export function QuestionPreviewEditor({
  questions = [],
  onUpdateQuestion,
  onToggleCorrectAnswer,
  onUpdateOptionText,
  onRemoveQuestion,
  onToggleInclude,
  showInclusion = false,
  expandedIndex: controlledExpandedIndex,
  onToggleAccordion,
}) {
  const [internalExpandedIndex, setInternalExpandedIndex] = useState(0);

  const isControlled = typeof controlledExpandedIndex !== 'undefined';
  const activeIndex = isControlled
    ? controlledExpandedIndex
    : internalExpandedIndex;

  const handleToggle = (idx) => {
    if (onToggleAccordion) {
      onToggleAccordion(idx);
    } else {
      setInternalExpandedIndex((prev) => (prev === idx ? null : idx));
    }
  };

  const handleAddOption = (qIdx, currentOptions = []) => {
    if (!onUpdateQuestion || currentOptions.length >= 6) return;
    onUpdateQuestion(qIdx, {
      options: [...currentOptions, ''],
    });
  };

  const handleRemoveOption = (
    qIdx,
    optIdx,
    currentOptions = [],
    currentCorrect = []
  ) => {
    if (!onUpdateQuestion || currentOptions.length <= 2) return;
    const nextOptions = currentOptions.filter((_, i) => i !== optIdx);
    const nextCorrect = currentCorrect
      .filter((i) => i !== optIdx)
      .map((i) => (i > optIdx ? i - 1 : i));
    onUpdateQuestion(qIdx, {
      options: nextOptions,
      correctAnswers: nextCorrect,
    });
  };

  return (
    <div className={styles.questionList} data-testid="question-preview-editor">
      {questions.map((q, idx) => {
        const isExpanded = activeIndex === idx;
        const isSingle = (q.correctAnswers || []).length <= 1;
        const isExcluded = q.included === false;

        return (
          <div
            key={q.id || idx}
            className={`${styles.questionCard} ${isExcluded ? styles.cardExcluded : ''}`}
            data-testid={`question-card-${idx}`}
          >
            <div
              className={styles.cardHeader}
              onClick={() => handleToggle(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleToggle(idx);
                }
              }}
              aria-expanded={isExpanded}
            >
              {(showInclusion || onToggleInclude) && (
                <input
                  type="checkbox"
                  className={styles.includeCheckbox}
                  checked={!isExcluded}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleInclude?.(idx);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  title="Включить в импорт"
                  aria-label={`Включить задание ${q.number || idx + 1}`}
                />
              )}

              <span className={styles.qNum}>
                {q.number ? `#${q.number}` : `#${idx + 1}`}
              </span>

              {q.status && (
                <span
                  className={`${styles.statusBadge} ${
                    q.status === 'ok'
                      ? styles.statusOk
                      : q.status === 'warning'
                        ? styles.statusWarning
                        : styles.statusError
                  }`}
                >
                  {q.status === 'ok'
                    ? '✓ ОК'
                    : q.status === 'warning'
                      ? '! Внимание'
                      : '✗ Ошибка'}
                </span>
              )}

              {q.duplicateOf && (
                <span className={styles.duplicateBadge}>
                  Дубликат: {q.duplicateOf}
                </span>
              )}

              <span className={styles.qTopicBadge}>
                {q.topic || 'Без темы'}
              </span>
              <span className={styles.qPointsBadge}>
                {isSingle ? '1 балл' : '2 балла'}
              </span>

              <span className={styles.qSnippet}>
                {q.questionText
                  ? `${q.questionText.slice(0, 70)}...`
                  : '(Пустой вопрос)'}
              </span>

              {onRemoveQuestion && (
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveQuestion(idx);
                  }}
                  title="Удалить задание"
                  aria-label="Удалить задание"
                >
                  ×
                </button>
              )}
            </div>

            {isExpanded && (
              <div className={styles.cardBody}>
                {q.issues && q.issues.length > 0 && (
                  <div className={styles.issuesBox} role="alert">
                    {q.issues.map((issue, issueIdx) => (
                      <div key={issueIdx}>• {issue}</div>
                    ))}
                  </div>
                )}

                {/* Question Text Editor */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    Текст вопроса (Markdown / Код):
                  </label>
                  <textarea
                    className={styles.textarea}
                    rows={3}
                    value={q.questionText || ''}
                    onChange={(e) =>
                      onUpdateQuestion?.(idx, {
                        questionText: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Topic & Difficulty Selectors */}
                <div className={styles.inlineControls}>
                  <div className={styles.controlItem}>
                    <label className={styles.fieldLabel}>Тема:</label>
                    <select
                      className={styles.inlineSelect}
                      value={q.topic || ''}
                      onChange={(e) =>
                        onUpdateQuestion?.(idx, { topic: e.target.value })
                      }
                    >
                      <option value="">Выберите тему...</option>
                      {TOPICS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.controlItem}>
                    <label className={styles.fieldLabel}>Сложность:</label>
                    <select
                      className={styles.inlineSelect}
                      value={q.difficulty || 'medium'}
                      onChange={(e) =>
                        onUpdateQuestion?.(idx, {
                          difficulty: e.target.value,
                        })
                      }
                    >
                      <option value="easy">Лёгкий</option>
                      <option value="medium">Средний</option>
                      <option value="hard">Сложный</option>
                    </select>
                  </div>
                </div>

                {/* Options Editor & Correct Answer Toggles */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    Варианты ответа (отметьте верные):
                  </label>
                  <div className={styles.optionsGrid}>
                    {(q.options || []).map((opt, optIdx) => {
                      const isCorrect = (q.correctAnswers || []).includes(
                        optIdx
                      );

                      return (
                        <div
                          key={optIdx}
                          className={`${styles.optionEditRow} ${
                            isCorrect ? styles.optionEditCorrect : ''
                          }`}
                        >
                          <button
                            type="button"
                            className={`${styles.toggleCorrectBtn} ${
                              isCorrect ? styles.toggleActive : ''
                            }`}
                            onClick={() => onToggleCorrectAnswer?.(idx, optIdx)}
                            title="Переключить правильность ответа"
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </button>

                          <input
                            type="text"
                            className={styles.optionInput}
                            value={opt}
                            onChange={(e) =>
                              onUpdateOptionText?.(idx, optIdx, e.target.value)
                            }
                          />

                          {isCorrect && (
                            <span className={styles.correctLabel}>
                              ✓ Верный
                            </span>
                          )}

                          {(q.options || []).length > 2 && (
                            <button
                              type="button"
                              className={styles.removeOptionBtn}
                              onClick={() =>
                                handleRemoveOption(
                                  idx,
                                  optIdx,
                                  q.options,
                                  q.correctAnswers
                                )
                              }
                              title="Удалить вариант"
                              aria-label={`Удалить вариант ${String.fromCharCode(65 + optIdx)}`}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {(q.options || []).length < 6 && (
                    <button
                      type="button"
                      className={styles.addOptionBtn}
                      onClick={() => handleAddOption(idx, q.options)}
                    >
                      + Добавить вариант ответа
                    </button>
                  )}
                </div>

                {/* Explanation Editor */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    Пояснение к ответу:
                  </label>
                  <textarea
                    className={styles.textarea}
                    rows={2}
                    value={q.explanation || ''}
                    onChange={(e) =>
                      onUpdateQuestion?.(idx, { explanation: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
