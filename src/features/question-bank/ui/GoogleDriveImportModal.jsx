import { useEffect, useRef } from 'react';
import { useGoogleDriveImport } from '../hooks/useGoogleDriveImport';
import styles from './GoogleDriveImportModal.module.css';

/**
 * Modal dialog for importing test variants directly from Google Drive or Google Docs.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Function} props.onFileLoaded - Callback receiving the downloaded File.
 * @param {Function} [props.fetchDriveFile] - Optional injected drive fetcher for testing.
 * @param {object} [props.auth] - Optional injected auth state/methods.
 */
export function GoogleDriveImportModal({
  isOpen,
  onClose,
  onFileLoaded,
  fetchDriveFile,
  auth = null,
}) {
  const {
    driveUrl,
    setDriveUrl,
    isLoading,
    loadingMessage,
    error,
    isConnected,
    connectDrive,
    importFile,
    reset,
  } = useGoogleDriveImport({ fetchDriveFile, auth });

  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        reset();
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose, reset]);

  if (!isOpen) {
    return null;
  }

  function handleClose() {
    if (!isLoading) {
      reset();
      onClose();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const file = await importFile(driveUrl);
    if (file) {
      onFileLoaded(file);
      reset();
      onClose();
    }
  }

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          handleClose();
        }
      }}
      role="presentation"
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drive-modal-title"
      >
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <span className={styles.driveIcon} aria-hidden="true">
              📁
            </span>
            <h2 id="drive-modal-title" className={styles.title}>
              Импорт из Google Drive
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Закрыть модальное окно"
          >
            ×
          </button>
        </header>

        <p className={styles.description}>
          Загрузка варианта напрямую из Google Документов или файлов Google Диска (DOCX, PDF, JSON).
          Google Документы автоматически конвертируются в формат DOCX перед парсингом.
        </p>

        {!isConnected ? (
          <div className={styles.authNotice}>
            <p className={styles.authNoticeText}>
              Для чтения ваших файлов с Google Диска требуется однократное подтверждение доступа.
            </p>
            <div>
              <button
                type="button"
                className={styles.connectButton}
                onClick={connectDrive}
                disabled={isLoading}
              >
                <span>🔑</span> Подключить Google Диск
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.connectedStatus}>
            <span>✓</span> Google Диск подключен
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.formGroup}>
          <label htmlFor="drive-url-input" className={styles.label}>
            Ссылка на файл или документ:
          </label>
          <input
            id="drive-url-input"
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder="https://docs.google.com/document/d/... или https://drive.google.com/file/d/..."
            value={driveUrl}
            onChange={(e) => setDriveUrl(e.target.value)}
            disabled={isLoading}
            autoComplete="off"
            spellCheck={false}
          />
          <p className={styles.hint}>
            Поддерживаются: Google Документы (Docs), файлы .docx, .pdf, .json.
          </p>

          {error && <div className={styles.errorMessage}>{error}</div>}

          {isLoading && (
            <div className={styles.loadingStatus} role="status">
              <span>⏳</span> {loadingMessage}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.buttonCancel}
              onClick={handleClose}
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.buttonSubmit}
              disabled={isLoading || !driveUrl.trim()}
            >
              {isLoading ? 'Загрузка...' : 'Импортировать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
