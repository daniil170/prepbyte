import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrandIntro, BRAND_INTRO_SESSION_KEY } from './BrandIntro';

describe('BrandIntro', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders overlay when session flag is not set', () => {
    render(<BrandIntro />);
    const overlay = screen.getByTestId('brand-intro-overlay');
    expect(overlay).toBeInTheDocument();
  });

  it('does not render when the session flag is set', () => {
    sessionStorage.setItem(BRAND_INTRO_SESSION_KEY, 'true');
    render(<BrandIntro />);
    expect(screen.queryByTestId('brand-intro-overlay')).not.toBeInTheDocument();
  });

  it('skips and sets session flag on click', () => {
    render(<BrandIntro />);
    const overlay = screen.getByTestId('brand-intro-overlay');
    fireEvent.click(overlay);

    expect(screen.queryByTestId('brand-intro-overlay')).not.toBeInTheDocument();
    expect(sessionStorage.getItem(BRAND_INTRO_SESSION_KEY)).toBe('true');
  });

  it('skips and sets session flag on Escape key', () => {
    render(<BrandIntro />);
    expect(screen.getByTestId('brand-intro-overlay')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByTestId('brand-intro-overlay')).not.toBeInTheDocument();
    expect(sessionStorage.getItem(BRAND_INTRO_SESSION_KEY)).toBe('true');
  });

  it('respects prefers-reduced-motion and does not render overlay', () => {
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

    render(<BrandIntro />);
    expect(screen.queryByTestId('brand-intro-overlay')).not.toBeInTheDocument();
    expect(sessionStorage.getItem(BRAND_INTRO_SESSION_KEY)).toBe('true');
  });
});
