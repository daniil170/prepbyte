import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TeacherExamLivePage } from './TeacherExamLivePage';
import * as useTeacherExamLiveModule from '../hooks/useTeacherExamLive';

vi.mock('../hooks/useTeacherExamLive');

describe('TeacherExamLivePage component', () => {
  it('renders exam stats and live participants list', () => {
    vi.spyOn(useTeacherExamLiveModule, 'useTeacherExamLive').mockReturnValue({
      exam: {
        id: 'exam-1',
        title: 'ЕНТ Информатика Live',
        totalQuestions: 40,
        durationMinutes: 60,
        pin: '556677',
        status: 'active',
      },
      group: { id: 'g1', name: '11-A', studentIds: ['s1', 's2'] },
      sessions: [
        {
          id: 'exam-1_s1',
          studentId: 's1',
          studentName: 'Алихан С.',
          status: 'in_progress',
          answers: { q1: [0], q2: [1] },
          startedAt: 1000,
        },
      ],
      stats: {
        totalEnrolled: 2,
        joinedCount: 1,
        waitingCount: 0,
        inProgressCount: 1,
        submittedCount: 0,
        averageScore: 0,
        gradedCount: 0,
      },
      isLoading: false,
      error: null,
      actionLoading: false,
      publishExam: vi.fn(),
      startExam: vi.fn(),
      finishExam: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/teacher/exams/exam-1']}>
        <Routes>
          <Route path="/teacher/exams/:examId" element={<TeacherExamLivePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('ЕНТ Информатика Live')).toBeInTheDocument();
    expect(screen.getByText('556677')).toBeInTheDocument();
    expect(screen.getByText('Алихан С.')).toBeInTheDocument();
    expect(screen.getByText('2 / 40')).toBeInTheDocument();
    expect(screen.getByText('Завершить экзамен ⏹')).toBeInTheDocument();
  });
});
