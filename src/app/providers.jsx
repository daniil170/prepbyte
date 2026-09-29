import { AuthProvider } from '@features/auth/hooks/AuthProvider';

export function AppProviders({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
