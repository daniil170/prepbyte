import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TestTimer } from './TestTimer';

describe('TestTimer', () => {
  it('formats hours, minutes, and seconds properly', () => {
    // 3600 seconds = 1:00:00
    render(<TestTimer remainingSeconds={3600} />);
    expect(screen.getByRole('timer')).toHaveTextContent('1:00:00');
  });

  it('formats minutes and seconds for less than an hour', () => {
    // 599 seconds = 09:59
    render(<TestTimer remainingSeconds={599} />);
    expect(screen.getByRole('timer')).toHaveTextContent('09:59');
  });

  it('renders a non-color warning indicator when remaining time is <= 5 minutes (300s)', () => {
    const { rerender } = render(<TestTimer remainingSeconds={301} />);
    expect(screen.queryByText('[!]')).not.toBeInTheDocument();

    rerender(<TestTimer remainingSeconds={300} />);
    expect(screen.getByText('[!]')).toBeInTheDocument();
  });
});
