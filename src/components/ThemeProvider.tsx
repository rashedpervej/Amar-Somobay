import React, { createContext, useContext, ReactNode, useMemo, useEffect, useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useThemeStore, ThemeMode } from '../store/useThemeStore';

interface Theme {
  mode: 'light' | 'dark';
  themeMode: ThemeMode;
  primary: string;
  secondary: string;
  bgSoft: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  toggleMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;
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
  themeMode: 'system',
  primary: '#10b981',
  secondary: '#059669',
  bgSoft: LIGHT_THEME.bgSoft,
  card: LIGHT_THEME.card,
  textPrimary: LIGHT_THEME.textPrimary,
  textSecondary: LIGHT_THEME.textSecondary,
  toggleMode: () => {},
  setThemeMode: () => {}
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const settings = useSettingsStore(state => state.settings);
  const { themeMode, setThemeMode } = useThemeStore();
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const getSystemTheme = () => 
      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    // Set initial mode
    setResolvedMode(themeMode === 'system' ? getSystemTheme() : themeMode);

    // Setup listener for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (themeMode === 'system') {
        setResolvedMode(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, [themeMode]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedMode);
    root.style.colorScheme = resolvedMode;
  }, [resolvedMode]);

  const theme = useMemo(() => {
    // Helper to validate hex colors
    const isValidHex = (hex: string) => /^#([0-9A-F]{3}){1,2}$/i.test(hex);

    const primary = settings && isValidHex(settings.primary_color) ? settings.primary_color : '#10b981';
    const secondary = settings && isValidHex(settings.secondary_color) ? settings.secondary_color : '#059669';
    
    const colors = resolvedMode === 'light' ? LIGHT_THEME : DARK_THEME;

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
      mode: resolvedMode,
      themeMode,
      primary,
      secondary,
      ...colors,
      toggleMode: () => {
        const nextMode = themeMode === 'system' ? 'light' : themeMode === 'light' ? 'dark' : 'system';
        setThemeMode(nextMode);
      },
      setThemeMode
    };
  }, [settings, resolvedMode, themeMode, setThemeMode]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
