const THEME_STORAGE_KEY = 'eduhub-theme';

export const getStoredTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
};

export const applyTheme = (theme) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.toggle('dark', theme === 'dark');
};

export const initTheme = () => {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
};

export const persistTheme = (theme) => {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
};
