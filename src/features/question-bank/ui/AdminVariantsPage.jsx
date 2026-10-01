import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TOPICS } from '../domain/topics';
import { useVariantUploader } from '../hooks/useVariantUploader';
import { AiVariantGenerator } from './AiVariantGenerator';
import { QuestionPreviewEditor } from './QuestionPreviewEditor';
import { VariantDropzone } from './VariantDropzone';
import { VariantValidationSummary } from './VariantValidationSummary';
import { ThemeToggle } from '@shared/theme';
import styles from './AdminVariantsPage.module.css';

/**
 * Main administration page for question variant ingestion (JSON, DOCX, PDF) and AI generation.
 */
export function AdminVariantsPage() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'generator'
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState(null);

  const {
    file,
    fileType,
    validationResult,
    documentQuestions,
    documentWarnings,
    variantSlug,
    setVariantSlug,
    defaultTopic,
    setDefaultTopic,
    defaultDifficulty,
    setDefaultDifficulty,
    isUploading,
    uploadSuccess,
    uploadCount,
    error,
    handleFileSelect,
    updateDocumentQuestion,
    toggleIncludeQuestion,
    toggleCorrectAnswer,
    updateOptionText,
    removeDocumentQuestion,
    includeAll,
    excludeDuplicates,
    applyDefaultTopicToAll,
    applyDefaultDifficultyToAll,
    canSaveDocument,
    includedCount,
    uploadVariant,
    reset,
  } = useVariantUploader();

  const toggleQuestionAccordion = (index) => {
    setExpandedQuestionIdx((prev) => (prev === index ? null : index));
  };

  const okCount = documentQuestions.filter((q) => q.status === 'ok').length;
  const warningCount = documentQuestions.filter(
    (q) => q.status === 'warning'
  ).length;
  const errorCount = documentQuestions.filter(
    (q) => q.status === 'error'
  ).length;
  const duplicateCount = documentQuestions.filter((q) =>
    Boolean(q.duplicateOf)
  ).length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.navRow}>
          <Link to="/" className={styles.backLink}>
            ← На главную
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ThemeToggle />
            <span className={styles.adminBadge}>[ПАНЕЛЬ АДМИНИСТРАТОРА]</span>
          </div>
        </div>
        <h1 className={styles.title}>Управление вариантами ЕНТ</h1>
        <p className={styles.subtitle}>
          Импорт стандартизированных вариантов (JSON, DOCX, PDF) и генерация
          новых заданий через нейросетевые модели.
        </p>
      </header>

      {/* Tab Navigation */}
      <nav className={styles.tabNav} aria-label="Вкладки управления вариантами">
        <button
          type="button"
          className={`${styles.tabBtn} ${
            activeTab === 'upload' ? styles.tabActive : ''
          }`}
          onClick={() => setActiveTab('upload')}
        >
          1. Загрузка файла (JSON, DOCX, PDF)
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${
            activeTab === 'generator' ? styles.tabActive : ''
          }`}
          onClick={() => setActiveTab('generator')}
        >
          2. ИИ-Генератор вариантов
        </button>
      </nav>

      {/* Tab 1: Web File Ingestion */}
      {activeTab === 'upload' && (
        <section className={styles.tabContent} aria-label="Загрузка файла">
          <div className={styles.introCard}>
            <h2 className={styles.sectionHeading}>
              Загрузка файла варианта (JSON, DOCX, PDF)
            </h2>
            <p className={styles.sectionDesc}>
              Загрузите файл варианта ЕНТ. Документы DOCX и PDF парсятся
              непосредственно в браузере: система распознаёт текст вопросов,
              варианты ответов, сверяет дубликаты с базой и открывает
              интерактивный редактор перед сохранением.
            </p>
          </div>

          {/* Document Format Guidelines */}
          <div className={styles.guidanceCard}>
            <div className={styles.guidanceTitle}>
              [!] Требования к форматированию документов (DOCX / PDF)
            </div>
            <ul className={styles.guidanceList}>
              <li>
                <strong>Нумерация заданий:</strong> порядковый номер с точкой
                или скобкой в начале строки (например,{' '}
                <code>1. Текст вопроса</code> или <code>1) Текст вопроса</code>
                ).
              </li>
              <li>
                <strong>Варианты ответа:</strong> латинские или кириллические
                буквы с разделителем (например, <code>A) Вариант</code>,{' '}
                <code>B. Вариант</code>).
              </li>
              <li>
                <strong>Ответы:</strong> строка <code>Ответ: A</code> внутри
                задания или блок ключей в конце документа (например,{' '}
                <code>Ключи: 1-A, 2-B, 3-C</code>).
              </li>
              <li>
                <strong>Ограничения:</strong> сканы без текстового слоя (OCR не
                поддерживается), формулы-картинки и устаревший <code>.doc</code>{' '}
                не поддерживаются (пересохраните в <code>.docx</code>).
              </li>
            </ul>
          </div>

          <VariantDropzone
            onFileSelect={handleFileSelect}
            disabled={isUploading}
          />

          {error && (
            <div className={styles.errorAlert} role="alert">
              <span>[ОШИБКА]</span> {error}
            </div>
          )}

          {uploadSuccess && (
            <div className={styles.successBanner} role="status">
              <div className={styles.successText}>
                ✓ Успешно записано <strong>{uploadCount}</strong> заданий в
                Firestore коллекцию <code>questions</code>!
              </div>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={reset}
              >
                Загрузить другой файл
              </button>
            </div>
          )}

          {/* Document Import Workflow (DOCX / PDF) */}
          {fileType === 'document' && documentQuestions.length > 0 && (
            <>
              <div className={styles.docSummaryCard}>
                <div className={styles.docHeaderRow}>
                  <div className={styles.docTitle}>
                    Файл: <span>{file?.name}</span>
                  </div>
                  <div className={styles.summaryGrid}>
                    <span
                      className={`${styles.statChip} ${styles.chipIncluded}`}
                    >
                      Выбрано: {includedCount} / {documentQuestions.length}
                    </span>
                    <span className={`${styles.statChip} ${styles.chipOk}`}>
                      Готово (ОК): {okCount}
                    </span>
                    {warningCount > 0 && (
                      <span
                        className={`${styles.statChip} ${styles.chipWarning}`}
                      >
                        Внимание: {warningCount}
                      </span>
                    )}
                    {errorCount > 0 && (
                      <span
                        className={`${styles.statChip} ${styles.chipError}`}
                      >
                        Ошибки: {errorCount}
                      </span>
                    )}
                    {duplicateCount > 0 && (
                      <span
                        className={`${styles.statChip} ${styles.chipDuplicate}`}
                      >
                        Дубликаты: {duplicateCount}
                      </span>
                    )}
                  </div>
                </div>

                {documentWarnings.length > 0 && (
                  <div
                    className={styles.errorAlert}
                    style={{ color: '#fbbf24' }}
                  >
                    <span>[ПРЕДУПРЕЖДЕНИЕ ПАРСЕРА]</span>
                    <ul style={{ margin: '0.25rem 0 0 1.25rem' }}>
                      {documentWarnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Toolbar */}
                <div className={styles.docToolbar}>
                  <div className={styles.toolbarGrid}>
                    <div className={styles.toolbarField}>
                      <label className={styles.toolbarLabel}>
                        Префикс ID (вариант):
                      </label>
                      <input
                        type="text"
                        className={styles.toolbarInput}
                        value={variantSlug}
                        onChange={(e) => setVariantSlug(e.target.value)}
                        placeholder="Например, ent_2026_v1"
                      />
                    </div>

                    <div className={styles.toolbarField}>
                      <label className={styles.toolbarLabel}>
                        Тема по умолчанию:
                      </label>
                      <select
                        className={styles.toolbarSelect}
                        value={defaultTopic}
                        onChange={(e) => setDefaultTopic(e.target.value)}
                      >
                        {TOPICS.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.toolbarField}>
                      <label className={styles.toolbarLabel}>
                        Сложность по умолчанию:
                      </label>
                      <select
                        className={styles.toolbarSelect}
                        value={defaultDifficulty}
                        onChange={(e) => setDefaultDifficulty(e.target.value)}
                      >
                        <option value="easy">Лёгкий (easy)</option>
                        <option value="medium">Средний (medium)</option>
                        <option value="hard">Сложный (hard)</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.bulkActionRow}>
                    <span className={styles.bulkActionLabel}>
                      Быстрые действия:
                    </span>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => applyDefaultTopicToAll(defaultTopic)}
                      title="Установить выбранную тему для всех заданий в списке"
                    >
                      Применить тему ко всем
                    </button>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() =>
                        applyDefaultDifficultyToAll(defaultDifficulty)
                      }
                      title="Установить выбранную сложность для всех заданий в списке"
                    >
                      Применить сложность ко всем
                    </button>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={includeAll}
                    >
                      Выбрать все
                    </button>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={excludeDuplicates}
                    >
                      Исключить дубликаты
                    </button>
                  </div>
                </div>

                {/* Actions row */}
                {!uploadSuccess && (
                  <div>
                    <div className={styles.actionsBar}>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={uploadVariant}
                        disabled={
                          !canSaveDocument || isUploading || includedCount === 0
                        }
                      >
                        {isUploading
                          ? 'Запись в Firestore...'
                          : `Сохранить ${includedCount} вопросов`}
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={reset}
                        disabled={isUploading}
                      >
                        Очистить
                      </button>
                    </div>

                    {!canSaveDocument && includedCount > 0 && (
                      <div className={styles.validationNotice}>
                        Для сохранения исправьте ошибки в выбранных заданиях
                        (проверьте варианты ответов, отметку правильного ответа,
                        тему и пояснение).
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Questions Editor & Preview */}
              <div className={styles.previewSection}>
                <h3 className={styles.previewHeading}>
                  Распознанные задания ({documentQuestions.length})
                </h3>
                <QuestionPreviewEditor
                  questions={documentQuestions}
                  showInclusion
                  onToggleInclude={toggleIncludeQuestion}
                  onUpdateQuestion={updateDocumentQuestion}
                  onToggleCorrectAnswer={toggleCorrectAnswer}
                  onUpdateOptionText={updateOptionText}
                  onRemoveQuestion={removeDocumentQuestion}
                />
              </div>
            </>
          )}

          {/* JSON Ingestion Workflow */}
          {fileType === 'json' && validationResult && (
            <>
              <VariantValidationSummary
                validationResult={validationResult}
                fileName={file?.name}
              />

              {/* Actions row */}
              {!uploadSuccess && (
                <div className={styles.actionsBar}>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={uploadVariant}
                    disabled={!validationResult.isValid || isUploading}
                  >
                    {isUploading
                      ? 'Запись в Firestore...'
                      : `Опубликовать в базу (${validationResult.questions.length} заданий)`}
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={reset}
                    disabled={isUploading}
                  >
                    Очистить
                  </button>
                </div>
              )}

              {/* Collapsible Questions Preview */}
              {validationResult.questions.length > 0 && (
                <div className={styles.previewSection}>
                  <h3 className={styles.previewHeading}>
                    Предпросмотр заданий ({validationResult.questions.length})
                  </h3>
                  <div className={styles.accordionList}>
                    {validationResult.questions.map((q, idx) => {
                      const isExpanded = expandedQuestionIdx === idx;
                      const isSingle = q.correctAnswers?.length === 1;

                      return (
                        <div key={q.id || idx} className={styles.accordionItem}>
                          <button
                            type="button"
                            className={styles.accordionHeader}
                            onClick={() => toggleQuestionAccordion(idx)}
                            aria-expanded={isExpanded}
                          >
                            <span className={styles.qNum}>
                              #{idx + 1} [{q.id || 'NO_ID'}]
                            </span>
                            <span className={styles.qTopicBadge}>
                              {q.topic}
                            </span>
                            <span className={styles.qTypeBadge}>
                              {isSingle ? '1 балл' : '2 балла'}
                            </span>
                            <span className={styles.accordionToggle}>
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className={styles.accordionBody}>
                              <div className={styles.questionText}>
                                {q.questionText}
                              </div>
                              <div className={styles.optionsList}>
                                {q.options?.map((opt, optIdx) => {
                                  const isCorrect =
                                    q.correctAnswers?.includes(optIdx);
                                  return (
                                    <div
                                      key={optIdx}
                                      className={`${styles.optionRow} ${
                                        isCorrect ? styles.correctOption : ''
                                      }`}
                                    >
                                      <span className={styles.optLetter}>
                                        {String.fromCharCode(65 + optIdx)})
                                      </span>
                                      <span className={styles.optText}>
                                        {opt}
                                      </span>
                                      {isCorrect && (
                                        <span className={styles.correctCheck}>
                                          ✓ Правильный
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              {q.explanation && (
                                <div className={styles.explanationBox}>
                                  <strong>Пояснение:</strong> {q.explanation}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Tab 2: AI Generator */}
      {activeTab === 'generator' && (
        <section
          className={styles.tabContent}
          aria-label="Панель генератора вариантов"
          id="ai-generator-panel"
        >
          <AiVariantGenerator />
        </section>
      )}
    </div>
  );
}

export default AdminVariantsPage;
