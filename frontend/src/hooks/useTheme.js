import { useCallback, useEffect, useState } from 'react';
import {
  applyTheme,
  getStoredTheme,
  persistTheme,
} from '@/lib/theme';

export const useTheme = () => {
  const [theme, setThemeState] = useState(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme) => {
    const resolvedTheme = nextTheme === 'dark' ? 'dark' : 'light';
    persistTheme(resolvedTheme);
    setThemeState(resolvedTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
  };
};
