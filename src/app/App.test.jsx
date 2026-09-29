import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders PrepByte heading on home page', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /prepbyte/i })
    ).toBeInTheDocument();
  });
});
