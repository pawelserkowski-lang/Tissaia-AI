import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeName = 'dark' | 'light' | 'cyberpunk' | 'classic' | 'high-contrast';

export interface Theme {
  name: ThemeName;
  displayName: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    muted: string;
  };
}

export const themes: Record<ThemeName, Theme> = {
  dark: {
    name: 'dark',
    displayName: 'Dark (Default)',
    colors: {
      background: '#050a0a',
      foreground: '#e5e7eb',
      primary: '#00ffa3',
      secondary: '#1f2937',
      accent: '#00ffa3',
      border: 'rgba(0, 255, 163, 0.2)',
      muted: '#6b7280',
    },
  },
  light: {
    name: 'light',
    displayName: 'Light',
    colors: {
      background: '#ffffff',
      foreground: '#1f2937',
      primary: '#00b371',
      secondary: '#f3f4f6',
      accent: '#00b371',
      border: 'rgba(0, 179, 113, 0.2)',
      muted: '#9ca3af',
    },
  },
  cyberpunk: {
    name: 'cyberpunk',
    displayName: 'Cyberpunk Neon',
    colors: {
      background: '#0a0e27',
      foreground: '#f0f6ff',
      primary: '#ff00ff',
      secondary: '#1a1e3e',
      accent: '#00ffff',
      border: 'rgba(255, 0, 255, 0.3)',
      muted: '#8892b0',
    },
  },
  classic: {
    name: 'classic',
    displayName: 'Classic',
    colors: {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      primary: '#569cd6',
      secondary: '#252526',
      accent: '#4ec9b0',
      border: 'rgba(86, 156, 214, 0.2)',
      muted: '#858585',
    },
  },
  'high-contrast': {
    name: 'high-contrast',
    displayName: 'High Contrast',
    colors: {
      background: '#000000',
      foreground: '#ffffff',
      primary: '#ffff00',
      secondary: '#1a1a1a',
      accent: '#00ff00',
      border: '#ffffff',
      muted: '#cccccc',
    },
  },
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (themeName: ThemeName) => void;
  themeName: ThemeName;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    // Load theme from localStorage or default to 'dark'
    const saved = localStorage.getItem('tissaia-theme');
    return (saved as ThemeName) || 'dark';
  });

  const theme = themes[themeName];

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('tissaia-theme', themeName);

    // Apply theme CSS variables to root
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Update meta theme-color for mobile browsers
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme.colors.background);
    }
  }, [theme, themeName]);

  const setTheme = (newThemeName: ThemeName) => {
    setThemeName(newThemeName);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeName }}>
      {children}
    </ThemeContext.Provider>
  );
};
