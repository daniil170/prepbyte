import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudentExamPage } from './StudentExamPage';
import { useStudentExamSession } from '../hooks/useStudentExamSession';

vi.mock('../hooks/useStudentExamSession');

describe('StudentExamPage Component', () => {
  const mockExam = {
    id: 'exam_100',
    title: 'ЕНТ — Информатика',
    status: 'active',
    durationMinutes: 40,
    totalQuestions: 3,
  };

  const mockSession = {
    id: 'exam_100_user1',
    status: 'in_progress',
    answers: { q1: [1] },
    flagged: ['q2'],
  };

  const mockQuestions = [
    { id: 'q1', questionText: 'Что такое алгоритм?', options: ['Вариант A', 'Вариант B', 'Вариант C'], topic: 'Тема 1', multiple: false },
    { id: 'q2', questionText: 'Выберите языки программирования', options: ['Python', 'HTML', 'Java'], topic: 'Тема 2', multiple: true },
    { id: 'q3', questionText: 'Какая разрядность у IPv4?', options: ['32 бит', '64 бит', '128 бит'], topic: 'Тема 3', multiple: false },
  ];

  let mockHookReturn;

  beforeEach(() => {
    vi.clearAllMocks();

    mockHookReturn = {
      exam: mockExam,
      session: mockSession,
      questions: mockQuestions,
      currentQuestion: mockQuestions[0],
      currentIndex: 0,
      setCurrentIndex: vi.fn(),
      totalQuestions: 3,
      remainingSeconds: 1200,
      flagged: ['q2'],
      isWaiting: false,
      isActive: true,
      isSubmitted: false,
      isLoading: false,
      isSubmitting: false,
      error: null,
      selectAnswer: vi.fn(),
      toggleFlag: vi.fn(),
      submit: vi.fn().mockResolvedValue({ status: 'submitted' }),
    };

    useStudentExamSession.mockReturnValue(mockHookReturn);
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/exam/exam_100']}>
        <Routes>
          <Route path="/exam/:examId" element={<StudentExamPage />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders header with exam title, progress, timer and finish button', () => {
    renderPage();

    expect(screen.getByText(/ЕНТ — Информатика • Вопрос 1 из 3/i)).toBeInTheDocument();
    expect(screen.getByText(/⏱ 20:00/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Завершить экзамен' })).toBeInTheDocument();
  });

  it('displays current question, topic, and options list', () => {
    renderPage();

    expect(screen.getByText('Что такое алгоритм?')).toBeInTheDocument();
    expect(screen.getByText(/Тема: Тема 1/i)).toBeInTheDocument();
    expect(screen.getByText('Вариант A')).toBeInTheDocument();
    expect(screen.getByText('Вариант B')).toBeInTheDocument();
    expect(screen.getByText('Вариант C')).toBeInTheDocument();
  });

  it('calls selectAnswer when option is clicked', () => {
    renderPage();

    const optionB = screen.getByText('Вариант B');
    fireEvent.click(optionB);

    expect(mockHookReturn.selectAnswer).toHaveBeenCalledWith('q1', 1, { multiple: false });
  });

  it('calls toggleFlag when flag button is clicked', () => {
    renderPage();

    const flagBtn = screen.getByRole('button', { name: /⚑ Отметить/i });
    fireEvent.click(flagBtn);

    expect(mockHookReturn.toggleFlag).toHaveBeenCalledWith('q1');
  });

  it('navigates next and previous using navigation controls', () => {
    renderPage();

    const nextBtn = screen.getByRole('button', { name: /Вперёд →/i });
    fireEvent.click(nextBtn);

    expect(mockHookReturn.setCurrentIndex).toHaveBeenCalled();
  });

  it('renders navigator grid with question numbers and status indicators', () => {
    renderPage();

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
  });

  it('opens submit confirmation modal when finish exam is clicked and handles submission', async () => {
    renderPage();

    const finishBtn = screen.getByRole('button', { name: 'Завершить экзамен' });
    fireEvent.click(finishBtn);

    expect(screen.getByText('Завершение экзамена')).toBeInTheDocument();
    expect(screen.getByText(/Отвечено:/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Завершить' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockHookReturn.submit).toHaveBeenCalled();
    });
  });

  it('renders results page when session is submitted', () => {
    useStudentExamSession.mockReturnValue({
      ...mockHookReturn,
      isSubmitted: true,
      session: {
        ...mockSession,
        status: 'submitted',
        totalScore: 45,
        maxPossibleScore: 50,
        percentage: 90,
      },
    });

    renderPage();

    expect(screen.getByText('Экзамен завершён')).toBeInTheDocument();
    expect(screen.getByText('45 / 50')).toBeInTheDocument();
  });
});
