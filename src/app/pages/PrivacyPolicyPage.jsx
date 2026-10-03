import { Link } from 'react-router-dom';
import { Logo } from '@shared/ui/Logo/Logo';
import { ThemeToggle } from '@shared/theme';
import styles from './PrivacyPolicyPage.module.css';

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand} title="На главную">
          <Logo variant="full" size={24} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ThemeToggle />
          <Link to="/" className={styles.backLink}>
            &larr; На главную
          </Link>
        </div>
      </header>

      <main className={styles.content}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Политика конфиденциальности</h1>
          <span className={styles.meta}>Версия 1.0 &bull; Дата вступления в силу: Октябрь 2026 г.</span>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Общие положения</h2>
          <p className={styles.paragraph}>
            Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных
            пользователей учебной платформы подготовки к ЕНТ «PrepByte» (далее — «Платформа»), используемой в
            образовательном процессе школы Pifagor.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Какие данные собираются</h2>
          <p className={styles.paragraph}>
            Для обеспечения процесса подготовки к ЕНТ и мониторинга прогресса Платформа собирает следующие категории данных:
          </p>
          <ul className={styles.list}>
            <li>
              <strong>Учётные данные профиля:</strong> имя, фамилия, адрес корпоративной электронной почты
              в домене <code>@pifagorschool.kz</code>, класс (например, 10А, 11Б).
            </li>
            <li>
              <strong>Данные учебной активности:</strong> история прохождения тестов, ответы на задания, количество
              набранных баллов по 50-балльной шкале ЕНТ, затраченное время, освоение профильных тем и динамика успеваемости.
            </li>
            <li>
              <strong>Технические идентификаторы:</strong> уникальный идентификатор пользователя (Firebase Auth UID),
              привязка к учебным группам и назначенному преподавателю.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Цели обработки данных</h2>
          <ul className={styles.list}>
            <li>Предоставление доступа к тренировочным вариантам и симулятору ЕНТ по информатике.</li>
            <li>Формирование индивидуальной аналитики сильных тем и зон роста ученика.</li>
            <li>Обеспечение работы кабинета учителя: отслеживание результатов и динамики учеников прикрепленных групп.</li>
            <li>Обеспечение безопасности учётных записей и разграничение прав доступа.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Доступ к данным и безопасность</h2>
          <p className={styles.paragraph}>
            Платформа реализует строгую ролевую модель безопасности (Firestore Security Rules):
          </p>
          <ul className={styles.list}>
            <li>Ученик имеет доступ только к собственному профилю и своим сессиям тестирования.</li>
            <li>
              Преподаватель имеет доступ к данным и результатам тестирований <strong>только тех учеников</strong>,
              которые состоят в созданных им учебных группах или закреплены за ним.
            </li>
            <li>
              Данные передаются по защищенным каналам с использованием шифрования TLS/HTTPS и хранятся в защищенной
              облачной инфраструктуре Firebase (Google Cloud).
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Права пользователя</h2>
          <p className={styles.paragraph}>
            Пользователь имеет право на ознакомление со своими персональными данными, запрос на уточнение неточных данных
            или удаление учётной записи при обращении к администрации школы.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Контактная информация</h2>
          <div className={styles.placeholderNote}>
            [Проект Pifagor School &bull; Контактный email ответственного лица: privacy@pifagorschool.kz &bull; Адрес: Республика Казахстан, г. Алматы]
          </div>
        </section>
      </main>
    </div>
  );
}
