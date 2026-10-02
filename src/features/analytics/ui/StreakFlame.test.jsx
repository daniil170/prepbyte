import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StreakFlame } from './StreakFlame';

describe('StreakFlame component', () => {
  it('renders active flame when streak > 0', () => {
    render(<StreakFlame streak={3} />);

    const flame = screen.getByTestId('streak-flame');
    expect(flame).toBeInTheDocument();
    expect(flame).toHaveAttribute('data-active', 'true');
    expect(flame).toHaveAttribute('aria-label', 'Ударный режим: 3 дн.');

    // Spark elements exist
    const sparks = flame.querySelectorAll('[class*="spark"]');
    expect(sparks.length).toBeGreaterThan(0);
  });

  it('renders inactive flame when streak is 0', () => {
    render(<StreakFlame streak={0} />);

    const flame = screen.getByTestId('streak-flame');
    expect(flame).toBeInTheDocument();
    expect(flame).toHaveAttribute('data-active', 'false');
    expect(flame).toHaveAttribute(
      'aria-label',
      'Ударный режим: нет активной серии'
    );

    // No spark elements when inactive
    const sparks = flame.querySelectorAll('[class*="spark"]');
    expect(sparks.length).toBe(0);
  });

  it('applies custom size and className', () => {
    render(<StreakFlame streak={5} size={32} className="custom-flame" />);

    const flame = screen.getByTestId('streak-flame');
    expect(flame).toHaveClass('custom-flame');
    expect(flame).toHaveStyle({ '--flame-size': '32px' });
  });
});
