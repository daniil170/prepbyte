import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

const DEFAULT_THEME_FALLBACK = Object.freeze({
  theme: 'dark',
  isDark: true,
  isLight: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function useTheme() {
  const context = useContext(ThemeContext);
  return context || DEFAULT_THEME_FALLBACK;
}
