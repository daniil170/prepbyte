import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthForm } from './AuthForm';

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const targetPath = location.state?.from?.pathname || '/';

  async function handleEmailSignIn({ email, password }) {
    setIsPending(true);
    setErrorMessage('');
    try {
      await signIn({ email, password });
      navigate(targetPath, { replace: true });
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
      navigate(targetPath, { replace: true });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AuthForm
      mode="login"
      onSubmit={handleEmailSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      errorMessage={errorMessage}
      isPending={isPending}
    />
  );
}
