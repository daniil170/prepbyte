import { useEffect, useRef } from 'react';
import styles from './PolicyModal.module.css';

/**
 * Modal dialog for displaying Privacy Policy or Cookie Policy in overlay format.
 *
 * @param {object} props
 * @param {'privacy' | 'cookies' | null} props.type
 * @param {() => void} props.onClose
 */
export function PolicyModal({ type, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (type) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [type]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [onClose]);

  if (!type) return null;

  const isPrivacy = type === 'privacy';

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="policy-dialog-title">
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.badge}>
            {isPrivacy ? 'Документ' : 'Регламент'}
          </span>
          <h2 id="policy-dialog-title" className={styles.title}>
            {isPrivacy
              ? 'Политика конфиденциальности'
              : 'Политика файлов cookie и локального хранилища'}
          </h2>
          <span className={styles.version}>Версия 1.0 &bull; Октябрь 2026</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={styles.closeBtn}
          aria-label="Закрыть модальное окно"
        >
          [✕]
        </button>
      </div>

      <div className={styles.body}>
        {isPrivacy ? (
          <div className={styles.article}>
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>1. Общие положения</h3>
              <p>
                Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных
                пользователей учебной платформы подготовки к ЕНТ «PrepByte» в образовательном процессе.
              </p>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>2. Какие данные обрабатываются</h3>
              <ul>
                <li>
                  <strong>Учётные данные:</strong> фамилия, имя, класс и корпоративная почта в домене <code>@pifagorschool.kz</code>.
                </li>
                <li>
                  <strong>Учебные метрики:</strong> история попыток, выбранные ответы, набранные баллы (до 50 б.),
                  затраченное время и процент освоения профильных тем.
                </li>
                <li>
                  <strong>Технические идентификаторы:</strong> токен сессии (Firebase Auth) и идентификаторы назначенных экзаменов.
                </li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>3. Безопасность и разграничение доступа</h3>
              <p>
                Доступ к результатам строго регламентирован: ученик видит исключительно свои попытки,
                а закреплённый преподаватель — результаты учеников своих групп.
                Данные передаются по защищенным каналам TLS/HTTPS и хранятся в защищенной облачной инфраструктуре.
              </p>
            </section>
          </div>
        ) : (
          <div className={styles.article}>
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>1. Назначение хранилища</h3>
              <p>
                Платформа PrepByte применяет стандартные веб-технологии хранения (<code>localStorage</code>,
                <code>sessionStorage</code>, <code>IndexedDB</code>) исключительно для обеспечения прямого функционала сервиса.
              </p>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>2. Используемые хранилища данных</h3>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Ключ / Технология</th>
                      <th>Тип</th>
                      <th>Назначение</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>firebase:authUser:...</code></td>
                      <td>IndexedDB / Local</td>
                      <td>Поддержание защищенного сеанса пользователя</td>
                    </tr>
                    <tr>
                      <td><code>prepbyte-theme</code></td>
                      <td>localStorage</td>
                      <td>Сохранение выбранной цветовой темы интерфейса</td>
                    </tr>
                    <tr>
                      <td><code>prepbyte_cookie_consent_accepted</code></td>
                      <td>localStorage</td>
                      <td>Фиксация подтверждения ознакомления с правилами</td>
                    </tr>
                    <tr>
                      <td><code>firestore_offline_cache</code></td>
                      <td>IndexedDB</td>
                      <td>Кеширование задач для предотвращения потерь при сбоях сети</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>3. Отсутствие трекеров</h3>
              <p>
                На платформе <strong>полностью отсутствуют</strong> рекламные трекеры, маркетинговые пиксели и внешние шпионские сценарии.
              </p>
            </section>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <button type="button" onClick={onClose} className={styles.confirmBtn}>
          Понятно, закрыть
        </button>
      </div>
    </dialog>
  );
}
