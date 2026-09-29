import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@features/auth';
import { createSession, selectAnswer } from '../domain/testSession';
import { TestingProvider } from '../hooks/TestingProvider';
import { StartTestPanel } from './StartTestPanel';

describe('StartTestPanel', () => {
  const mockUser = { uid: 'u1', email: 'student@prepbyte.kz' };
  const mockAuthRepo = {
    subscribeToAuthState: (cb) => {
      cb(mockUser);
      return () => {};
    },
  };

  const mockQuestions = Array.from({ length: 45 }, (_, i) => ({
    id: `q-${i}`,
    topic: `topic_${i % 5}`,
  }));

  function renderPanel({ sessionRepo, questionRepo }) {
    return render(
      <MemoryRouter>
        <AuthProvider repository={mockAuthRepo}>
          <TestingProvider
            sessionRepository={sessionRepo}
            questionRepository={questionRepo}
            now={() => 1700000000000}
          >
            <StartTestPanel />
          </TestingProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  }

  it('renders start button and test metadata when there is no active session', async () => {
    const sessionRepo = {
      getActiveSession: vi.fn().mockResolvedValue(null),
      startSession: vi.fn(),
    };
    const questionRepo = {
      getAllQuestions: vi.fn().mockResolvedValue(mockQuestions),
    };

    renderPanel({ sessionRepo, questionRepo });

    expect(
      await screen.findByRole('button', { name: 'Начать пробный вариант' })
    ).toBeInTheDocument();
    expect(screen.getByText('40 вопросов, 60 минут')).toBeInTheDocument();
  });

  it('renders resume and new test buttons when an active session exists', async () => {
    let active = createSession({
      id: 'active-1',
      userId: 'u1',
      questionIds: Array.from({ length: 40 }, (_, i) => `q-${i}`),
      durationLimitSec: 3600,
      now: 1700000000000,
    });
    active = selectAnswer(active, 'q-0', 0);
    active = selectAnswer(active, 'q-1', 1);

    const sessionRepo = {
      getActiveSession: vi.fn().mockResolvedValue(active),
      startSession: vi.fn(),
    };
    const questionRepo = {
      getAllQuestions: vi.fn().mockResolvedValue(mockQuestions),
    };

    renderPanel({ sessionRepo, questionRepo });

    expect(
      await screen.findByRole('button', { name: 'Продолжить вариант' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Начать новый вариант' })
    ).toBeInTheDocument();

    expect(screen.getByText('2 из 40')).toBeInTheDocument();
    expect(screen.getByText('60:00')).toBeInTheDocument();
  });

  it('opens ConfirmDialog when "Начать новый вариант" is clicked with active session', async () => {
    const active = createSession({
      id: 'active-1',
      userId: 'u1',
      questionIds: Array.from({ length: 40 }, (_, i) => `q-${i}`),
      now: 1700000000000,
    });

    const sessionRepo = {
      getActiveSession: vi.fn().mockResolvedValue(active),
      startSession: vi.fn().mockResolvedValue(active),
    };
    const questionRepo = {
      getAllQuestions: vi.fn().mockResolvedValue(mockQuestions),
    };

    renderPanel({ sessionRepo, questionRepo });

    const newVariantBtn = await screen.findByRole('button', {
      name: 'Начать новый вариант',
    });
    fireEvent.click(newVariantBtn);

    expect(screen.getByText('Начать новый вариант?')).toBeInTheDocument();
    expect(
      screen.getByText(/Текущий незавершённый вариант будет отменён/)
    ).toBeInTheDocument();
  });
});
