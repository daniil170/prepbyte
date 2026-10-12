import { useMemo, useState } from 'react';
import { getTopicLabel } from '../domain/topics';
import styles from './VariantPdfExportView.module.css';

const CYRILLIC_LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З'];

/**
 * Print-optimized React view for exporting UNT Computer Science mock exams.
 * Supports Student mode (no answers) and Teacher/Admin mode (correct answers + explanations).
 *
 * @param {object} props
 * @param {object} props.variant - Variant meta containing title, variantId, createdAt.
 * @param {Array<object>} props.questions - List of 40 variant questions.
 * @param {'student' | 'teacher'} [props.initialMode='student'] - Initial view mode.
 * @param {Function} props.onClose - Callback to close the modal.
 */
export function VariantPdfExportView({
  variant,
  questions = [],
  initialMode = 'student',
  onClose,
}) {
  const [mode, setMode] = useState(initialMode); // 'student' | 'teacher'

  const formattedDate = useMemo(() => {
    const rawDate = variant?.createdAt ? new Date(variant.createdAt) : new Date();
    return rawDate.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [variant?.createdAt]);

  const part1Questions = useMemo(() => {
    return questions.filter((_, idx) => idx < 30);
  }, [questions]);

  const part2Questions = useMemo(() => {
    return questions.filter((_, idx) => idx >= 30);
  }, [questions]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Экспорт варианта в PDF">
      {/* Interactive sticky toolbar (hidden when printing) */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarTitle}>
          <span>📄 Печать / Экспорт в PDF</span>
          <span
            className={`${styles.modeBadge} ${
              mode === 'student' ? styles.studentBadge : styles.teacherBadge
            }`}
          >
            {mode === 'student' ? 'Версия для учащегося' : 'Версия с ответами (Учитель)'}
          </span>
        </div>

        <div className={styles.toolbarActions}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => setMode(mode === 'student' ? 'teacher' : 'student')}
            title="Переключить режим отображения ответов"
          >
            {mode === 'student' ? '🔑 Показать ответы' : '👤 Скрыть ответы'}
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
            onClick={handlePrint}
          >
            🖨️ Сохранить в PDF / Печать
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionButtonClose}`}
            onClick={onClose}
          >
            ✕ Закрыть
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <article className={styles.paper}>
        {/* Header */}
        <header className={styles.examHeader}>
          <div className={styles.headerTop}>
            <div>
              <div className={styles.brandTitle}>PrepByte</div>
              <div className={styles.brandSubtitle}>Платформа подготовки к ЕНТ по Информатике</div>
            </div>
            <div className={styles.metaBox}>
              <div>Дата: <strong>{formattedDate}</strong></div>
              <div>ID варианта: <code>{variant?.variantId || 'unt-variant'}</code></div>
              {mode === 'teacher' && <div style={{ color: '#d97706', fontWeight: 700 }}>[ОТВЕТЫ И КЛЮЧИ]</div>}
            </div>
          </div>

          <h1 className={styles.variantTitle}>
            {variant?.title || 'Тренировочный вариант ЕНТ — Информатика'}
          </h1>

          <div className={styles.variantSpecs}>
            <span>Всего заданий: <strong>40</strong></span>
            <span>Максимальный балл: <strong>50</strong></span>
            <span>Время на выполнение: <strong>120 минут</strong></span>
          </div>
        </header>

        {/* Part 1 */}
        <section aria-labelledby="part1-heading">
          <h2 id="part1-heading" className={styles.partHeading}>
            Часть 1. Задания с одним правильным ответом (№ 1–30, по 1 баллу)
          </h2>

          {part1Questions.map((q, idx) => {
            const qNum = idx + 1;
            const correctIndices = Array.isArray(q.correctAnswers) ? q.correctAnswers : [];

            return (
              <div key={q.id || `q-${qNum}`} className={styles.questionItem}>
                <div className={styles.questionHeader}>
                  <div>
                    <span className={styles.questionNum}>Задание №{qNum}</span>
                    <span className={styles.topicBadge}>
                      {getTopicLabel(q.topic) || q.topic}
                    </span>
                  </div>
                  <span className={styles.pointsLabel}>1 балл</span>
                </div>

                <div className={styles.questionText}>{q.questionText}</div>

                <div className={styles.optionsList}>
                  {(q.options || []).map((opt, optIdx) => {
                    const letter = CYRILLIC_LETTERS[optIdx] || optIdx + 1;
                    const isCorrect = mode === 'teacher' && correctIndices.includes(optIdx);

                    return (
                      <div
                        key={optIdx}
                        className={`${styles.optionItem} ${isCorrect ? styles.optionCorrect : ''}`}
                      >
                        <span className={styles.optionLetter}>{letter})</span>
                        <span className={styles.optionText}>{opt}</span>
                        {isCorrect && (
                          <span className={styles.correctTag}>✓ Правильный ответ</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {mode === 'teacher' && q.explanation && (
                  <div className={styles.teacherBox}>
                    <div className={styles.teacherAnswerKey}>
                      Правильный ответ:{' '}
                      {correctIndices.map((ci) => CYRILLIC_LETTERS[ci] || ci + 1).join(', ')}
                    </div>
                    <div className={styles.explanationText}>
                      <strong>Пояснение:</strong> {q.explanation}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Part 2 */}
        <section aria-labelledby="part2-heading">
          <h2 id="part2-heading" className={styles.partHeading}>
            Часть 2. Задания с несколькими правильными ответами (№ 31–40, по 2 балла)
          </h2>

          {part2Questions.map((q, idx) => {
            const qNum = 31 + idx;
            const correctIndices = Array.isArray(q.correctAnswers) ? q.correctAnswers : [];

            return (
              <div key={q.id || `q-${qNum}`} className={styles.questionItem}>
                <div className={styles.questionHeader}>
                  <div>
                    <span className={styles.questionNum}>Задание №{qNum}</span>
                    <span className={styles.topicBadge}>
                      {getTopicLabel(q.topic) || q.topic}
                    </span>
                  </div>
                  <span className={styles.pointsLabel}>2 балла</span>
                </div>

                <div className={styles.questionText}>{q.questionText}</div>

                <div className={styles.optionsList}>
                  {(q.options || []).map((opt, optIdx) => {
                    const letter = CYRILLIC_LETTERS[optIdx] || optIdx + 1;
                    const isCorrect = mode === 'teacher' && correctIndices.includes(optIdx);

                    return (
                      <div
                        key={optIdx}
                        className={`${styles.optionItem} ${isCorrect ? styles.optionCorrect : ''}`}
                      >
                        <span className={styles.optionLetter}>{letter})</span>
                        <span className={styles.optionText}>{opt}</span>
                        {isCorrect && (
                          <span className={styles.correctTag}>✓ Правильный ответ</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {mode === 'teacher' && q.explanation && (
                  <div className={styles.teacherBox}>
                    <div className={styles.teacherAnswerKey}>
                      Правильные ответы:{' '}
                      {correctIndices.map((ci) => CYRILLIC_LETTERS[ci] || ci + 1).join(', ')}
                    </div>
                    <div className={styles.explanationText}>
                      <strong>Пояснение:</strong> {q.explanation}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Footer */}
        <footer className={styles.examFooter}>
          <span>PrepByte — Подготовка к ЕНТ по Информатике</span>
          <span>prepbyte.kz</span>
        </footer>
      </article>
    </div>
  );
}
