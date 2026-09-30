import { getQuestionStatus } from '../domain/testSession';
import styles from './QuestionNavigator.module.css';

/**
 * Question navigation grid of numbered buttons for test sessions.
 *
 * @param {object} props
 * @param {number} props.questionCount - Total number of questions (e.g. 40).
 * @param {object} props.session - TestSession domain entity.
 * @param {(index: number) => void} props.onNavigate - Callback invoked with target question index.
 */
export function QuestionNavigator({ questionCount, session, onNavigate }) {
  const count = questionCount || (session?.questionIds?.length ?? 40);

  const renderButton = (index) => {
    const { answered, flagged, current } = getQuestionStatus(
      session,
      index
    );

    let ariaLabel = `Вопрос ${index + 1}`;
    if (answered) {
      ariaLabel += ', отвечен';
    } else {
      ariaLabel += ', не отвечен';
    }
    if (flagged) {
      ariaLabel += ', отмечен';
    }
    if (current) {
      ariaLabel += ', текущий';
    }

    const buttonClass = [
      styles.button,
      answered ? styles.answered : '',
      current ? styles.current : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        key={index}
        type="button"
        onClick={() => onNavigate(index)}
        className={buttonClass}
        aria-label={ariaLabel}
        aria-current={current ? 'step' : undefined}
      >
        <span>{index + 1}</span>
        {flagged ? (
          <span className={styles.flagIcon} aria-hidden="true">
            ⚑
          </span>
        ) : null}
        {answered && !current ? (
          <span className={styles.answeredDot} aria-hidden="true" />
        ) : null}
      </button>
    );
  };

  if (count === 40) {
    return (
      <nav className={styles.container} aria-label="Навигация по вопросам">
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Часть 1 (№ 1–30)</span>
            <span className={styles.sectionSub}>1 балл</span>
          </div>
          <div className={styles.grid}>
            {Array.from({ length: 30 }, (_, i) => renderButton(i))}
          </div>
        </div>

        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Часть 2 (№ 31–40)</span>
            <span className={styles.sectionSub}>2 балла</span>
          </div>
          <div className={styles.grid}>
            {Array.from({ length: 10 }, (_, i) => renderButton(30 + i))}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={styles.container} aria-label="Навигация по вопросам">
      <h2 className={styles.heading}>Вопросы</h2>
      <div className={styles.grid}>
        {Array.from({ length: count }, (_, index) => renderButton(index))}
      </div>
    </nav>
  );
}
