import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** The class strategy is what index.html's pre-paint script also toggles. */
function applyTheme(theme: Theme): void {
  const dark = theme === 'dark' || (theme === 'system' && prefersDark());
  document.documentElement.classList.toggle('dark', dark);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme(theme) {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      // Must match the key read by the inline script in index.html.
      name: 'bade-bhaiya-theme',
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.theme ?? 'system');
      },
    },
  ),
);

// Follow the OS while the user is on "system", including live changes.
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (useThemeStore.getState().theme === 'system') applyTheme('system');
  });
}
