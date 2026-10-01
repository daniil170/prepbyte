import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '@shared/ui/ConfirmDialog/ConfirmDialog';
import { pluralize } from '@shared/lib/pluralize';
import { countAnswered, getRemainingSeconds } from '../domain/testSession';
import { useActiveSession } from '../hooks/useActiveSession';
import { useStartTest } from '../hooks/useStartTest';
import { useQuestionCoverage } from '../hooks/useQuestionCoverage';
import { useTestingDependencies } from '../hooks/useTestingDependencies';
import styles from './StartTestPanel.module.css';

function formatMinutesAndSeconds(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/**
 * Start and resume test control panel rendered on the home dashboard.
 */
export function StartTestPanel() {
  const navigate = useNavigate();
  const { activeSession, isLoading } = useActiveSession();
  const { startTest, isStarting, error } = useStartTest();
  const {
    total,
    seen,
    unseen,
    isLoading: isCoverageLoading,
    error: coverageError,
  } = useQuestionCoverage();
  const { now } = useTestingDependencies();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleStartNew = async () => {
    setIsConfirmOpen(false);
    try {
      const sessionId = await startTest();
      navigate(`/test/${sessionId}`);
    } catch {
      // Error handled in hook state
    }
  };

  const handleResume = () => {
    if (activeSession) {
      navigate(`/test/${activeSession.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.card}>
        <h2 className={styles.title}>Подготовка тестирования...</h2>
        <p className={styles.description}>Проверка активных сессий</p>
      </div>
    );
  }

  const hasActiveSession = Boolean(activeSession);
  const remainingSec = hasActiveSession
    ? getRemainingSeconds(activeSession, now)
    : 0;
  const answered = hasActiveSession ? countAnswered(activeSession) : 0;
  const totalQuestions = hasActiveSession
    ? activeSession.questionIds?.length || 40
    : 40;

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Пробное тестирование ЕНТ</h2>
      <p className={styles.description}>
        Сбалансированный вариант из всех ключевых тем информатики в формате
        национального экзамена.
      </p>

      {isCoverageLoading ? (
        <div
          className={styles.coverageSkeleton}
          aria-label="Загрузка статистики банка вопросов"
        />
      ) : !coverageError && total > 0 ? (
        <div className={styles.coverageStats}>
          Вы видели {seen} из {total}{' '}
          {pluralize(total, ['вопроса', 'вопросов', 'вопросов'])} банка
        </div>
      ) : null}

      {hasActiveSession ? (
        <div className={styles.activeInfo}>
          <div className={styles.activeHeading}>Обнаружен активный вариант</div>
          <div className={styles.activeDetails}>
            <span className={styles.activeDetailItem}>
              Осталось времени:{' '}
              <strong>{formatMinutesAndSeconds(remainingSec)}</strong>
            </span>
            <span className={styles.activeDetailItem}>
              Отвечено:{' '}
              <strong>
                {answered} из {totalQuestions}
              </strong>
            </span>
          </div>
        </div>
      ) : (
        <div className={styles.metaList}>
          <span className={styles.metaItem}>40 вопросов, 60 минут</span>
        </div>
      )}

      <div className={styles.actions}>
        {hasActiveSession ? (
          <>
            <button
              type="button"
              onClick={handleResume}
              className={styles.primaryButton}
            >
              Продолжить вариант
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={isStarting}
              className={styles.secondaryButton}
            >
              {isStarting ? 'Запуск...' : 'Начать новый вариант'}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleStartNew}
            disabled={isStarting}
            className={styles.primaryButton}
          >
            {isStarting ? 'Формирование варианта...' : 'Начать пробный вариант'}
          </button>
        )}
      </div>

      {!isCoverageLoading && !coverageError && total > 0 && unseen < 40 ? (
        <p className={styles.coverageNotice}>
          В банке осталось {unseen}{' '}
          {pluralize(unseen, [
            'новый вопрос',
            'новых вопроса',
            'новых вопросов',
          ])}
          . Остальные в следующем варианте будут повторами тех, что вы видели
          давнее всего.
        </p>
      ) : null}

      {error ? <div className={styles.errorMessage}>{error}</div> : null}

      <ConfirmDialog
        open={isConfirmOpen}
        title="Начать новый вариант?"
        description="Текущий незавершённый вариант будет отменён, а его результаты будут помечены как брошенные. Начать заново?"
        confirmLabel="Да, начать новый"
        cancelLabel="Вернуться"
        onConfirm={handleStartNew}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
