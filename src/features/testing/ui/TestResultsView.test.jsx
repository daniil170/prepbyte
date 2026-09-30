import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { TestResultsView } from './TestResultsView';

describe('TestResultsView', () => {
  const mockQuestions = [
    {
      id: 'q-1',
      topic: 'python_loops',
      questionText: 'Python loop question text',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswers: [0],
      explanation: 'First option is correct because of iteration rules.',
    },
    {
      id: 'q-2',
      topic: 'network_protocols',
      questionText: 'Network protocol multi-choice',
      options: ['TCP', 'UDP', 'HTTP', 'FTP'],
      correctAnswers: [0, 1],
      explanation: 'TCP and UDP are transport layer protocols.',
    },
  ];

  const mockSession = {
    id: 'test-sess-1',
    status: 'completed',
    answers: {
      'q-1': [0], // 1 pt (correct)
      'q-2': [0], // 1 pt out of 2 (partial credit)
    },
    score: {
      totalScore: 2,
      maxPossibleScore: 3,
      percentage: 67,
      passed: true,
      byTopicBreakdown: {
        python_loops: {
          topic: 'python_loops',
          score: 1,
          maxScore: 1,
          percentage: 100,
          totalQuestions: 1,
          correctCount: 1,
          partialCount: 0,
          incorrectCount: 0,
        },
        network_protocols: {
          topic: 'network_protocols',
          score: 1,
          maxScore: 2,
          percentage: 50,
          totalQuestions: 1,
          correctCount: 0,
          partialCount: 1,
          incorrectCount: 0,
        },
      },
    },
    questionSnapshots: [
      {
        id: 'q-1',
        topic: 'python_loops',
        questionText: 'Python loop question text',
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        userAnswers: [0],
        correctAnswers: [0],
        explanation: 'First option is correct because of iteration rules.',
        isMultipleChoice: false,
        pointsAwarded: 1,
        maxPoints: 1,
        isCorrect: true,
        isPartiallyCorrect: false,
      },
      {
        id: 'q-2',
        topic: 'network_protocols',
        questionText: 'Network protocol multi-choice',
        options: ['TCP', 'UDP', 'HTTP', 'FTP'],
        userAnswers: [0],
        correctAnswers: [0, 1],
        explanation: 'TCP and UDP are transport layer protocols.',
        isMultipleChoice: true,
        pointsAwarded: 1,
        maxPoints: 2,
        isCorrect: false,
        isPartiallyCorrect: true,
      },
    ],
  };

  it('renders score summary card, percentages, and pass status', () => {
    render(
      <MemoryRouter>
        <TestResultsView session={mockSession} questions={mockQuestions} />
      </MemoryRouter>
    );

    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('/ 3')).toBeInTheDocument();
    expect(screen.getByText('(67%)')).toBeInTheDocument();
    expect(screen.getByText('Тест сдан')).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Итоги тестирования' })
    ).toBeInTheDocument();
  });

  it('renders topic breakdown accurately', () => {
    render(
      <MemoryRouter>
        <TestResultsView session={mockSession} questions={mockQuestions} />
      </MemoryRouter>
    );

    expect(screen.getByText('Результаты по темам')).toBeInTheDocument();
    expect(screen.getByText('1 / 1 б.')).toBeInTheDocument();
    expect(screen.getByText('1 / 2 б.')).toBeInTheDocument();
  });

  it('allows filtering by filter tabs and expanding review cards', () => {
    render(
      <MemoryRouter>
        <TestResultsView session={mockSession} questions={mockQuestions} />
      </MemoryRouter>
    );

    expect(screen.getByText('Все (2)')).toBeInTheDocument();
    expect(screen.getByText('Частично (1)')).toBeInTheDocument();
    expect(screen.getByText('Верно (1)')).toBeInTheDocument();

    // Click filter for 'Частично'
    fireEvent.click(screen.getByText('Частично (1)'));

    // Question button is present
    const questionCardBtn = screen.getByRole('button', {
      name: /Сетевые протоколы/,
    });
    expect(questionCardBtn).toBeInTheDocument();

    // Expand the card
    fireEvent.click(questionCardBtn);

    expect(
      screen.getByText('Network protocol multi-choice')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Python loop question text')
    ).not.toBeInTheDocument();

    // Check explanation presence in expanded card
    expect(
      screen.getByText('TCP and UDP are transport layer protocols.')
    ).toBeInTheDocument();
  });

  it('dynamically computes score if session score is not pre-attached', () => {
    const sessionWithoutPreScore = {
      id: 'legacy-sess',
      status: 'completed',
      answers: {
        'q-1': [0],
        'q-2': [0, 1], // full points
      },
    };

    render(
      <MemoryRouter>
        <TestResultsView
          session={sessionWithoutPreScore}
          questions={mockQuestions}
        />
      </MemoryRouter>
    );

    // q1 = 1pt, q2 = 2pt -> 3/3 (100%)
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('/ 3')).toBeInTheDocument();
    expect(screen.getByText('(100%)')).toBeInTheDocument();
  });
});
