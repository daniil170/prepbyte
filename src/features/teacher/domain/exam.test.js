import { describe, expect, it } from 'vitest';
import {
  createExam,
  isExamAccessibleByStudent,
  validateExamInput,
} from './exam';

describe('exam domain module', () => {
  it('validates exam inputs correctly', () => {
    expect(
      validateExamInput({
        title: 'ЕНТ Информатика Вариант 1',
        groupId: 'grp-1',
        questionIds: ['q1', 'q2'],
        durationMinutes: 60,
      }).valid
    ).toBe(true);

    expect(
      validateExamInput({
        title: 'ab',
        groupId: 'grp-1',
        durationMinutes: 60,
      }).valid
    ).toBe(false);

    expect(
      validateExamInput({
        title: 'Valid Title',
        groupId: '',
        durationMinutes: 60,
      }).valid
    ).toBe(false);

    expect(
      validateExamInput({
        title: 'Valid Title',
        groupId: 'grp-1',
        durationMinutes: 4, // Below 5 min
      }).valid
    ).toBe(false);
  });

  it('creates an immutable exam entity', () => {
    const exam = createExam({
      id: 'exam-1',
      title: 'Пробный экзамен 11-A',
      teacherId: 'teacher-1',
      groupId: 'grp-1',
      groupName: '11-A',
      questionIds: ['q1', 'q2', 'q3'],
      durationMinutes: 60,
      now: 1000,
    });

    expect(exam.id).toBe('exam-1');
    expect(exam.title).toBe('Пробный экзамен 11-A');
    expect(exam.teacherId).toBe('teacher-1');
    expect(exam.groupId).toBe('grp-1');
    expect(exam.totalQuestions).toBe(3);
    expect(exam.durationSeconds).toBe(3600);
    expect(exam.pin).toHaveLength(6);
    expect(exam.status).toBe('draft');
    expect(exam.createdAt).toBe(1000);
  });

  it('determines student accessibility based on status and group', () => {
    const waitingExam = {
      id: 'exam-1',
      status: 'waiting',
      groupId: 'grp-1',
    };
    const draftExam = {
      id: 'exam-2',
      status: 'draft',
      groupId: 'grp-1',
    };

    expect(isExamAccessibleByStudent(waitingExam, 'grp-1', 's1')).toBe(true);
    expect(isExamAccessibleByStudent(waitingExam, 'grp-2', 's1', ['s1'])).toBe(
      true
    );
    expect(isExamAccessibleByStudent(waitingExam, 'grp-2', 's1', ['s2'])).toBe(
      false
    );
    expect(isExamAccessibleByStudent(draftExam, 'grp-1', 's1')).toBe(false);
  });
});
