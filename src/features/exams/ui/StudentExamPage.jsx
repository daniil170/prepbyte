import { useParams, Link } from 'react-router-dom';
import { useStudentExamSession } from '../hooks/useStudentExamSession';
import { StudentExamResultPage } from './StudentExamResultPage';
import styles from './StudentExamPage.module.css';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function StudentExamPage() {
  const { examId } = useParams();
  const {
    exam,
    session,
    questions,
    currentQuestion,
    currentIndex,
    setCurrentIndex,
    totalQuestions,
    remainingSeconds,
    isWaiting,
    isSubmitted,
    isLoading,
    isSubmitting,
    error,
    selectAnswer,
    submit,
  } = useStudentExamSession(examId);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBox}>Подключение к экзамену...</div>
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>
          <p>{error}</p>
          <Link to="/" style={{ marginTop: 16, display: 'inline-block' }}>
            ← На главную
          </Link>
        </div>
      </div>
    );
  }

  // 1. Submitted State -> View Results
  if (isSubmitted) {
    return <StudentExamResultPage session={session} exam={exam} />;
  }

  // 2. Waiting Room State
  if (isWaiting) {
    return (
      <div className={styles.page}>
        <div className={styles.waitingContainer}>
          <div className={styles.waitingCard}>
            <div className={styles.waitingPulse} />
            <span className={styles.waitingStatus}>Ожидание запуска</span>
            <h1 className={styles.waitingTitle}>{exam?.title || 'Онлайн-экзамен'}</h1>
            <p className={styles.waitingText}>
              Вы успешно подключились к экзамену по PIN-коду. Ожидайте, пока
              преподаватель запустит тестирование. Страница обновится
              автоматически.
            </p>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Длительность: <strong>{exam?.durationMinutes || 60} мин</strong> •
              Вопросов: <strong>{exam?.totalQuestions || 40}</strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Active Exam State
  const selectedOptions = currentQuestion
    ? session?.answers?.[currentQuestion.id] || []
    : [];
  const isMultipleChoice = currentQuestion?.multiple || (Array.isArray(currentQuestion?.correctAnswers) && currentQuestion.correctAnswers.length > 1);

  const handleOptionClick = (index) => {
    if (!currentQuestion) return;
    selectAnswer(currentQuestion.id, index, { multiple: isMultipleChoice });
  };

  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isWarningTimer = remainingSeconds > 0 && remainingSeconds < 300;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          {exam?.title || 'Экзамен'} • Вопрос {currentIndex + 1} из {totalQuestions}
        </div>

        <div className={styles.headerRight}>
          <div
            className={`${styles.timer} ${
              isWarningTimer ? styles.timerWarning : ''
            }`}
          >
            ⏱ {formatTime(remainingSeconds)}
          </div>

          <button
            type="button"
            className={styles.finishBtn}
            onClick={() => {
              if (
                window.confirm(
                  'Вы уверены, что хотите завершить экзамен и отправить ответы?'
                )
              ) {
                submit();
              }
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Отправка...' : 'Завершить экзамен'}
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        {/* Current Question View */}
        {currentQuestion && (
          <div className={styles.questionCard}>
            <div className={styles.questionMeta}>
              <span>
                {isMultipleChoice
                  ? 'Несколько правильных ответов (до 2 баллов)'
                  : 'Один правильный ответ (1 балл)'}
              </span>
              <span>Тема: {currentQuestion.topic || 'Общая'}</span>
            </div>

            <div className={styles.questionText}>
              {currentQuestion.questionText}
            </div>

            <div className={styles.optionsList}>
              {(currentQuestion.options || []).map((optionText, idx) => {
                const isSelected = selectedOptions.includes(idx);
                const letter = OPTION_LETTERS[idx] || String(idx + 1);

                return (
                  <div
                    key={idx}
                    className={`${styles.optionItem} ${
                      isSelected ? styles.optionItemSelected : ''
                    }`}
                    onClick={() => handleOptionClick(idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleOptionClick(idx);
                      }
                    }}
                  >
                    <span className={styles.optionLetter}>{letter}.</span>
                    <span className={styles.optionText}>{optionText}</span>
                  </div>
                );
              })}
            </div>

            <div className={styles.navigationControls}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
              >
                ← Назад
              </button>

              <button
                type="button"
                className={styles.navBtn}
                onClick={() =>
                  setCurrentIndex((prev) =>
                    Math.min(totalQuestions - 1, prev + 1)
                  )
                }
                disabled={isLastQuestion}
              >
                Вперёд →
              </button>
            </div>
          </div>
        )}

        {/* Question Navigator Grid */}
        <div className={styles.navGridContainer}>
          <span className={styles.navGridTitle}>Навигация по заданиям</span>
          <div className={styles.navGrid}>
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered =
                session?.answers?.[q.id] && session.answers[q.id].length > 0;

              return (
                <button
                  key={q.id || idx}
                  type="button"
                  className={`${styles.navGridBtn} ${
                    isCurrent
                      ? styles.navGridBtnCurrent
                      : isAnswered
                      ? styles.navGridBtnAnswered
                      : ''
                  }`}
                  onClick={() => setCurrentIndex(idx)}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
