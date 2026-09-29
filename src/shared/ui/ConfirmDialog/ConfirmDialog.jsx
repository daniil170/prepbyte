import { useEffect, useRef } from 'react';
import styles from './ConfirmDialog.module.css';

/**
 * Accessible confirm dialog implemented with native <dialog> element.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether dialog is opened.
 * @param {string} props.title - Dialog heading.
 * @param {string} [props.description] - Descriptive message.
 * @param {string} [props.confirmLabel='Подтвердить'] - Text for confirm button.
 * @param {string} [props.cancelLabel='Отмена'] - Text for cancel button.
 * @param {() => void} props.onConfirm - Confirm click handler.
 * @param {() => void} props.onCancel - Cancel / Escape handler.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      previousFocusRef.current = document.activeElement;
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
      if (
        previousFocusRef.current &&
        typeof previousFocusRef.current.focus === 'function'
      ) {
        previousFocusRef.current.focus();
      }
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e) => {
      e.preventDefault();
      onCancel?.();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [onCancel]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="dialog-title"
    >
      <h2 id="dialog-title" className={styles.title}>
        {title}
      </h2>
      {description ? <p className={styles.description}>{description}</p> : null}
      <div className={styles.actions}>
        <button
          type="button"
          onClick={onCancel}
          className={styles.buttonCancel}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={styles.buttonConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
