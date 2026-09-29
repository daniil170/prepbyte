import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthForm } from './AuthForm';

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('AuthForm', () => {
  it('renders login mode properly without confirmPassword field', () => {
    renderWithRouter(<AuthForm mode="login" onSubmit={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Вход в PrepByte'
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^пароль/i)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/подтверждение пароля/i)
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^войти$/i })
    ).toBeInTheDocument();
  });

  it('renders register mode with confirmPassword field', () => {
    renderWithRouter(<AuthForm mode="register" onSubmit={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Регистрация'
    );
    expect(screen.getByLabelText(/подтверждение пароля/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^зарегистрироваться$/i })
    ).toBeInTheDocument();
  });

  it('validates required fields and shows inline errors without submitting', () => {
    const onSubmit = vi.fn();
    renderWithRouter(<AuthForm mode="login" onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /^войти$/i }));

    expect(screen.getByText('Введите email.')).toBeInTheDocument();
    expect(screen.getByText('Введите пароль.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit when credentials are valid', () => {
    const onSubmit = vi.fn();
    renderWithRouter(<AuthForm mode="login" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'student@prepbyte.kz' },
    });
    fireEvent.change(screen.getByLabelText(/^пароль/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^войти$/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'student@prepbyte.kz',
      password: 'password123',
    });
  });

  it('calls onSubmit with confirmPassword when registering', () => {
    const onSubmit = vi.fn();
    renderWithRouter(<AuthForm mode="register" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'student@prepbyte.kz' },
    });
    fireEvent.change(screen.getByLabelText(/^пароль/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/подтверждение пароля/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /^зарегистрироваться$/i })
    );

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'student@prepbyte.kz',
      password: 'password123',
      confirmPassword: 'password123',
    });
  });

  it('displays general error message when provided', () => {
    renderWithRouter(
      <AuthForm
        mode="login"
        onSubmit={vi.fn()}
        errorMessage="Неверный email или пароль."
      />
    );

    expect(screen.getByText('Неверный email или пароль.')).toBeInTheDocument();
  });

  it('disables buttons when isPending is true', () => {
    const onGoogle = vi.fn();
    renderWithRouter(
      <AuthForm
        mode="login"
        onSubmit={vi.fn()}
        onGoogleSignIn={onGoogle}
        isPending={true}
      />
    );

    expect(screen.getByText('Подождите...')).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /продолжить через google/i })
    ).toBeDisabled();
  });

  it('triggers onGoogleSignIn when Google button is clicked', () => {
    const onGoogle = vi.fn();
    renderWithRouter(
      <AuthForm mode="login" onSubmit={vi.fn()} onGoogleSignIn={onGoogle} />
    );

    fireEvent.click(
      screen.getByRole('button', { name: /продолжить через google/i })
    );
    expect(onGoogle).toHaveBeenCalled();
  });
});
