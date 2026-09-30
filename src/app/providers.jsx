import { AuthProvider } from '@features/auth';
import { TestingProvider } from '@features/testing';
import { ThemeProvider } from '@shared/theme';

export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TestingProvider>{children}</TestingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
