import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '@shared/ui/ConfirmDialog/ConfirmDialog';
import { PolicyModal } from './PolicyModal';
import styles from './CookieConsentModal.module.css';

export const COOKIE_CONSENT_KEY = 'prepbyte_cookie_consent_accepted';

/**
 * Cookie and Privacy Modal Banner.
 * Automatically prompts the user on first visit if consent was not yet recorded.
 * Provides easy viewing of Privacy Policy and Cookie Policy within modal dialogs.
 */
export function CookieConsentModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState(null); // 'privacy' | 'cookies' | null

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!accepted) {
        setIsOpen(true);
      }
    } catch {
      // Storage restricted or unavailable
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    } catch {
      // Ignore storage errors
    }
    setIsOpen(false);
  };

  const openPrivacyModal = (e) => {
    e.preventDefault();
    setActivePolicy('privacy');
  };

  const openCookieModal = (e) => {
    e.preventDefault();
    setActivePolicy('cookies');
  };

  const closePolicyModal = () => {
    setActivePolicy(null);
  };

  return (
    <>
      <ConfirmDialog
        open={isOpen}
        title="Согласие на использование файлов cookie"
        confirmLabel="Принять и продолжить"
        cancelLabel="Подробнее"
        onConfirm={handleAccept}
        onCancel={() => setActivePolicy('cookies')}
        description={
          <span className={styles.modalBody}>
            Мы используем строго необходимые технологии локального хранилища (cookies и localStorage)
            для обеспечения безопасной авторизации, сохранения настроек сеанса и аналитики прогресса ЕНТ.
            Продолжая работу с платформой, вы соглашаетесь с условиями нашей{' '}
            <button
              type="button"
              onClick={openPrivacyModal}
              className={styles.inlineModalLink}
            >
              Политики конфиденциальности
            </button>{' '}
            и{' '}
            <button
              type="button"
              onClick={openCookieModal}
              className={styles.inlineModalLink}
            >
              Политики файлов cookie
            </button>
            .
          </span>
        }
      />

      <PolicyModal
        type={activePolicy}
        onClose={closePolicyModal}
      />
    </>
  );
}
