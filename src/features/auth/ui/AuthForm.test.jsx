import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthForm } from './AuthForm';

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('AuthForm', () => {
  it('renders login mode properly without registration fields', () => {
    renderWithRouter(<AuthForm mode="login" onSubmit={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Вход в PrepByte'
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^пароль/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/имя/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/фамилия/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/класс/i)).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/подтверждение пароля/i)
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^войти$/i })
    ).toBeInTheDocument();
  });

  it('renders register mode with name, class, and school email fields', () => {
    renderWithRouter(<AuthForm mode="register" onSubmit={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Регистрация ученика'
    );
    expect(screen.getByLabelText(/^имя$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^фамилия$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^класс$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/подтверждение пароля/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^зарегистрироваться$/i })
    ).toBeInTheDocument();
  });

  it('validates required fields on login and shows inline errors', () => {
    const onSubmit = vi.fn();
    renderWithRouter(<AuthForm mode="login" onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /^войти$/i }));

    expect(screen.getByText('Введите email.')).toBeInTheDocument();
    expect(screen.getByText('Введите пароль.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit when login credentials are valid', () => {
    const onSubmit = vi.fn();
    renderWithRouter(<AuthForm mode="login" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'student@pifagorschool.kz' },
    });
    fireEvent.change(screen.getByLabelText(/^пароль/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^войти$/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'student@pifagorschool.kz',
      password: 'password123',
    });
  });

  it('calls onSubmit with full profile data when registering with @pifagorschool.kz', () => {
    const onSubmit = vi.fn();
    renderWithRouter(<AuthForm mode="register" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/^имя$/i), {
      target: { value: 'Данияр' },
    });
    fireEvent.change(screen.getByLabelText(/^фамилия$/i), {
      target: { value: 'Ахметов' },
    });
    fireEvent.change(screen.getByLabelText(/^класс$/i), {
      target: { value: '10А' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'daniyar@pifagorschool.kz' },
    });
    fireEvent.change(screen.getByLabelText(/^пароль/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/подтверждение пароля/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(
      screen.getByRole('button', { name: /^зарегистрироваться$/i })
    );

    expect(onSubmit).toHaveBeenCalledWith({
      firstName: 'Данияр',
      lastName: 'Ахметов',
      className: '10А',
      email: 'daniyar@pifagorschool.kz',
      password: 'password123',
      confirmPassword: 'password123',
      agreePrivacyPolicy: true,
    });
  });

  it('rejects registration without agreeing to privacy policy', () => {
    const onSubmit = vi.fn();
    renderWithRouter(<AuthForm mode="register" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/^имя$/i), {
      target: { value: 'Данияр' },
    });
    fireEvent.change(screen.getByLabelText(/^фамилия$/i), {
      target: { value: 'Ахметов' },
    });
    fireEvent.change(screen.getByLabelText(/^класс$/i), {
      target: { value: '10А' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'daniyar@pifagorschool.kz' },
    });
    fireEvent.change(screen.getByLabelText(/^пароль/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/подтверждение пароля/i), {
      target: { value: 'password123' },
    });
    // Deliberately do not check the checkbox
    fireEvent.click(
      screen.getByRole('button', { name: /^зарегистрироваться$/i })
    );

    expect(
      screen.getByText('Необходимо согласие с Политикой конфиденциальности и файлами cookie.')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects registration with non-school email domain', () => {
    const onSubmit = vi.fn();
    renderWithRouter(<AuthForm mode="register" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/^имя$/i), {
      target: { value: 'Данияр' },
    });
    fireEvent.change(screen.getByLabelText(/^фамилия$/i), {
      target: { value: 'Ахметов' },
    });
    fireEvent.change(screen.getByLabelText(/^класс$/i), {
      target: { value: '10А' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'daniyar@gmail.com' },
    });
    fireEvent.change(screen.getByLabelText(/^пароль/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/подтверждение пароля/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(
      screen.getByRole('button', { name: /^зарегистрироваться$/i })
    );

    expect(
      screen.getByText('Регистрация разрешена только с почтой @pifagorschool.kz')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
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
