import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AnalyticsDashboard } from './AnalyticsDashboard';

describe('AnalyticsDashboard', () => {
  it('renders loading state properly', () => {
    const mockHook = () => ({
      isLoading: true,
      error: null,
      analytics: {},
      refetch: () => {},
    });

    render(
      <MemoryRouter>
        <AnalyticsDashboard hook={mockHook} />
      </MemoryRouter>
    );

    expect(screen.getByText('Загрузка аналитики...')).toBeInTheDocument();
  });

  it('renders error state with retry button', () => {
    const mockHook = () => ({
      isLoading: false,
      error: 'Ошибка сети при загрузке аналитики',
      analytics: {},
      refetch: () => {},
    });

    render(
      <MemoryRouter>
        <AnalyticsDashboard hook={mockHook} />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Ошибка сети при загрузке аналитики')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Повторить попытку' })
    ).toBeInTheDocument();
  });

  it('renders empty state when user has no attempts yet', () => {
    const mockHook = () => ({
      isLoading: false,
      error: null,
      analytics: {
        hasAttempts: false,
        kpis: { totalTests: 0 },
        topicMastery: { allTopics: [] },
        scoreTimeline: [],
        recentAttempts: [],
      },
      refetch: () => {},
    });

    render(
      <MemoryRouter>
        <AnalyticsDashboard hook={mockHook} />
      </MemoryRouter>
    );

    expect(screen.getByText('Пока нет пройденных тестов')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Начать первый тест/i })
    ).toBeInTheDocument();
  });

  it('renders dashboard with KPIs, topics, and recent attempts', () => {
    const mockHook = () => ({
      isLoading: false,
      error: null,
      analytics: {
        hasAttempts: true,
        kpis: {
          totalTests: 3,
          completedTests: 2,
          averageScore: 42.5,
          topScore: 45,
          completionRate: 67,
          studyStreak: 2,
        },
        topicMastery: {
          allTopics: [
            {
              id: 'python_loops',
              label: 'Циклы и условия в Python',
              score: 8,
              maxScore: 8,
              percentage: 100,
              questionsAttempted: 8,
              isStrong: true,
            },
            {
              id: 'sql_queries',
              label: 'Основные SQL-запросы',
              score: 2,
              maxScore: 4,
              percentage: 50,
              questionsAttempted: 4,
              isStrong: false,
            },
          ],
          strongTopics: [
            {
              id: 'python_loops',
              label: 'Циклы и условия в Python',
              score: 8,
              maxScore: 8,
              percentage: 100,
              questionsAttempted: 8,
              isStrong: true,
            },
          ],
          growthTopics: [
            {
              id: 'sql_queries',
              label: 'Основные SQL-запросы',
              score: 2,
              maxScore: 4,
              percentage: 50,
              questionsAttempted: 4,
              isStrong: false,
            },
          ],
        },
        scoreTimeline: [
          {
            id: 'sess-1',
            formattedDate: '29.09',
            score: 40,
            maxScore: 50,
            percentage: 80,
          },
          {
            id: 'sess-2',
            formattedDate: '30.09',
            score: 45,
            maxScore: 50,
            percentage: 90,
          },
        ],
        recentAttempts: [
          {
            id: 'sess-2',
            status: 'completed',
            startedAt: 1700000000000,
            finishedAt: 1700002500000,
            score: { totalScore: 45, maxPossibleScore: 50 },
          },
        ],
      },
      refetch: () => {},
    });

    render(
      <MemoryRouter>
        <AnalyticsDashboard hook={mockHook} />
      </MemoryRouter>
    );

    // KPIs
    expect(screen.getByText('42.5')).toBeInTheDocument();
    expect(screen.getAllByText('45').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('67%')).toBeInTheDocument();
    expect(screen.getByTestId('streak-flame')).toBeInTheDocument();
    expect(screen.getByTestId('streak-flame')).toHaveAttribute(
      'data-active',
      'true'
    );

    // Topics filter
    expect(screen.getByText('Циклы и условия в Python')).toBeInTheDocument();
    expect(screen.getByText('Основные SQL-запросы')).toBeInTheDocument();

    // Filter by strong
    fireEvent.click(screen.getByRole('button', { name: /Сильные темы/i }));
    expect(screen.getByText('Циклы и условия в Python')).toBeInTheDocument();
    expect(screen.queryByText('Основные SQL-запросы')).not.toBeInTheDocument();

    // Recent attempts
    expect(screen.getByText('Завершён')).toBeInTheDocument();
  });
});
