import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SaveIndicator } from './SaveIndicator';

describe('SaveIndicator', () => {
  it('renders saved state', () => {
    render(<SaveIndicator saveState="saved" />);
    expect(screen.getByText('Сохранено')).toBeInTheDocument();
  });

  it('renders saving state', () => {
    render(<SaveIndicator saveState="saving" />);
    expect(screen.getByText('Сохранение...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<SaveIndicator saveState="error" />);
    expect(screen.getByText('Ошибка сохранения')).toBeInTheDocument();
  });
});
