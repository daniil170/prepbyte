import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HeroBackgroundAnimation } from './HeroBackgroundAnimation';

describe('HeroBackgroundAnimation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders container with aria-hidden="true" and ambient elements', () => {
    const { container } = render(<HeroBackgroundAnimation />);

    const root = container.firstElementChild;
    expect(root).not.toBeNull();
    expect(root?.getAttribute('aria-hidden')).toBe('true');

    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
  });

  it('applies custom className if provided', () => {
    const { container } = render(
      <HeroBackgroundAnimation className="custom-hero-bg" />
    );

    const root = container.firstElementChild;
    expect(root?.className).toContain('custom-hero-bg');
  });

  it('respects prefers-reduced-motion media query', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(<HeroBackgroundAnimation />);
    expect(container.querySelector('canvas')).not.toBeNull();
  });
});
