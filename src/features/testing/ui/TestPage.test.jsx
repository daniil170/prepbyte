import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@features/auth';
import { createSession } from '../domain/testSession';
import { TestingProvider } from '../hooks/TestingProvider';
import { TestPage } from './TestPage';

describe('TestPage Integration', () => {
  const mockUser = { uid: 'u1', email: 'student@prepbyte.kz' };
  const mockAuthRepo = {
    subscribeToAuthState: (cb) => {
      cb(mockUser);
      return () => {};
    },
  };

  const mockQuestions = [
    {
      id: 'q-1',
      topic: 'python_loops',
      questionText: 'Что такое цикл for?',
      options: ['Инструкция повторения', 'Функция', 'Модуль'],
      correctAnswers: [0],
      explanation: 'Объяснение 1',
      difficulty: 'easy',
      version: 1,
    },
    {
      id: 'q-2',
      topic: 'sql_queries',
      questionText: 'Какой оператор выбирает строки в SQL?',
      options: ['SELECT', 'CHOOSE', 'GET'],
      correctAnswers: [0],
      explanation: 'Объяснение 2',
      difficulty: 'easy',
      version: 1,
    },
  ];

  it('allows answering, navigating, flagging, and finishing the test', async () => {
    let currentSession = createSession({
      id: 'sess-123',
      userId: 'u1',
      questionIds: ['q-1', 'q-2'],
      durationLimitSec: 3600,
      now: 1700000000000,
    });

    const sessionRepo = {
      getSessionById: vi.fn().mockImplementation(async () => currentSession),
      saveProgress: vi.fn().mockImplementation(async (s) => {
        currentSession = s;
      }),
      finishSession: vi.fn().mockImplementation(async (s) => {
        currentSession = s;
      }),
    };

    const questionRepo = {
      getQuestionsByIds: vi.fn().mockResolvedValue(mockQuestions),
    };

    render(
      <MemoryRouter initialEntries={['/test/sess-123']}>
        <AuthProvider repository={mockAuthRepo}>
          <TestingProvider
            sessionRepository={sessionRepo}
            questionRepository={questionRepo}
            now={() => 1700000000000}
          >
            <Routes>
              <Route path="/test/:sessionId" element={<TestPage />} />
            </Routes>
          </TestingProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for initial load
    expect(await screen.findByText('Что такое цикл for?')).toBeInTheDocument();
    expect(screen.getByText('Вопрос 1 из 2')).toBeInTheDocument();

    // 1. Choose answer for Question 1
    const optionRadio = screen.getByRole('radio', {
      name: /Инструкция повторения/,
    });
    fireEvent.click(optionRadio);
    expect(optionRadio).toBeChecked();

    // 2. Flag Question 1
    const flagButton = screen.getByRole('button', { name: /Отметить/ });
    fireEvent.click(flagButton);
    expect(
      screen.getByRole('button', { name: /Отмечено/ })
    ).toBeInTheDocument();

    // 3. Navigate to Question 2 via "Вперёд" button
    const nextButton = screen.getByRole('button', { name: 'Вперёд →' });
    fireEvent.click(nextButton);

    expect(
      await screen.findByText('Какой оператор выбирает строки в SQL?')
    ).toBeInTheDocument();
    expect(screen.getByText('Вопрос 2 из 2')).toBeInTheDocument();

    // 4. Click "Завершить" to open ConfirmDialog
    const finishButton = screen.getByRole('button', { name: 'Завершить' });
    fireEvent.click(finishButton);

    expect(screen.getByText('Завершить тестирование?')).toBeInTheDocument();
    expect(
      screen.getByText(/У вас осталось 1 неотвеченных вопросов из 2/)
    ).toBeInTheDocument();

    // 5. Confirm finish in dialog
    const confirmButton = screen.getByRole('button', { name: 'Да, завершить' });
    fireEvent.click(confirmButton);

    // 6. Verify completed screen is rendered
    expect(await screen.findByText('Вариант завершён')).toBeInTheDocument();
    expect(screen.getByText('Отвечено вопросов: 1 из 2.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'На главную' })).toHaveAttribute(
      'href',
      '/'
    );
  });
});
