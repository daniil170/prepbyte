import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AnswerOptions } from '@features/testing/ui/AnswerOptions';
import { CalculatorModal } from '@shared/ui/Calculator';
import { ThemeToggle } from '@shared/theme';
import { useStudentExamSession } from '../hooks/useStudentExamSession';
import { StudentExamResultPage } from './StudentExamResultPage';
import styles from './StudentExamPage.module.css';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function formatTime(seconds) {
  const num = Number(seconds);
  if (Number.isNaN(num) || num <= 0) {
    return '00:00';
  }
  const total = Math.floor(num);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function StudentExamPage() {
  const { examId } = useParams();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isPrepAccepted, setIsPrepAccepted] = useState(false);
  const [toastViolation, setToastViolation] = useState(null);

  const {
    exam,
    session,
    questions,
    currentQuestion,
    currentIndex,
    setCurrentIndex,
    totalQuestions,
    remainingSeconds,
    flagged,
    isWaiting,
    isSubmitted,
    isDisqualified,
    violationCount,
    maxViolations,
    disqualificationReason,
    latestViolation,
    requestFullscreen,
    isLoading,
    isSubmitting,
    error,
    selectAnswer,
    toggleFlag,
    submit,
  } = useStudentExamSession(examId);

  useEffect(() => {
    if (latestViolation) {
      const showTimer = setTimeout(() => setToastViolation(latestViolation), 0);
      const hideTimer = setTimeout(() => setToastViolation(null), 4000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
    return () => {};
  }, [latestViolation]);

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

  // 1. Disqualified State -> Lock Exam completely (Requirement 6I)
  if (isDisqualified) {
    return (
      <div className={styles.page}>
        <div className={styles.disqualifiedContainer}>
          <div className={styles.disqualifiedCard}>
            <div className={styles.disqualifiedIcon}>🛑</div>
            <h1 className={styles.disqualifiedTitle}>Экзамен аннулирован</h1>
            <p className={styles.disqualifiedReason}>
              Причина: {disqualificationReason || 'Превышен допустимый лимит нарушений.'}
            </p>
            <div className={styles.disqualifiedCounter}>
              Нарушения: <strong>{violationCount}/{maxViolations}</strong>
            </div>
            <Link to="/" className={styles.disqualifiedHomeBtn}>
              Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Submitted State -> View Results
  if (isSubmitted) {
    return <StudentExamResultPage session={session} exam={exam} />;
  }

  // 3. Waiting Room State
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

  // 4. Preparation Box / Screen (Requirement 6H)
  if (!isPrepAccepted && session?.status !== 'in_progress') {
    const handleStartClick = async () => {
      await requestFullscreen();
      setIsPrepAccepted(true);
    };

    return (
      <div className={styles.page}>
        <div className={styles.prepContainer}>
          <div className={styles.prepCard}>
            <h1 className={styles.prepTitle}>Подготовка к экзамену</h1>
            <div style={{ width: '100%' }}>
              <p style={{ fontSize: '0.875rem', marginBottom: 12, color: 'var(--color-text-muted)' }}>
                Для прохождения необходимо:
              </p>
              <ul className={styles.prepList}>
                <li className={styles.prepItem}>• Полноэкранный режим</li>
                <li className={styles.prepItem}>• Не переключаться между вкладками</li>
                <li className={styles.prepItem}>• Не копировать и не вставлять текст</li>
                <li className={styles.prepItem}>• Не использовать контекстное меню</li>
              </ul>
            </div>
            <div className={styles.violationBadge}>
              Нарушения: <strong>{violationCount}/{maxViolations}</strong>
            </div>
            <button
              type="button"
              className={styles.prepStartBtn}
              onClick={handleStartClick}
            >
              Начать экзамен
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Active Exam State
  const selectedOptions = currentQuestion
    ? session?.answers?.[currentQuestion.id] || []
    : [];
  const isMultipleChoice =
    currentQuestion?.multiple ||
    (Array.isArray(currentQuestion?.correctAnswers) &&
      currentQuestion.correctAnswers.length > 1);

  const isCurrentFlagged = currentQuestion ? flagged.includes(currentQuestion.id) : false;

  const handleOptionClick = (index) => {
    if (!currentQuestion || isSubmitting) return;
    selectAnswer(currentQuestion.id, index, { multiple: isMultipleChoice });
  };

  const handleToggleFlag = () => {
    if (!currentQuestion || isSubmitting) return;
    toggleFlag(currentQuestion.id);
  };

  const answeredCount = Object.values(session?.answers || {}).filter(
    (ans) => Array.isArray(ans) && ans.length > 0
  ).length;

  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isWarningTimer = remainingSeconds > 0 && remainingSeconds < 300;

  const handleConfirmSubmit = async () => {
    setShowSubmitModal(false);
    await submit();
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          {exam?.title || 'Экзамен'} • Вопрос {currentIndex + 1} из {totalQuestions}
        </div>

        <div className={styles.headerRight}>
          <button
            type="button"
            className={styles.calcBtn}
            onClick={() => setIsCalcOpen(true)}
            title="Открыть калькулятор"
          >
            🧮 Калькулятор
          </button>

          <ThemeToggle showLabel={false} />

          <div className={styles.violationBadge}>
            🛡️ Нарушения: {violationCount}/{maxViolations}
          </div>

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
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Отправка...' : 'Завершить экзамен'}
          </button>
        </div>
      </header>

      {/* Calculator Modal */}
      <CalculatorModal isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />

      {/* Violation Toast Notification */}
      {toastViolation && (
        <div className={styles.violationToast}>
          ⚠️ Нарушение зафиксировано: {violationCount}/{maxViolations}
        </div>
      )}

      <main className={styles.mainContent}>
        {/* Current Question View */}
        {currentQuestion && (
          <div className={styles.questionCard}>
            <div className={styles.questionMeta}>
              <span className={styles.questionTopic}>{currentQuestion.topic || 'Информатика'}</span>
              <button
                type="button"
                className={`${styles.flagBtn} ${isCurrentFlagged ? styles.flagBtnActive : ''}`}
                onClick={handleToggleFlag}
              >
                {isCurrentFlagged ? '🚩 В закладках' : '🏳️ Добавить закладку'}
              </button>
            </div>

            <h2 className={styles.questionText}>{currentQuestion.questionText}</h2>

            <AnswerOptions
              options={currentQuestion.options}
              selectedAnswers={selectedOptions}
              multiple={isMultipleChoice}
              onSelect={handleOptionClick}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Navigation & Controls */}
        <div className={styles.bottomBar}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
          >
            ← Назад
          </button>

          <div className={styles.navGrid}>
            {questions.map((q, idx) => {
              const isAns =
                Array.isArray(session?.answers?.[q.id]) &&
                session.answers[q.id].length > 0;
              const isFlg = flagged.includes(q.id);
              const isCur = idx === currentIndex;

              let btnClass = styles.navGridBtn;
              if (isAns) btnClass += ` ${styles.navGridBtnAnswered}`;
              if (isFlg) btnClass += ` ${styles.navGridBtnFlagged}`;
              if (isCur) btnClass += ` ${styles.navGridBtnCurrent}`;

              return (
                <button
                  key={q.id || idx}
                  type="button"
                  className={btnClass}
                  onClick={() => setCurrentIndex(idx)}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
            disabled={isLastQuestion}
          >
            Вперёд →
          </button>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Завершить экзамен?</h3>
            <p className={styles.modalText}>
              Вы ответили на {answeredCount} из {totalQuestions} вопросов. После завершения
              изменение ответов будет невозможно.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setShowSubmitModal(false)}
              >
                Отмена
              </button>
              <button
                type="button"
                className={styles.modalConfirmBtn}
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Отправка...' : 'Да, завершить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
