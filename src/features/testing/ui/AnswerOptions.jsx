import styles from './AnswerOptions.module.css';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Renders multiple-choice or single-choice question answer options.
 *
 * @param {object} props
 * @param {string[]} props.options - List of text choices.
 * @param {number[]} [props.selectedAnswers=[]] - Currently selected option indices.
 * @param {boolean} [props.multiple=false] - Whether multiple selections are allowed.
 * @param {(index: number) => void} props.onSelect - Option select callback.
 * @param {boolean} [props.disabled=false] - Whether inputs are disabled.
 */
export function AnswerOptions({
  options = [],
  selectedAnswers = [],
  multiple = false,
  onSelect,
  disabled = false,
}) {
  const hint = multiple ? 'Выберите все верные ответы' : 'Выберите один ответ';

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>
        <span className={styles.hint}>{hint}</span>
      </legend>

      <div className={styles.optionsList}>
        {options.map((optionText, index) => {
          const isSelected = selectedAnswers.includes(index);
          const letter = OPTION_LETTERS[index] || `${index + 1}`;

          return (
            <label
              key={index}
              className={`${styles.optionLabel} ${isSelected ? styles.selected : ''}`}
            >
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name="answer-option"
                checked={isSelected}
                onChange={() => onSelect(index)}
                disabled={disabled}
                className={styles.input}
              />
              <span className={styles.optionLetter}>{letter})</span>
              <span className={styles.optionText}>{optionText}</span>
              {isSelected ? (
                <span className={styles.selectedIndicator} aria-hidden="true">
                  [✓]
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
