import { AuthProvider } from '@features/auth';

export function AppProviders({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
