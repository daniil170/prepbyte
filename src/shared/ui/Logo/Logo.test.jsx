import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo, LOGO_CELLS } from './Logo';

describe('Logo component', () => {
  it('renders mark variant with correct role and aria-label', () => {
    render(<Logo variant="mark" />);
    const svg = screen.getByRole('img', { name: 'PrepByte' });
    expect(svg).toBeInTheDocument();
    expect(screen.queryByText('PrepByte')).not.toBeInTheDocument();
  });

  it('renders full variant with wordmark', () => {
    render(<Logo variant="full" />);
    expect(screen.getByRole('img', { name: 'PrepByte' })).toBeInTheDocument();
    expect(screen.getByText('PrepByte')).toBeInTheDocument();
  });

  it('renders all 12 cells in the SVG mark', () => {
    const { container } = render(<Logo variant="mark" />);
    const rects = container.querySelectorAll('svg rect');
    expect(rects).toHaveLength(12);
    expect(LOGO_CELLS).toHaveLength(12);
  });

  it('applies custom size attribute to SVG', () => {
    render(<Logo variant="mark" size={48} />);
    const svg = screen.getByRole('img', { name: 'PrepByte' });
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });
});
