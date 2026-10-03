import { useCallback, useState } from 'react';
import { useAuth } from '@features/auth';
import {
  examRepository as defaultExamRepo,
  groupRepository as defaultGroupRepo,
  isValidExamPin,
  normalizeExamPin,
  EXAM_STATUS,
  isExamAccessibleByStudent,
} from '@features/teacher';

export function useStudentExamJoin({
  examRepo = defaultExamRepo,
  groupRepo = defaultGroupRepo,
} = {}) {
  const { user } = useAuth();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePinChange = useCallback((value) => {
    const normalized = normalizeExamPin(value);
    setPin(normalized);
    setError(null);
  }, []);

  const joinExam = useCallback(
    async (pinToJoin) => {
      const targetPin = normalizeExamPin(pinToJoin || pin);
      if (!isValidExamPin(targetPin)) {
        setError('Введите корректный 6-значный PIN-код экзамена.');
        return null;
      }

      if (!user?.id) {
        setError('Для участия в экзамене необходимо войти в систему.');
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);

        const exam = await examRepo.findExamByPin(targetPin);
        if (!exam) {
          setError('Экзамен с таким PIN-кодом не найден. Проверьте код и попробуйте снова.');
          return null;
        }

        if (
          exam.status !== EXAM_STATUS.WAITING &&
          exam.status !== EXAM_STATUS.ACTIVE
        ) {
          if (exam.status === EXAM_STATUS.FINISHED) {
            setError('Этот экзамен уже завершён.');
          } else {
            setError('Экзамен пока не запущен учителем.');
          }
          return null;
        }

        // Fetch group to verify student enrollment
        const group = await groupRepo.getGroupById(exam.groupId);
        const groupStudentIds = group?.studentIds || [];
        const studentGroupId = user.groupId || '';

        const isAllowed = isExamAccessibleByStudent(
          exam,
          studentGroupId,
          user.id,
          groupStudentIds
        );

        if (!isAllowed) {
          setError(
            'Вы не состоите в группе, для которой назначен этот экзамен.'
          );
          return null;
        }

        // Create or fetch existing session
        const studentName =
          user.displayName ||
          `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
          user.email;

        const session = await examRepo.getOrCreateExamSession({
          examId: exam.id,
          studentId: user.id,
          studentName,
          groupId: exam.groupId,
          questionIds: exam.questionIds || [],
          durationSeconds: exam.durationSeconds || 3600,
          examStatus: exam.status,
        });

        return { exam, session };
      } catch (err) {
        setError(err.message || 'Произошла ошибка при подключении к экзамену.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [pin, user, examRepo, groupRepo]
  );

  return {
    pin,
    setPin: handlePinChange,
    isLoading,
    error,
    joinExam,
  };
}
