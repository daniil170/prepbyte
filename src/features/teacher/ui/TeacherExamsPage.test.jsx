import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TeacherExamsPage } from './TeacherExamsPage';
import * as useTeacherExamsModule from '../hooks/useTeacherExams';

vi.mock('../hooks/useTeacherExams');

describe('TeacherExamsPage component', () => {
  it('renders exams list and handles empty state', () => {
    vi.spyOn(useTeacherExamsModule, 'useTeacherExams').mockReturnValue({
      exams: [],
      groups: [{ id: 'g1', name: '11-A', studentIds: [] }],
      statusFilter: 'all',
      setStatusFilter: vi.fn(),
      isLoading: false,
      error: null,
      actionLoadingId: null,
      createExam: vi.fn(),
      publishExam: vi.fn(),
      startExam: vi.fn(),
      finishExam: vi.fn(),
      deleteExam: vi.fn(),
    });

    render(
      <MemoryRouter>
        <TeacherExamsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Экзамены и тестирования')).toBeInTheDocument();
    expect(screen.getByText('+ Создать экзамен')).toBeInTheDocument();
    expect(screen.getByText(/У вас пока нет созданных экзаменов/)).toBeInTheDocument();
  });

  it('renders exam cards with PIN and action buttons', () => {
    const mockExams = [
      {
        id: 'exam-1',
        title: 'Февральский ЕНТ',
        groupName: '11-А',
        totalQuestions: 40,
        durationMinutes: 60,
        pin: '482731',
        status: 'waiting',
      },
    ];

    vi.spyOn(useTeacherExamsModule, 'useTeacherExams').mockReturnValue({
      exams: mockExams,
      groups: [{ id: 'g1', name: '11-A', studentIds: [] }],
      statusFilter: 'all',
      setStatusFilter: vi.fn(),
      isLoading: false,
      error: null,
      actionLoadingId: null,
      createExam: vi.fn(),
      publishExam: vi.fn(),
      startExam: vi.fn(),
      finishExam: vi.fn(),
      deleteExam: vi.fn(),
    });

    render(
      <MemoryRouter>
        <TeacherExamsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Февральский ЕНТ')).toBeInTheDocument();
    expect(screen.getByText('482731')).toBeInTheDocument();
    expect(screen.getByText('Запустить экзамен ▶')).toBeInTheDocument();
  });

  it('opens confirmation modal when clicking action button and executes on confirm', async () => {
    const startExamSpy = vi.fn().mockResolvedValue();
    const mockExams = [
      {
        id: 'exam-1',
        title: 'Февральский ЕНТ',
        groupName: '11-А',
        totalQuestions: 40,
        durationMinutes: 60,
        pin: '482731',
        status: 'waiting',
      },
    ];

    vi.spyOn(useTeacherExamsModule, 'useTeacherExams').mockReturnValue({
      exams: mockExams,
      groups: [{ id: 'g1', name: '11-A', studentIds: [] }],
      statusFilter: 'all',
      setStatusFilter: vi.fn(),
      isLoading: false,
      error: null,
      actionLoadingId: null,
      createExam: vi.fn(),
      publishExam: vi.fn(),
      startExam: startExamSpy,
      finishExam: vi.fn(),
      deleteExam: vi.fn(),
    });

    render(
      <MemoryRouter>
        <TeacherExamsPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Запустить экзамен ▶'));

    expect(screen.getByText('Запустить экзамен?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Подтвердить'));

    expect(startExamSpy).toHaveBeenCalledWith('exam-1');
  });
});
