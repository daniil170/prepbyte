import { describe, expect, it } from 'vitest';
import {
  documentToExam,
  documentToExamSession,
  examSessionToDocument,
  examToDocument,
} from './examMappers';

describe('examMappers data module', () => {
  it('maps Firestore document to Exam domain model', () => {
    const data = {
      title: 'Экзамен 1',
      description: 'Описание',
      teacherId: 't1',
      groupId: 'g1',
      groupName: '11-Б',
      questionIds: ['q1', 'q2'],
      totalQuestions: 2,
      durationMinutes: 45,
      durationSeconds: 2700,
      pin: '654321',
      status: 'active',
      startsAt: 1000,
      endsAt: 3700,
      createdAt: 500,
      updatedAt: 1000,
    };

    const exam = documentToExam('exam-100', data);
    expect(exam.id).toBe('exam-100');
    expect(exam.title).toBe('Экзамен 1');
    expect(exam.pin).toBe('654321');
    expect(exam.durationSeconds).toBe(2700);
    expect(exam.status).toBe('active');
  });

  it('maps Exam domain model to Firestore document', () => {
    const exam = {
      title: 'Экзамен 2',
      teacherId: 't1',
      groupId: 'g1',
      questionIds: ['q1'],
      pin: '112233',
      status: 'draft',
      durationMinutes: 60,
      durationSeconds: 3600,
    };

    const doc = examToDocument(exam);
    expect(doc.title).toBe('Экзамен 2');
    expect(doc.pin).toBe('112233');
    expect(doc.status).toBe('draft');
  });

  it('maps Firestore document to ExamSession domain model', () => {
    const data = {
      examId: 'exam-1',
      studentId: 's1',
      studentName: 'Алихан',
      groupId: 'g1',
      status: 'in_progress',
      answers: { q1: [0] },
      totalScore: 1,
    };

    const session = documentToExamSession('sess-1', data);
    expect(session.id).toBe('sess-1');
    expect(session.studentName).toBe('Алихан');
    expect(session.answers.q1).toEqual([0]);
    expect(session.status).toBe('in_progress');
  });

  it('maps ExamSession domain model to Firestore document', () => {
    const session = {
      examId: 'exam-1',
      studentId: 's1',
      studentName: 'Алихан',
      groupId: 'g1',
      status: 'waiting',
      answers: {},
    };

    const doc = examSessionToDocument(session);
    expect(doc.examId).toBe('exam-1');
    expect(doc.studentName).toBe('Алихан');
    expect(doc.status).toBe('waiting');
  });
});
