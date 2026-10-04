import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TeacherStudentAnalyticsPage } from './TeacherStudentAnalyticsPage';
import * as useTeacherStudentAnalyticsModule from '../hooks/useTeacherStudentAnalytics';

vi.mock('../hooks/useTeacherStudentAnalytics');

describe('TeacherStudentAnalyticsPage component', () => {
  const mockState = {
    exam: { id: 'exam1', title: 'Экзамен по Алгебре' },
    student: {
      studentId: 's1',
      studentName: 'Иван Иванов',
      groupId: '10-А',
      status: 'completed',
      score: 10,
      maxPossibleScore: 10,
      percentage: 100,
      correctAnswersCount: 5,
      incorrectAnswersCount: 0,
      unansweredCount: 0,
      startedAt: 1000,
      submittedAt: 2000,
      durationSeconds: 120,
    },
    topicBreakdown: { algebra: { score: 10, maxScore: 10, percentage: 100 } },
    questions: [
      {
        index: 1,
        id: 'q1',
        questionText: 'Решите уравнение x + 2 = 5',
        topic: 'algebra',
        difficulty: 'easy',
        options: ['1', '2', '3', '4'],
        studentAnswer: [2],
        correctAnswers: [2],
        status: 'correct',
        pointsAwarded: 2,
        maxPoints: 2,
      },
    ],
    isLoading: false,
    error: null,
  };

  it('renders student analytics, topic breakdown, and question table', () => {
    vi.spyOn(useTeacherStudentAnalyticsModule, 'useTeacherStudentAnalytics').mockReturnValue(mockState);

    render(
      <MemoryRouter initialEntries={['/teacher/exams/exam1/results/s1']}>
        <Routes>
          <Route path="/teacher/exams/:examId/results/:studentId" element={<TeacherStudentAnalyticsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Аналитика ученика: Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Решите уравнение x + 2 = 5')).toBeInTheDocument();
    expect(screen.getByText(/✓ Верно/)).toBeInTheDocument();
    expect(screen.getByText('10 / 10')).toBeInTheDocument();
  });
});
