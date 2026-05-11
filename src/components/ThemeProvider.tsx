import React, { createContext, useContext, ReactNode, useMemo, useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useThemeStore } from '../store/useThemeStore';

interface Theme {
  mode: 'light' | 'dark';
  primary: string;
  secondary: string;
  bgSoft: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  toggleMode: () => void;
}

const LIGHT_THEME = {
  bgSoft: '#f8fafc',
  card: '#ffffff',
  textPrimary: '#111827',
  textSecondary: '#64748b'
};

const DARK_THEME = {
  bgSoft: '#0f172a',
  card: '#1e293b',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8'
};

const ThemeContext = createContext<Theme>({
  mode: 'light',
  primary: '#10b981',
  secondary: '#059669',
  bgSoft: LIGHT_THEME.bgSoft,
  card: LIGHT_THEME.card,
  textPrimary: LIGHT_THEME.textPrimary,
  textSecondary: LIGHT_THEME.textSecondary,
  toggleMode: () => {}
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const settings = useSettingsStore(state => state.settings);
  const { mode, toggleTheme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(mode);
  }, [mode]);

  const theme = useMemo(() => {
    // Helper to validate hex colors
    const isValidHex = (hex: string) => /^#([0-9A-F]{3}){1,2}$/i.test(hex);

    const primary = settings && isValidHex(settings.primary_color) ? settings.primary_color : '#10b981';
    const secondary = settings && isValidHex(settings.secondary_color) ? settings.secondary_color : '#059669';
    
    const colors = mode === 'light' ? LIGHT_THEME : DARK_THEME;

    // Update CSS variables for Tailwind
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      root.style.setProperty('--primary', primary);
      root.style.setProperty('--secondary', secondary);
      root.style.setProperty('--bg-soft', colors.bgSoft);
      root.style.setProperty('--card-bg', colors.card);
      root.style.setProperty('--text-primary', colors.textPrimary);
      root.style.setProperty('--text-secondary', colors.textSecondary);
    }

    return {
      mode,
      primary,
      secondary,
      ...colors,
      toggleMode: toggleTheme
    };
  }, [settings, mode, toggleTheme]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
