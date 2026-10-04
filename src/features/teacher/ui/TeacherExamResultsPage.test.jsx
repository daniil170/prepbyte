import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TeacherExamResultsPage } from './TeacherExamResultsPage';
import * as useTeacherExamResultsModule from '../hooks/useTeacherExamResults';

vi.mock('../hooks/useTeacherExamResults');

describe('TeacherExamResultsPage component', () => {
  const mockState = {
    exam: { id: 'exam1', title: 'Экзамен по Информатике', groupName: '10-А', totalQuestions: 10, status: 'finished' },
    summary: {
      totalParticipants: 2,
      completedCount: 1,
      inProgressCount: 1,
      waitingCount: 0,
      notStartedCount: 0,
      averageScore: 9,
      averagePercentage: 90,
      highestScore: 9,
      lowestScore: 9,
      scoreDistribution: { '0-20%': 0, '21-40%': 0, '41-60%': 0, '61-80%': 0, '81-100%': 1 },
      topicPerformance: { python_loops: 90 },
      easiestQuestions: [],
      hardestQuestions: [],
    },
    participants: [
      { studentId: 's1', studentName: 'Иван Иванов', status: 'completed', score: 9, maxPossibleScore: 10, percentage: 90, startedAt: 1000, submittedAt: 2000 },
      { studentId: 's2', studentName: 'Мария Сидорова', status: 'in_progress', score: 0, maxPossibleScore: 0, percentage: 0, startedAt: 1000, submittedAt: null },
    ],
    allParticipantsCount: 2,
    searchQuery: '',
    setSearchQuery: vi.fn(),
    statusFilter: 'all',
    setStatusFilter: vi.fn(),
    sortBy: 'score',
    setSortBy: vi.fn(),
    sortOrder: 'desc',
    setSortOrder: vi.fn(),
    isLoading: false,
    error: null,
  };

  it('renders summary cards, topic chart, and participants table', () => {
    vi.spyOn(useTeacherExamResultsModule, 'useTeacherExamResults').mockReturnValue(mockState);

    render(
      <MemoryRouter initialEntries={['/teacher/exams/exam1/results']}>
        <Routes>
          <Route path="/teacher/exams/:examId/results" element={<TeacherExamResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Результаты: Экзамен по Информатике')).toBeInTheDocument();
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Мария Сидорова')).toBeInTheDocument();
    expect(screen.getByText('python_loops')).toBeInTheDocument();
    expect(screen.getAllByText('90%').length).toBeGreaterThan(0);
  });

  it('updates search query when input changes', () => {
    const setSearchSpy = vi.fn();
    vi.spyOn(useTeacherExamResultsModule, 'useTeacherExamResults').mockReturnValue({
      ...mockState,
      setSearchQuery: setSearchSpy,
    });

    render(
      <MemoryRouter initialEntries={['/teacher/exams/exam1/results']}>
        <Routes>
          <Route path="/teacher/exams/:examId/results" element={<TeacherExamResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Поиск по имени ученика...'), {
      target: { value: 'Иван' },
    });

    expect(setSearchSpy).toHaveBeenCalledWith('Иван');
  });
});
