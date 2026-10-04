import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from './ThemeProvider';
import { THEME_STORAGE_KEY } from './ThemeContext';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle & ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders dark theme by default and allows toggling to light theme', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByRole('button', {
      name: /Переключить на светлую тему/i,
    });
    expect(toggleBtn).toBeInTheDocument();
    expect(screen.getAllByText('Светлая').length).toBeGreaterThan(0);

    // Click toggle button -> switches to light
    fireEvent.click(toggleBtn);

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(screen.getAllByText('Тёмная').length).toBeGreaterThan(0);

    // Click again -> switches back to dark
    fireEvent.click(screen.getByRole('button', { name: /Переключить на тёмную тему/i }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('initializes from saved localStorage preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(screen.getByText('Тёмная')).toBeInTheDocument();
  });
});
