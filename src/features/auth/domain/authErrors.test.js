import { describe, expect, it } from 'vitest';
import {
  AUTH_ERROR_CODES,
  AUTH_ERROR_MESSAGES_RU,
  AuthError,
} from './authErrors';

describe('authErrors domain', () => {
  it('instantiates AuthError with default Russian message for known error code', () => {
    const error = new AuthError(AUTH_ERROR_CODES.INVALID_CREDENTIALS);

    expect(error.name).toBe('AuthError');
    expect(error.code).toBe('invalid-credentials');
    expect(error.message).toBe('Неверный email или пароль.');
    expect(error instanceof Error).toBe(true);
  });

  it('instantiates AuthError for too-many-requests and popup-blocked', () => {
    const tooMany = new AuthError(AUTH_ERROR_CODES.TOO_MANY_REQUESTS);
    expect(tooMany.code).toBe('too-many-requests');
    expect(tooMany.message).toBe(
      'Слишком много попыток. Пожалуйста, подождите немного и повторите снова.'
    );

    const popupBlocked = new AuthError(AUTH_ERROR_CODES.POPUP_BLOCKED);
    expect(popupBlocked.code).toBe('popup-blocked');
    expect(popupBlocked.message).toBe(
      'Всплывающее окно заблокировано браузером. Разрешите всплывающие окна для продолжения.'
    );
  });

  it('supports custom messages', () => {
    const error = new AuthError(
      AUTH_ERROR_CODES.NETWORK,
      'Кастомное сообщение сети'
    );

    expect(error.message).toBe('Кастомное сообщение сети');
    expect(error.code).toBe('network');
  });

  it('falls back to unknown error for unrecognized error codes', () => {
    const error = new AuthError('unrecognized-code');

    expect(error.code).toBe(AUTH_ERROR_CODES.UNKNOWN);
    expect(error.message).toBe(
      AUTH_ERROR_MESSAGES_RU[AUTH_ERROR_CODES.UNKNOWN]
    );
  });

  it('contains Russian messages for all defined error codes', () => {
    Object.values(AUTH_ERROR_CODES).forEach((code) => {
      expect(typeof AUTH_ERROR_MESSAGES_RU[code]).toBe('string');
      expect(AUTH_ERROR_MESSAGES_RU[code].length).toBeGreaterThan(0);
    });
  });
});
