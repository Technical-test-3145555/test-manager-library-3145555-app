import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const KEY = 'ml-theme';

/** Storage can be unavailable (private window, blocked data): the theme then just does not persist. */
function readStored(): Theme | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function initial(): Theme {
  return readStored() ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(initial);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* not persisted */
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
