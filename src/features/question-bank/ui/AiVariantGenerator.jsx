import { useState } from 'react';
import { TOPICS } from '../domain/topics';
import { useAiVariantGenerator } from '../hooks/useAiVariantGenerator';
import styles from './AiVariantGenerator.module.css';

/**
 * In-app AI variant generator with interactive preview and live distractor editing.
 */
export function AiVariantGenerator() {
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(0);

  const {
    mode,
    setMode,
    selectedTopic,
    setSelectedTopic,
    difficulty,
    setDifficulty,
    customApiKey,
    setCustomApiKey,
    isGenerating,
    isPublishing,
    generatedQuestions,
    generationMeta,
    publishSuccess,
    publishCount,
    error,
    generateVariant,
    updateQuestion,
    updateOptionText,
    toggleCorrectAnswer,
    removeQuestion,
    publishQuestions,
    reset,
  } = useAiVariantGenerator();

  const toggleAccordion = (idx) => {
    setExpandedIndex((prev) => (prev === idx ? null : idx));
  };

  const totalPoints = generatedQuestions.reduce((sum, q) => {
    return sum + (q.correctAnswers?.length > 1 ? 2 : 1);
  }, 0);

  return (
    <div className={styles.container} aria-label="ИИ-Генератор вариантов">
      {/* Configuration Card */}
      <div className={styles.configCard}>
        <div className={styles.configHeader}>
          <h2 className={styles.configTitle}>Параметры генерации</h2>
          <span className={styles.aiTag}>[AI ASSISTED]</span>
        </div>

        {/* Mode Selector */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Режим генерации:</label>
          <div className={styles.modeButtonGroup}>
            <button
              type="button"
              className={`${styles.modeBtn} ${
                mode === 'full_exam' ? styles.modeBtnActive : ''
              }`}
              onClick={() => setMode('full_exam')}
            >
              Полный вариант ЕНТ (40 заданий / 50 б.)
            </button>
            <button
              type="button"
              className={`${styles.modeBtn} ${
                mode === 'topic_deep_dive' ? styles.modeBtnActive : ''
              }`}
              onClick={() => setMode('topic_deep_dive')}
            >
              Тематический интенсив (10 заданий)
            </button>
          </div>
        </div>

        {/* Topic Selector for Deep-Dive */}
        {mode === 'topic_deep_dive' && (
          <div className={styles.formGroup}>
            <label htmlFor="topic-select" className={styles.label}>
              Целевая тема ЕНТ:
            </label>
            <select
              id="topic-select"
              className={styles.select}
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              {TOPICS.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Difficulty Distribution */}
        <div className={styles.formGroup}>
          <label htmlFor="difficulty-select" className={styles.label}>
            Сложность заданий:
          </label>
          <select
            id="difficulty-select"
            className={styles.select}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="balanced">
              Сбалансированная (ЕНТ: 25% easy, 55% medium, 20% hard)
            </option>
            <option value="easy">Преимущественно базовые (Easy)</option>
            <option value="medium">Стандартные профильные (Medium)</option>
            <option value="hard">Повышенная сложность (Hard)</option>
          </select>
        </div>

        {/* API Key Toggle */}
        <div className={styles.apiKeySection}>
          <button
            type="button"
            className={styles.apiKeyToggleBtn}
            onClick={() => setShowApiKeyInput((prev) => !prev)}
          >
            {showApiKeyInput
              ? '− Скрыть ключ API'
              : '+ Настроить ключ API (Gemini / OpenAI)'}
          </button>

          {showApiKeyInput && (
            <div className={styles.apiKeyInputContainer}>
              <input
                type="password"
                className={styles.apiKeyInput}
                placeholder="Вставьте ваш Gemini API Key (VITE_AI_API_KEY)"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
              />
              <span className={styles.apiKeyHint}>
                Оставьте пустым для использования локального методического
                генератора
              </span>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div className={styles.generateActionRow}>
          <button
            type="button"
            className={styles.generateBtn}
            onClick={generateVariant}
            disabled={isGenerating}
          >
            {isGenerating
              ? 'Генерация заданий...'
              : `Сгенерировать ${mode === 'full_exam' ? '40 заданий' : '10 заданий'}`}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorAlert} role="alert">
          <strong>[ОШИБКА]</strong> {error}
        </div>
      )}

      {publishSuccess && (
        <div className={styles.successBanner} role="status">
          <div>
            ✓ Опубликовано <strong>{publishCount}</strong> заданий в базу
            Firestore!
          </div>
          <button type="button" className={styles.secondaryBtn} onClick={reset}>
            Создать новый набор
          </button>
        </div>
      )}

      {/* Generated Questions Preview & Editor */}
      {generatedQuestions.length > 0 && (
        <div className={styles.previewContainer}>
          <div className={styles.previewHeader}>
            <div>
              <h3 className={styles.previewTitle}>
                Сгенерированные задания ({generatedQuestions.length})
              </h3>
              <div className={styles.metaRow}>
                <span className={styles.metaBadge}>
                  Суммарный балл: {totalPoints}
                </span>
                {generationMeta?.note && (
                  <span className={styles.metaNote}>{generationMeta.note}</span>
                )}
              </div>
            </div>

            <div className={styles.previewActions}>
              <button
                type="button"
                className={styles.publishBtn}
                onClick={publishQuestions}
                disabled={isPublishing}
              >
                {isPublishing
                  ? 'Публикация...'
                  : `Опубликовать в базу (${generatedQuestions.length} зад.)`}
              </button>
            </div>
          </div>

          <div className={styles.questionList}>
            {generatedQuestions.map((q, idx) => {
              const isExpanded = expandedIndex === idx;
              const isSingle = q.correctAnswers?.length === 1;

              return (
                <div key={q.id || idx} className={styles.questionCard}>
                  <div
                    className={styles.cardHeader}
                    onClick={() => toggleAccordion(idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') toggleAccordion(idx);
                    }}
                  >
                    <span className={styles.qNum}>#{idx + 1}</span>
                    <span className={styles.qTopicBadge}>{q.topic}</span>
                    <span className={styles.qPointsBadge}>
                      {isSingle ? '1 балл' : '2 балла'}
                    </span>
                    <span className={styles.qSnippet}>
                      {q.questionText?.slice(0, 70)}...
                    </span>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeQuestion(idx);
                      }}
                      title="Удалить задание"
                      aria-label="Удалить задание"
                    >
                      ×
                    </button>
                  </div>

                  {isExpanded && (
                    <div className={styles.cardBody}>
                      {/* Question Text Editor */}
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>
                          Текст вопроса (Markdown / Код):
                        </label>
                        <textarea
                          className={styles.textarea}
                          rows={3}
                          value={q.questionText}
                          onChange={(e) =>
                            updateQuestion(idx, {
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
                            value={q.topic}
                            onChange={(e) =>
                              updateQuestion(idx, { topic: e.target.value })
                            }
                          >
                            {TOPICS.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className={styles.controlItem}>
                          <label className={styles.fieldLabel}>
                            Сложность:
                          </label>
                          <select
                            className={styles.inlineSelect}
                            value={q.difficulty}
                            onChange={(e) =>
                              updateQuestion(idx, {
                                difficulty: e.target.value,
                              })
                            }
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                      </div>

                      {/* Options Editor & Correct Answer Toggles */}
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>
                          Варианты ответа (отметьте верные):
                        </label>
                        <div className={styles.optionsGrid}>
                          {q.options?.map((opt, optIdx) => {
                            const isCorrect =
                              q.correctAnswers?.includes(optIdx);

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
                                  onClick={() =>
                                    toggleCorrectAnswer(idx, optIdx)
                                  }
                                  title="Переключить правильность ответа"
                                >
                                  {String.fromCharCode(65 + optIdx)}
                                </button>

                                <input
                                  type="text"
                                  className={styles.optionInput}
                                  value={opt}
                                  onChange={(e) =>
                                    updateOptionText(
                                      idx,
                                      optIdx,
                                      e.target.value
                                    )
                                  }
                                />

                                {isCorrect && (
                                  <span className={styles.correctLabel}>
                                    ✓ Верный
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Explanation Editor */}
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>
                          Пояснение к ответу:
                        </label>
                        <textarea
                          className={styles.textarea}
                          rows={2}
                          value={q.explanation}
                          onChange={(e) =>
                            updateQuestion(idx, { explanation: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
