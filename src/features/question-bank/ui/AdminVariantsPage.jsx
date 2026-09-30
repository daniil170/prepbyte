import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useVariantUploader } from '../hooks/useVariantUploader';
import { AiVariantGenerator } from './AiVariantGenerator';
import { VariantDropzone } from './VariantDropzone';
import { VariantValidationSummary } from './VariantValidationSummary';
import styles from './AdminVariantsPage.module.css';

/**
 * Main administration page for question variant ingestion and AI generation.
 */
export function AdminVariantsPage() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'generator'
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState(null);

  const {
    file,
    validationResult,
    isUploading,
    uploadSuccess,
    uploadCount,
    error,
    handleFileSelect,
    uploadVariant,
    reset,
  } = useVariantUploader();

  const toggleQuestionAccordion = (index) => {
    setExpandedQuestionIdx((prev) => (prev === index ? null : index));
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.navRow}>
          <Link to="/" className={styles.backLink}>
            ← На главную
          </Link>
          <span className={styles.adminBadge}>[ADMIN WORKSPACE]</span>
        </div>
        <h1 className={styles.title}>Управление вариантами ЕНТ</h1>
        <p className={styles.subtitle}>
          Импорт стандартизированных JSON-вариантов и генерация новых заданий
          через нейросетевые модели.
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
          1. Загрузка файла (JSON)
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
              Загрузка JSON-файла варианта
            </h2>
            <p className={styles.sectionDesc}>
              Загрузите JSON-файл варианта ЕНТ. Система автоматически выполнит
              проверку структуры, баллов, тем и индексов ответов.
            </p>
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
                Загрузить другой вариант
              </button>
            </div>
          )}

          {validationResult && (
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
          aria-label="ИИ-Генератор вариантов"
          id="ai-generator-panel"
        >
          <AiVariantGenerator />
        </section>
      )}
    </div>
  );
}

export default AdminVariantsPage;
