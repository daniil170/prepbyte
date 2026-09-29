import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createSession, selectAnswer, toggleFlag } from '../domain/testSession';
import { QuestionNavigator } from './QuestionNavigator';

describe('QuestionNavigator', () => {
  it('renders 40 numbered buttons with correct accessibility attributes', () => {
    const questionIds = Array.from({ length: 40 }, (_, i) => `q-${i + 1}`);
    let session = createSession({
      id: 's1',
      userId: 'u1',
      questionIds,
      now: 1700000000000,
    });

    session = selectAnswer(session, 'q-5', 0);
    session = toggleFlag(session, 'q-5');

    const handleNavigate = vi.fn();
    render(
      <QuestionNavigator
        questionCount={40}
        session={session}
        onNavigate={handleNavigate}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(40);

    // Question 1: current, not answered
    expect(buttons[0]).toHaveAttribute('aria-current', 'step');
    expect(buttons[0]).toHaveAttribute(
      'aria-label',
      'Вопрос 1, не отвечен, текущий'
    );

    // Question 5 (index 4): answered, flagged
    expect(buttons[4]).toHaveAttribute(
      'aria-label',
      'Вопрос 5, отвечен, отмечен'
    );

    fireEvent.click(buttons[4]);
    expect(handleNavigate).toHaveBeenCalledWith(4);
  });
});
