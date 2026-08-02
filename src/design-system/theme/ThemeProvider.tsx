import { createContext, use, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { create } from 'zustand';

import { darkTheme, lightTheme, type Theme } from './theme';

export type ThemePreference = 'system' | 'light' | 'dark';

/**
 * Theme preference is a textbook case for Zustand: small, global, client-owned,
 * and unrelated to the server. Contrast with logs and summaries, which are
 * server state and belong to TanStack Query.
 *
 * TODO(M2): persist this to the user's profile row so it follows them across
 * devices, including the watch.
 */
type ThemeStore = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

export const useThemePreference = create<ThemeStore>((set) => ({
  preference: 'system',
  setPreference: (preference) => set({ preference }),
}));

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const preference = useThemePreference((s) => s.preference);

  const theme = useMemo(() => {
    const resolved = preference === 'system' ? (systemScheme ?? 'dark') : preference;
    return resolved === 'light' ? lightTheme : darkTheme;
  }, [preference, systemScheme]);

  return <ThemeContext value={theme}>{children}</ThemeContext>;
}

/**
 * Pins a scheme for one subtree, ignoring the user's preference.
 *
 * The dashboard is designed as a single dark instrument panel — its glows,
 * translucent body fills and backdrop only read correctly on near-black. Rather
 * than invent a light variant of a design that has none, those screens opt out
 * here. Everything else in the app still follows the Appearance setting.
 */
export function FixedThemeProvider({
  scheme = 'dark',
  children,
}: {
  scheme?: 'light' | 'dark';
  children: ReactNode;
}) {
  const theme = scheme === 'light' ? lightTheme : darkTheme;
  return <ThemeContext value={theme}>{children}</ThemeContext>;
}

export function useTheme(): Theme {
  const theme = use(ThemeContext);
  if (!theme) throw new Error('useTheme must be used within a <ThemeProvider>.');
  return theme;
}
