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

  return (
    <nav className={styles.container} aria-label="Навигация по вопросам">
      <h2 className={styles.heading}>Вопросы</h2>
      <div className={styles.grid}>
        {Array.from({ length: count }, (_, index) => {
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
        })}
      </div>
    </nav>
  );
}
