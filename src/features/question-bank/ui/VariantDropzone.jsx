import { useCallback, useRef, useState } from 'react';
import styles from './VariantDropzone.module.css';

/**
 * Drag and drop zone for selecting variant JSON files.
 *
 * @param {object} props
 * @param {Function} props.onFileSelect - Callback when a file is selected.
 * @param {boolean} [props.disabled=false] - Whether the dropzone is disabled.
 */
export function VariantDropzone({ onFileSelect, disabled = false }) {
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
        if (file.name.endsWith('.json') || file.type === 'application/json') {
          onFileSelect(file);
        }
      }
    },
    [disabled, onFileSelect]
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
      aria-label="Загрузить JSON файл варианта"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className={styles.hiddenInput}
        onChange={handleInputChange}
        disabled={disabled}
      />
      <div className={styles.iconContainer}>
        <span className={styles.icon}>[JSON]</span>
      </div>
      <p className={styles.prompt}>
        Перетащите файл варианта сюда или{' '}
        <span className={styles.browseLink}>выберите файл</span>
      </p>
      <p className={styles.hint}>
        Поддерживается формат JSON спецификации ЕНТ (40 заданий, 50 баллов)
      </p>
    </div>
  );
}
