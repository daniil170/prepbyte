import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@shared/ui/Logo/Logo';
import { validateCredentials } from '../domain/credentialsValidation';
import styles from './AuthForm.module.css';

export function AuthForm({
  mode = 'login',
  onSubmit,
  onGoogleSignIn,
  errorMessage = '',
  isPending = false,
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const isRegister = mode === 'register';

  function handleSubmit(event) {
    event.preventDefault();
    const validation = validateCredentials({
      email,
      password,
      confirmPassword,
      isRegister,
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    if (isRegister) {
      onSubmit({ email, password, confirmPassword });
    } else {
      onSubmit({ email, password });
    }
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    }
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
  }

  function handleConfirmPasswordChange(event) {
    setConfirmPassword(event.target.value);
    if (fieldErrors.confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.logoWrapper}>
          <Logo variant="full" size={28} />
        </div>

        <h1 className={styles.title}>
          {isRegister ? 'Регистрация' : 'Вход в PrepByte'}
        </h1>
        <p className={styles.subtitle}>
          {isRegister
            ? 'Создайте аккаунт для подготовки к ЕНТ'
            : 'Войдите, чтобы продолжить подготовку'}
        </p>

        {errorMessage ? (
          <div className={styles.generalError} role="alert">
            <span className={styles.errorIcon} aria-hidden="true">
              [!]
            </span>
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={handleEmailChange}
              disabled={isPending}
              className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
              placeholder="student@example.com"
            />
            {fieldErrors.email ? (
              <span className={styles.fieldError}>
                <span className={styles.errorIcon} aria-hidden="true">
                  [!]
                </span>
                <span>{fieldErrors.email}</span>
              </span>
            ) : null}
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Пароль
            </label>
            <input
              id="password"
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={password}
              onChange={handlePasswordChange}
              disabled={isPending}
              className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
              placeholder="••••••••"
            />
            {fieldErrors.password ? (
              <span className={styles.fieldError}>
                <span className={styles.errorIcon} aria-hidden="true">
                  [!]
                </span>
                <span>{fieldErrors.password}</span>
              </span>
            ) : null}
          </div>

          {isRegister ? (
            <div className={styles.field}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Подтверждение пароля
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                disabled={isPending}
                className={`${styles.input} ${fieldErrors.confirmPassword ? styles.inputError : ''}`}
                placeholder="••••••••"
              />
              {fieldErrors.confirmPassword ? (
                <span className={styles.fieldError}>
                  <span className={styles.errorIcon} aria-hidden="true">
                    [!]
                  </span>
                  <span>{fieldErrors.confirmPassword}</span>
                </span>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className={styles.submitButton}
          >
            {isPending
              ? 'Подождите...'
              : isRegister
                ? 'Зарегистрироваться'
                : 'Войти'}
          </button>
        </form>

        {onGoogleSignIn ? (
          <>
            <div className={styles.divider}>
              <span>или</span>
            </div>

            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={isPending}
              className={styles.googleButton}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                aria-hidden="true"
                className={styles.googleIcon}
              >
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.59.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.347 2.825.957 4.039l3.007-2.332z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
                />
              </svg>
              Продолжить через Google
            </button>
          </>
        ) : null}

        <div className={styles.footer}>
          {isRegister ? (
            <p>
              Уже есть аккаунт?{' '}
              <Link to="/login" className={styles.link}>
                Войти
              </Link>
            </p>
          ) : (
            <p>
              Нет аккаунта?{' '}
              <Link to="/register" className={styles.link}>
                Зарегистрироваться
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
