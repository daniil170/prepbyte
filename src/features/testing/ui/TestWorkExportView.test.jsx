import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TestWorkExportView } from './TestWorkExportView';

describe('TestWorkExportView', () => {
  const mockSession = {
    id: 'session-unt-101',
    userId: 'student@example.com',
    completedAt: '2026-09-30T12:00:00Z',
    status: 'completed',
  };

  const mockScoreData = {
    totalScore: 42,
    maxPossibleScore: 50,
    percentage: 84,
    passed: true,
    detailedResults: [
      {
        id: 'q-1',
        topic: 'html_css',
        questionText: 'Какой тег используется для верхнего индекса в HTML?',
        options: ['<sup>', '<sub>', '<small>', '<pre>'],
        userAnswers: [0],
        correctAnswers: [0],
        isMultipleChoice: false,
        pointsAwarded: 1,
        maxPoints: 1,
        isCorrect: true,
        isPartiallyCorrect: false,
        explanation: 'Тег <sup> (superscript) используется для верхнего индекса.',
      },
      {
        id: 'q-31',
        topic: 'python_loops',
        questionText: 'Выберите все встроенные функции Python:',
        options: ['len', 'print', 'scan', 'write'],
        userAnswers: [0, 1],
        correctAnswers: [0, 1],
        isMultipleChoice: true,
        pointsAwarded: 2,
        maxPoints: 2,
        isCorrect: true,
        isPartiallyCorrect: false,
        explanation: 'len и print являются встроенными.',
      },
    ],
  };

  it('renders official UNT protocol title and student credentials', () => {
    render(
      <TestWorkExportView
        session={mockSession}
        scoreData={mockScoreData}
        onClose={vi.fn()}
      />
    );

    expect(
      screen.getByText('ПРОТОКОЛ РЕЗУЛЬТАТОВ ПРОБНОГО ТЕСТИРОВАНИЯ')
    ).toBeInTheDocument();
    expect(screen.getByText('student@example.com')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText(/Пороговый балл сдан/i)).toBeInTheDocument();
  });

  it('renders question items with answer tags and points awarded', () => {
    render(
      <TestWorkExportView
        session={mockSession}
        scoreData={mockScoreData}
        onClose={vi.fn()}
      />
    );

    expect(
      screen.getByText('Какой тег используется для верхнего индекса в HTML?')
    ).toBeInTheDocument();
    expect(screen.getAllByText(/✓ Ваш верный ответ/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText('Тег <sup> (superscript) используется для верхнего индекса.')
    ).toBeInTheDocument();
  });

  it('handles closing the export sheet modal', () => {
    const handleClose = vi.fn();
    render(
      <TestWorkExportView
        session={mockSession}
        scoreData={mockScoreData}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /Закрыть бланк/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('triggers window.print when Print button is clicked', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(
      <TestWorkExportView
        session={mockSession}
        scoreData={mockScoreData}
        onClose={vi.fn()}
      />
    );

    const printBtn = screen.getByRole('button', { name: /Печать \/ В PDF/i });
    fireEvent.click(printBtn);
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });
});
