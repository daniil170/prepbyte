import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthForm } from './AuthForm';

export default function RegisterPage() {
  const { register, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleEmailRegister({ email, password }) {
    setIsPending(true);
    setErrorMessage('');
    try {
      await register({ email, password });
      navigate('/', { replace: true });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsPending(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsPending(true);
    setErrorMessage('');
    try {
      await signInWithGoogle();
      navigate('/', { replace: true });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AuthForm
      mode="register"
      onSubmit={handleEmailRegister}
      onGoogleSignIn={handleGoogleSignIn}
      errorMessage={errorMessage}
      isPending={isPending}
    />
  );
}
