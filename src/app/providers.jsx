import { AuthProvider } from '@features/auth';
import { TestingProvider } from '@features/testing';

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <TestingProvider>{children}</TestingProvider>
    </AuthProvider>
  );
}
