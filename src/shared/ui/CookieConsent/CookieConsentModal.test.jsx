import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { CookieConsentModal, COOKIE_CONSENT_KEY } from './CookieConsentModal';

describe('CookieConsentModal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('prompts the user on first visit when consent is not yet accepted', () => {
    render(<CookieConsentModal />);

    expect(
      screen.getByText('Согласие на использование файлов cookie')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Принять и продолжить' })
    ).toBeInTheDocument();
  });

  it('does not display banner if consent has already been accepted', () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');

    render(<CookieConsentModal />);

    const dialog = screen.queryByRole('dialog');
    expect(dialog).not.toBeInTheDocument();
  });

  it('saves consent to localStorage when user clicks accept button', () => {
    render(<CookieConsentModal />);

    const acceptBtn = screen.getByRole('button', {
      name: 'Принять и продолжить',
    });
    fireEvent.click(acceptBtn);

    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe('true');
  });

  it('opens policy modal when clicking policy links', () => {
    render(<CookieConsentModal />);

    const privacyBtn = screen.getByRole('button', {
      name: 'Политики конфиденциальности',
    });
    fireEvent.click(privacyBtn);

    expect(
      screen.getByRole('heading', { name: 'Политика конфиденциальности' })
    ).toBeInTheDocument();
  });
});
