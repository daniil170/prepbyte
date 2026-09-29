const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials({
  email = '',
  password = '',
  confirmPassword = undefined,
  isRegister = false,
} = {}) {
  const errors = {};
  const trimmedEmail = String(email || '').trim();

  if (!trimmedEmail) {
    errors.email = 'Введите email.';
  } else if (!EMAIL_REGEX.test(trimmedEmail)) {
    errors.email = 'Введите корректный email.';
  }

  if (!password) {
    errors.password = 'Введите пароль.';
  } else if (password.length < 6) {
    errors.password = 'Пароль должен содержать минимум 6 символов.';
  }

  if (isRegister || confirmPassword !== undefined) {
    if (!confirmPassword) {
      errors.confirmPassword = 'Подтвердите пароль.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
