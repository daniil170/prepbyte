export const AUTH_ERROR_CODES = Object.freeze({
  INVALID_CREDENTIALS: 'invalid-credentials',
  EMAIL_IN_USE: 'email-in-use',
  WEAK_PASSWORD: 'weak-password',
  INVALID_EMAIL: 'invalid-email',
  NETWORK: 'network',
  POPUP_CLOSED: 'popup-closed',
  POPUP_BLOCKED: 'popup-blocked',
  TOO_MANY_REQUESTS: 'too-many-requests',
  UNKNOWN: 'unknown',
});

export const AUTH_ERROR_MESSAGES_RU = Object.freeze({
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: 'Неверный email или пароль.',
  [AUTH_ERROR_CODES.EMAIL_IN_USE]:
    'Пользователь с таким email уже зарегистрирован.',
  [AUTH_ERROR_CODES.WEAK_PASSWORD]:
    'Пароль слишком простой. Используйте не менее 6 символов.',
  [AUTH_ERROR_CODES.INVALID_EMAIL]:
    'Некорректный формат адреса электронной почты.',
  [AUTH_ERROR_CODES.NETWORK]:
    'Ошибка сети. Проверьте интернет-соединение и попробуйте снова.',
  [AUTH_ERROR_CODES.POPUP_CLOSED]:
    'Окно авторизации было закрыто до завершения входа.',
  [AUTH_ERROR_CODES.POPUP_BLOCKED]:
    'Всплывающее окно заблокировано браузером. Разрешите всплывающие окна для продолжения.',
  [AUTH_ERROR_CODES.TOO_MANY_REQUESTS]:
    'Слишком много попыток. Пожалуйста, подождите немного и повторите снова.',
  [AUTH_ERROR_CODES.UNKNOWN]:
    'Произошла непредвиденная ошибка. Пожалуйста, попробуйте позже.',
});

export class AuthError extends Error {
  constructor(code, customMessage) {
    const validCode = Object.values(AUTH_ERROR_CODES).includes(code)
      ? code
      : AUTH_ERROR_CODES.UNKNOWN;
    const message =
      customMessage ||
      AUTH_ERROR_MESSAGES_RU[validCode] ||
      AUTH_ERROR_MESSAGES_RU[AUTH_ERROR_CODES.UNKNOWN];

    super(message);
    this.name = 'AuthError';
    this.code = validCode;
  }
}
