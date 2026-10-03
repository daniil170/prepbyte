import { describe, expect, it } from 'vitest';
import {
  EXAM_STATUS,
  canTransitionExamStatus,
  transitionExamStatus,
} from './examLifecycle';

describe('examLifecycle domain module', () => {
  it('defines the correct status constants', () => {
    expect(EXAM_STATUS.DRAFT).toBe('draft');
    expect(EXAM_STATUS.WAITING).toBe('waiting');
    expect(EXAM_STATUS.ACTIVE).toBe('active');
    expect(EXAM_STATUS.FINISHED).toBe('finished');
  });

  it('validates permitted status transitions', () => {
    expect(canTransitionExamStatus('draft', 'waiting')).toBe(true);
    expect(canTransitionExamStatus('draft', 'active')).toBe(true);
    expect(canTransitionExamStatus('waiting', 'active')).toBe(true);
    expect(canTransitionExamStatus('waiting', 'draft')).toBe(true);
    expect(canTransitionExamStatus('waiting', 'finished')).toBe(true);
    expect(canTransitionExamStatus('active', 'finished')).toBe(true);
  });

  it('rejects forbidden status transitions', () => {
    expect(canTransitionExamStatus('draft', 'finished')).toBe(false);
    expect(canTransitionExamStatus('active', 'draft')).toBe(false);
    expect(canTransitionExamStatus('active', 'waiting')).toBe(false);
    expect(canTransitionExamStatus('finished', 'draft')).toBe(false);
    expect(canTransitionExamStatus('finished', 'active')).toBe(false);
    expect(canTransitionExamStatus('finished', 'waiting')).toBe(false);
    expect(canTransitionExamStatus('active', 'active')).toBe(false);
  });

  it('transitions exam to active setting startsAt and endsAt', () => {
    const initialExam = {
      id: 'exam-1',
      status: 'waiting',
      durationSeconds: 3600,
    };
    const now = 1700000000000;
    const activeExam = transitionExamStatus(initialExam, 'active', { now });

    expect(activeExam.status).toBe('active');
    expect(activeExam.startsAt).toBe(now);
    expect(activeExam.endsAt).toBe(now + 3600 * 1000);
    expect(activeExam.updatedAt).toBe(now);
  });

  it('transitions exam to finished setting finishedAt', () => {
    const activeExam = {
      id: 'exam-1',
      status: 'active',
      startsAt: 1000,
      endsAt: 5000,
      durationSeconds: 4,
    };
    const now = 6000;
    const finishedExam = transitionExamStatus(activeExam, 'finished', { now });

    expect(finishedExam.status).toBe('finished');
    expect(finishedExam.finishedAt).toBe(now);
    expect(finishedExam.updatedAt).toBe(now);
  });

  it('throws when attempting invalid transition', () => {
    const finishedExam = { id: 'exam-1', status: 'finished' };
    expect(() =>
      transitionExamStatus(finishedExam, 'active')
    ).toThrowError(/Недопустимый переход статуса/);
  });
});
