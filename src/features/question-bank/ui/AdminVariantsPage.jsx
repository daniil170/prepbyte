import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useVariantUploader } from '../hooks/useVariantUploader';
import { AiVariantGenerator } from './AiVariantGenerator';
import { QuestionPreviewEditor } from './QuestionPreviewEditor';
import { VariantDropzone } from './VariantDropzone';
import { VariantPdfExportView } from './VariantPdfExportView';
import { VariantValidationSummary } from './VariantValidationSummary';
import { ThemeToggle } from '@shared/theme';
import { DraggableGlassNav } from '@shared/ui/DraggableGlassNav';
import {
  CANONICAL_VARIANT_PROMPT_TEXT,
  CANONICAL_PROMPT_PREFIX,
} from '../domain/canonicalVariantPrompt';
import exampleVariantJson from '../../../../docs/prompts/example-variant.json';
import styles from './AdminVariantsPage.module.css';

/**
 * Main administration page for question variant ingestion (JSON, DOCX, PDF) and AI generation.
 */
export function AdminVariantsPage() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'generator'
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState(null);
  const [promptCopied, setPromptCopied] = useState(false);
  const [exampleDownloaded, setExampleDownloaded] = useState(false);
  const [exportModal, setExportModal] = useState(null); // null | { mode: 'student' | 'teacher', questions, meta }

  const {
    file,
    fileType,
    validationResult,
    documentQuestions,
    documentWarnings,
    variantSlug,
    setVariantSlug,
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
    applyDefaultDifficultyToAll,
    canSaveDocument,
    includedCount,
    documentStats,
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
          <div className={styles.headerRight}>
            <ThemeToggle showLabel={false} />
            <span className={styles.adminBadge}>👑 ПАНЕЛЬ АДМИНИСТРАТОРА</span>
          </div>
        </div>
        <h1 className={styles.title}>Управление вариантами ЕНТ</h1>
        <p className={styles.subtitle}>
          Импорт стандартизированных вариантов (JSON, DOCX, PDF) и генерация
          новых заданий через нейросетевые модели.
        </p>
      </header>

      {/* Tab Navigation */}
      <DraggableGlassNav ariaLabel="Вкладки управления вариантами">
        <button
          type="button"
          className={`${styles.tabBtn} ${
            activeTab === 'upload' ? styles.tabActive : ''
          }`}
          onClick={() => setActiveTab('upload')}
        >
          <span aria-hidden="true">📁 </span>1. Загрузка файла (JSON, DOCX, PDF)
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${
            activeTab === 'generator' ? styles.tabActive : ''
          }`}
          onClick={() => setActiveTab('generator')}
        >
          <span aria-hidden="true">⚡ </span>2. ИИ-Генератор вариантов
        </button>
      </DraggableGlassNav>

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

            <div className={styles.promptGuideSection}>
              <div className={styles.promptGuideHeader}>
                <span className={styles.promptGuideBadge}>
                  🤖 ИИ-ПРОМПТ ДЛЯ ГЕНЕРАЦИИ (CANONICAL JSON)
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={styles.copyPromptBtn}
                    onClick={() => {
                      try {
                        const jsonStr = JSON.stringify(exampleVariantJson, null, 2);
                        const blob = new Blob([jsonStr], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'example-variant.json';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        setExampleDownloaded(true);
                        setTimeout(() => setExampleDownloaded(false), 2500);
                      } catch (err) {
                        console.error('Download failed', err);
                      }
                    }}
                    title="Скачать файл-эталон example-variant.json для прикрепления к ChatGPT/Claude"
                  >
                    {exampleDownloaded ? '✓ Файл скачан!' : '⬇️ Скачать эталон (JSON)'}
                  </button>
                  <button
                    type="button"
                    className={styles.copyPromptBtn}
                    onClick={() => {
                      if (navigator?.clipboard?.writeText) {
                        navigator.clipboard.writeText(CANONICAL_VARIANT_PROMPT_TEXT);
                      }
                      setPromptCopied(true);
                      setTimeout(() => setPromptCopied(false), 2500);
                    }}
                  >
                    {promptCopied ? '✓ Скопировано в буфер!' : '📋 Скопировать готовый промпт'}
                  </button>
                </div>
              </div>
              <div className={styles.promptGuideDesc}>
                <p style={{ margin: '0 0 0.35rem 0', fontWeight: 600, color: 'var(--color-text, #ffffff)' }}>
                  Инструкция для генерации эталонного пробника ЕНТ:
                </p>
                <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <li>
                    Скопируйте текст промпта ниже (кнопка <strong>«Скопировать готовый промпт»</strong>).
                  </li>
                  <li>
                    Прикрепите к сообщению файл-эталон <strong><code>example-variant.json</code></strong> (кнопка <strong>«⬇️ Скачать эталон (JSON)»</strong> выше).
                  </li>
                  <li>
                    Добавьте вводную фразу: <em>«{CANONICAL_PROMPT_PREFIX}»</em>
                  </li>
                  <li>
                    Отправьте в ChatGPT, Claude или Gemini — полученный чистый JSON загрузите в зону <strong>«⚡ Загрузить AI-пробник (Канонический JSON)»</strong> ниже.
                  </li>
                </ol>
              </div>
              <pre className={styles.promptCodeBlock}>
{CANONICAL_VARIANT_PROMPT_TEXT}
              </pre>
            </div>
          </div>

          {/* Primary Canonical Ingestion Zone: AI-JSON */}
          <div className={styles.introCard} style={{ borderLeft: '4px solid #38bdf8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 className={styles.sectionHeading} style={{ color: '#38bdf8', margin: 0 }}>
                  ⚡ Загрузить AI-пробник (Канонический JSON)
                </h3>
                <p className={styles.sectionDesc} style={{ margin: '0.25rem 0 0 0' }}>
                  Основной надёжный канал: строгая схема ЕНТ (40 заданий, 50 баллов). Валидация выполняется мгновенно при загрузке.
                </p>
              </div>
              <span className={styles.promptGuideBadge}>РЕКОМЕНДУЕМЫЙ ФОРМАТ</span>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <VariantDropzone
                onFileSelect={handleFileSelect}
                disabled={isUploading}
                jsonOnly={true}
                title="Перетащите canonical JSON-файл пробника сюда или"
                hint="Принимается только .json со структурой: 30 одиночных (1 б.) + 10 множественных (2 б.) = 50 баллов"
              />
            </div>
          </div>

          {/* Legacy / Manual Document Ingestion Zone */}
          <details className={styles.introCard} style={{ opacity: 0.9 }}>
            <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.9rem', fontWeight: 700, color: '#a3a3a3' }}>
              📁 Ручной импорт документов DOCX / PDF (Legacy)
            </summary>
            <div style={{ marginTop: '1rem' }}>
              <p className={styles.sectionDesc}>
                Используется для ручных тестов или старых вариантов. Текст парсится эвристически с проверкой структуры в редакторе.
              </p>
              <VariantDropzone
                onFileSelect={handleFileSelect}
                disabled={isUploading}
                jsonOnly={false}
                title="Перетащите DOCX, PDF или произвольный JSON файл сюда или"
                hint="DOCX / PDF с текстовым слоем"
              />
            </div>
          </details>

          {error && (
            <div className={styles.errorAlert} role="alert">
              <span>[ОШИБКА]</span> {error}
            </div>
          )}

          {uploadSuccess && (
            <div className={styles.successBanner} role="status">
              <div>
                <div className={styles.successText}>
                  ✓ Успешно записано <strong>{uploadCount}</strong> заданий в Firestore коллекцию <code>questions</code>!
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  Теперь вы можете скачать готовые PDF-бланки для печати и раздачи.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  style={{ background: '#38bdf8', color: '#000000', padding: '0.6rem 1rem' }}
                  onClick={() =>
                    setExportModal({
                      mode: 'student',
                      questions: validationResult?.questions || documentQuestions,
                      meta: validationResult?.meta || { variantId: variantSlug, title: file?.name },
                    })
                  }
                >
                  📄 Скачать PDF (Ученик)
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  style={{ borderColor: '#f59e0b', color: '#f59e0b', padding: '0.6rem 1rem' }}
                  onClick={() =>
                    setExportModal({
                      mode: 'teacher',
                      questions: validationResult?.questions || documentQuestions,
                      meta: validationResult?.meta || { variantId: variantSlug, title: file?.name },
                    })
                  }
                >
                  🔑 Ответы (PDF)
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={reset}
                >
                  Загрузить другой файл
                </button>
              </div>
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
                        placeholder="#10001"
                      />
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

                    {documentStats && includedCount > 0 && (
                      <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#a3a3a3', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span>📊 Всего: <strong>{documentStats.totalQuestions}</strong></span>
                        <span>Часть 1 (один): <strong>{documentStats.singleChoiceCount}</strong> (по 1 б.)</span>
                        <span>Часть 2 (несколько): <strong>{documentStats.multiChoiceCount}</strong> (по 2 б.)</span>
                        <span>Сумма: <strong style={{ color: documentStats.isStandard40UNT ? '#4ade80' : documentStats.totalQuestions === 40 ? '#f87171' : '#ffffff' }}>{documentStats.totalPoints} {documentStats.isStandard40UNT ? '/ 50 б. (ЕНТ ✓)' : 'б.'}</strong></span>
                      </div>
                    )}

                    {documentStats && documentStats.totalQuestions === 40 && !documentStats.isStandard40UNT && (
                      <div className={styles.validationNotice} style={{ color: '#fbbf24', marginTop: '0.5rem' }}>
                        ⚠️ Внимание: в варианте из 40 заданий сумма баллов составляет {documentStats.totalPoints} из 50 стандартных. Для ЕНТ требуется ровно 30 одиночных (1 б.) и 10 множественных (2 б.) заданий.
                      </div>
                    )}

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
                <div className={styles.actionsBar} style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
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
                    onClick={() =>
                      setExportModal({
                        mode: 'student',
                        questions: validationResult.questions,
                        meta: validationResult.meta || { variantId: variantSlug, title: file?.name },
                      })
                    }
                    disabled={validationResult.questions.length === 0}
                  >
                    📄 Предпросмотр PDF (Ученик)
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() =>
                      setExportModal({
                        mode: 'teacher',
                        questions: validationResult.questions,
                        meta: validationResult.meta || { variantId: variantSlug, title: file?.name },
                      })
                    }
                    disabled={validationResult.questions.length === 0}
                  >
                    🔑 Ответы (PDF)
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

      {exportModal && (
        <VariantPdfExportView
          variant={exportModal.meta}
          questions={exportModal.questions}
          initialMode={exportModal.mode}
          onClose={() => setExportModal(null)}
        />
      )}
    </div>
  );
}

export default AdminVariantsPage;
