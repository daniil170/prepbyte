import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTopicLabel, isMultipleAnswer } from '@features/question-bank';
import { ConfirmDialog } from '@shared/ui/ConfirmDialog/ConfirmDialog';
import { Logo } from '@shared/ui/Logo/Logo';
import { countAnswered } from '../domain/testSession';
import { useRemainingSeconds } from '../hooks/useRemainingSeconds';
import { useTestSession } from '../hooks/useTestSession';
import { AnswerOptions } from './AnswerOptions';
import { QuestionContent } from './QuestionContent';
import { QuestionNavigator } from './QuestionNavigator';
import { SaveIndicator } from './SaveIndicator';
import { TestTimer } from './TestTimer';
import { TestResultsView } from './TestResultsView';
import { ScratchpadDrawer } from './ScratchpadDrawer';
import { ThemeToggle } from '@shared/theme';
import styles from './TestPage.module.css';

export function TestPage() {
  const { sessionId } = useParams();
  const {
    status,
    session,
    questions,
    currentQuestion,
    actions,
    saveState,
    errorMessage,
  } = useTestSession(sessionId);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);

  const remainingSeconds = useRemainingSeconds(session, {
    onExpire: actions.finish,
  });

  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.statusCard}>
          <Logo variant="mark" size={36} />
          <h1 className={styles.statusTitle}>Загрузка варианта...</h1>
          <p className={styles.statusDescription}>
            Пожалуйста, подождите, идёт подготовка заданий.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className={styles.container}>
        <div className={styles.statusCard}>
          <h1 className={styles.statusTitle}>Тест не найден</h1>
          <p className={styles.statusDescription}>
            Данная сессия тестирования не существует или принадлежит другому
            пользователю.
          </p>
          <Link to="/" className={styles.primaryLink}>
            На главную
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={styles.container}>
        <div className={styles.statusCard}>
          <h1 className={styles.statusTitle}>Ошибка загрузки</h1>
          <p className={styles.statusDescription}>
            {errorMessage || 'Не удалось загрузить данные варианта.'}
          </p>
          <Link to="/" className={styles.primaryLink}>
            На главную
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = session?.status === 'completed';

  if (isCompleted) {
    return <TestResultsView session={session} questions={questions} />;
  }

  const currentIndex = session?.currentIndex ?? 0;
  const isCurrentFlagged =
    currentQuestion && session?.flagged?.includes(currentQuestion.id);
  const answeredCount = countAnswered(session);
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/" className={styles.homeLink} title="PrepByte Главная">
            <Logo variant="mark" size={24} />
          </Link>
          <span className={styles.progressText}>
            Вопрос {currentIndex + 1} из {questions.length}
          </span>
        </div>

        <div className={styles.headerRight}>
          <TestTimer remainingSeconds={remainingSeconds} />
          <SaveIndicator saveState={saveState} />
          <ThemeToggle showLabel={false} />
          <button
            type="button"
            onClick={() => setIsScratchpadOpen((prev) => !prev)}
            className={`${styles.scratchpadButton} ${
              isScratchpadOpen ? styles.scratchpadActive : ''
            }`}
            aria-label="Белый лист и черновик"
            title="Открыть белый лист / черновик для вычислений"
          >
            <span aria-hidden="true">📝</span>
            <span>Черновик</span>
          </button>
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            className={styles.finishButton}
          >
            Завершить
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.questionArea}>
          {currentQuestion ? (
            <div className={styles.questionCard}>
              <div className={styles.questionHeader}>
                <span className={styles.topicTag}>
                  {getTopicLabel(currentQuestion.topic) ||
                    currentQuestion.topic}
                </span>
                <button
                  type="button"
                  onClick={actions.toggleFlag}
                  className={`${styles.flagButton} ${
                    isCurrentFlagged ? styles.flagActive : ''
                  }`}
                  aria-pressed={Boolean(isCurrentFlagged)}
                >
                  <span aria-hidden="true">⚑</span>
                  <span>{isCurrentFlagged ? 'Отмечено' : 'Отметить'}</span>
                </button>
              </div>

              <QuestionContent text={currentQuestion.questionText} />

              <AnswerOptions
                options={currentQuestion.options}
                selectedAnswers={session.answers[currentQuestion.id] || []}
                multiple={isMultipleAnswer(currentQuestion)}
                onSelect={actions.select}
              />
            </div>
          ) : null}

          <div className={styles.navigationBar}>
            <button
              type="button"
              onClick={() => actions.goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className={styles.navButton}
            >
              ← Назад
            </button>
            <button
              type="button"
              onClick={() => actions.goTo(currentIndex + 1)}
              disabled={currentIndex === questions.length - 1}
              className={styles.navButton}
            >
              Вперёд →
            </button>
          </div>
        </section>

        <aside className={styles.sidebar}>
          <QuestionNavigator
            questionCount={questions.length}
            session={session}
            onNavigate={actions.goTo}
          />
        </aside>
      </main>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Завершить тестирование?"
        description={
          unansweredCount > 0
            ? `У вас осталось ${unansweredCount} неотвеченных вопросов из ${questions.length}. Завершить вариант?`
            : 'Все вопросы отвечены. Завершить вариант?'
        }
        confirmLabel="Да, завершить"
        cancelLabel="Продолжить тест"
        onConfirm={async () => {
          setIsConfirmOpen(false);
          await actions.finish();
        }}
        onCancel={() => setIsConfirmOpen(false)}
      />

      <ScratchpadDrawer
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
        sessionId={session?.id}
      />
    </div>
  );
}
