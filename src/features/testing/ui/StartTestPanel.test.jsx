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

  function renderPanel({ sessionRepo, questionRepo, exposureRepo }) {
    return render(
      <MemoryRouter>
        <AuthProvider repository={mockAuthRepo}>
          <TestingProvider
            sessionRepository={sessionRepo}
            questionRepository={questionRepo}
            exposureRepository={exposureRepo}
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
      getQuestionCount: vi.fn().mockResolvedValue(119),
    };
    const exposureRepo = {
      getExposure: vi.fn().mockResolvedValue({}),
    };

    renderPanel({ sessionRepo, questionRepo, exposureRepo });

    expect(
      await screen.findByRole('button', { name: 'Начать пробный вариант' })
    ).toBeInTheDocument();
    expect(screen.getByText('40 вопросов, 60 минут')).toBeInTheDocument();
    expect(
      await screen.findByText('Вы видели 0 из 119 вопросов банка')
    ).toBeInTheDocument();
  });

  it('shows coverage stats and low unseen question notice when unseen < 40', async () => {
    const sessionRepo = {
      getActiveSession: vi.fn().mockResolvedValue(null),
      startSession: vi.fn(),
    };
    const questionRepo = {
      getAllQuestions: vi.fn().mockResolvedValue(mockQuestions),
      getQuestionCount: vi.fn().mockResolvedValue(119),
    };
    // 85 questions seen -> 119 - 85 = 34 unseen (< 40)
    const exposure = {};
    for (let i = 0; i < 85; i++) {
      exposure[`q-${i}`] = { timesSeen: 1 };
    }
    const exposureRepo = {
      getExposure: vi.fn().mockResolvedValue(exposure),
    };

    renderPanel({ sessionRepo, questionRepo, exposureRepo });

    expect(
      await screen.findByText('Вы видели 85 из 119 вопросов банка')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/В банке осталось 34 новых вопроса/)
    ).toBeInTheDocument();
  });

  it('does not show low unseen notice when unseen >= 40', async () => {
    const sessionRepo = {
      getActiveSession: vi.fn().mockResolvedValue(null),
      startSession: vi.fn(),
    };
    const questionRepo = {
      getAllQuestions: vi.fn().mockResolvedValue(mockQuestions),
      getQuestionCount: vi.fn().mockResolvedValue(119),
    };
    // 40 questions seen -> 119 - 40 = 79 unseen (>= 40)
    const exposure = {};
    for (let i = 0; i < 40; i++) {
      exposure[`q-${i}`] = { timesSeen: 1 };
    }
    const exposureRepo = {
      getExposure: vi.fn().mockResolvedValue(exposure),
    };

    renderPanel({ sessionRepo, questionRepo, exposureRepo });

    expect(
      await screen.findByText('Вы видели 40 из 119 вопросов банка')
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Остальные в следующем варианте будут повторами/)
    ).not.toBeInTheDocument();
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
