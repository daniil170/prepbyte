import { useCallback, useRef, useState } from 'react';
import styles from './VariantDropzone.module.css';

/**
 * Drag and drop zone for selecting variant files (JSON only or legacy DOCX/PDF/JSON).
 *
 * @param {object} props
 * @param {Function} props.onFileSelect - Callback when a file is selected.
 * @param {boolean} [props.disabled=false] - Whether the dropzone is disabled.
 * @param {boolean} [props.jsonOnly=false] - If true, restricts to JSON only with strict canonical validation.
 * @param {string} [props.title] - Custom prompt title.
 * @param {string} [props.hint] - Custom hint text.
 */
export function VariantDropzone({
  onFileSelect,
  disabled = false,
  jsonOnly = false,
  title,
  hint,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      const droppedFiles = e.dataTransfer?.files;
      if (droppedFiles && droppedFiles.length > 0) {
        const file = droppedFiles[0];
        const lower = (file.name || '').toLowerCase();

        if (jsonOnly) {
          if (lower.endsWith('.json') || file.type === 'application/json') {
            onFileSelect(file);
          }
          return;
        }

        if (
          lower.endsWith('.json') ||
          lower.endsWith('.docx') ||
          lower.endsWith('.pdf') ||
          file.type === 'application/json' ||
          file.type === 'application/pdf' ||
          file.type ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          onFileSelect(file);
        }
      }
    },
    [disabled, jsonOnly, onFileSelect]
  );

  const handleInputChange = useCallback(
    (e) => {
      const selected = e.target.files?.[0];
      if (selected) {
        onFileSelect(selected);
      }
      // Reset input value so same file can be selected again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [onFileSelect]
  );

  const handleClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  const defaultTitle = jsonOnly
    ? 'Перетащите canonical JSON-файл пробника сюда или'
    : 'Перетащите файл варианта сюда или';

  const defaultHint = jsonOnly
    ? 'Принимаются только валидные .json файлы (строгая спецификация ЕНТ: 40 заданий, 50 баллов)'
    : 'Поддерживаются форматы JSON, DOCX и PDF (с текстовым слоем)';

  return (
    <div
      className={`${styles.dropzone} ${isDragOver ? styles.dragOver : ''} ${
        disabled ? styles.disabled : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      aria-label={
        jsonOnly
          ? 'Загрузить канонический JSON-пробник'
          : 'Загрузить файл варианта (JSON, DOCX, PDF)'
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept={
          jsonOnly
            ? '.json,application/json'
            : '.json,application/json,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,application/pdf'
        }
        className={styles.hiddenInput}
        onChange={handleInputChange}
        disabled={disabled}
      />
      <div className={styles.iconContainer}>
        <span className={styles.icon}>
          {jsonOnly ? '[AI CANONICAL JSON]' : '[DOC / JSON]'}
        </span>
      </div>
      <p className={styles.prompt}>
        {title || defaultTitle}{' '}
        <span className={styles.browseLink}>выберите файл</span>
      </p>
      <p className={styles.hint}>{hint || defaultHint}</p>
    </div>
  );
}
