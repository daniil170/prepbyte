export const ALLOWED_EMAIL_DOMAIN = 'pifagorschool.kz';

/**
 * Normalizes an email address (trims whitespace and converts to lowercase).
 *
 * @param {string} email
 * @returns {string}
 */
export function normalizeSchoolEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Validates if an email belongs strictly to the allowed school domain (@pifagorschool.kz).
 *
 * Rejects substring spoofing like student@fakepifagorschool.kz or student@pifagorschool.kz.fake.com.
 *
 * @param {string} email
 * @returns {boolean}
 */
export function isSchoolEmailAllowed(email) {
  const normalized = normalizeSchoolEmail(email);
  if (!normalized) return false;
  // Strict regex: username + @pifagorschool.kz
  const schoolEmailRegex = /^[a-zA-Z0-9._%+-]+@pifagorschool\.kz$/;
  return schoolEmailRegex.test(normalized);
}

const GENERAL_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates credentials for login and registration forms.
 *
 * @param {object} params
 * @param {string} [params.email='']
 * @param {string} [params.password='']
 * @param {string} [params.confirmPassword]
 * @param {boolean} [params.isRegister=false]
 * @param {string} [params.firstName='']
 * @param {string} [params.lastName='']
 * @param {string} [params.className='']
 * @param {boolean} [params.agreePrivacyPolicy=false]
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateCredentials({
  email = '',
  password = '',
  confirmPassword = undefined,
  isRegister = false,
  firstName = '',
  lastName = '',
  className = '',
  agreePrivacyPolicy = false,
} = {}) {
  const errors = {};
  const normalizedEmail = normalizeSchoolEmail(email);

  if (isRegister) {
    const trimmedFirstName = String(firstName || '').trim();
    const trimmedLastName = String(lastName || '').trim();
    const trimmedClassName = String(className || '').trim();

    if (!trimmedFirstName) {
      errors.firstName = 'Введите имя.';
    } else if (trimmedFirstName.length < 2 || trimmedFirstName.length > 50) {
      errors.firstName = 'Имя должно содержать от 2 до 50 символов.';
    }

    if (!trimmedLastName) {
      errors.lastName = 'Введите фамилию.';
    } else if (trimmedLastName.length < 2 || trimmedLastName.length > 50) {
      errors.lastName = 'Фамилия должна содержать от 2 до 50 символов.';
    }

    if (!trimmedClassName) {
      errors.className = 'Укажите ваш класс (например: 10A, 11Б).';
    } else if (trimmedClassName.length > 20) {
      errors.className = 'Название класса слишком длинное.';
    }

    if (!normalizedEmail) {
      errors.email = 'Введите email.';
    } else if (!isSchoolEmailAllowed(normalizedEmail)) {
      errors.email = 'Регистрация разрешена только с почтой @pifagorschool.kz';
    }
  } else {
    if (!normalizedEmail) {
      errors.email = 'Введите email.';
    } else if (!GENERAL_EMAIL_REGEX.test(normalizedEmail)) {
      errors.email = 'Введите корректный email.';
    }
  }

  if (!password) {
    errors.password = 'Введите пароль.';
  } else if (password.length < 6) {
    errors.password = 'Пароль должен содержать минимум 6 символов.';
  }

  if (isRegister) {
    if (!confirmPassword) {
      errors.confirmPassword = 'Подтвердите пароль.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают.';
    }

    if (!agreePrivacyPolicy) {
      errors.agreePrivacyPolicy =
        'Необходимо согласие с Политикой конфиденциальности и файлами cookie.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
