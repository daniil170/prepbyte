import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { StudentExamResultPage } from './StudentExamResultPage';

describe('StudentExamResultPage Component', () => {
  const mockExam = {
    title: 'ЕНТ — Информатика',
  };

  const mockSession = {
    status: 'submitted',
    totalScore: 40,
    maxPossibleScore: 50,
    percentage: 80,
    score: {
      totalScore: 40,
      maxPossibleScore: 50,
      percentage: 80,
      byTopicBreakdown: {
        'Алгоритмы': { topic: 'Алгоритмы', score: 8, maxScore: 10, percentage: 80 },
        'Базы данных': { topic: 'Базы данных', score: 9, maxScore: 10, percentage: 90 },
      },
    },
  };

  it('renders server-authoritative total score and percentage', () => {
    render(
      <MemoryRouter>
        <StudentExamResultPage session={mockSession} exam={mockExam} />
      </MemoryRouter>
    );

    expect(screen.getByText('Экзамен завершён')).toBeInTheDocument();
    expect(screen.getByText('ЕНТ — Информатика')).toBeInTheDocument();
    expect(screen.getByText('40 / 50')).toBeInTheDocument();
    expect(screen.getByText('Набрано баллов (80%)')).toBeInTheDocument();
    expect(screen.getByText('✓ Порог ЕНТ пройден (50%+)')).toBeInTheDocument();
  });

  it('renders topic breakdown statistics', () => {
    render(
      <MemoryRouter>
        <StudentExamResultPage session={mockSession} exam={mockExam} />
      </MemoryRouter>
    );

    expect(screen.getByText('Результаты по темам')).toBeInTheDocument();
    expect(screen.getByText('Алгоритмы')).toBeInTheDocument();
    expect(screen.getByText('8 / 10 б. (80%)')).toBeInTheDocument();
    expect(screen.getByText('Базы данных')).toBeInTheDocument();
    expect(screen.getByText('9 / 10 б. (90%)')).toBeInTheDocument();
  });
});
