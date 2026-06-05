'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { themeColors, getRandomTheme } from '../_utils/themeColors';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const selectedTheme = getRandomTheme();
    setTheme(selectedTheme);
    setMounted(true);
  }, []);

  if (!mounted || !theme) {
    return <>{children}</>;
  }

  const colors = themeColors[theme];

  return (
    <ThemeContext.Provider value={{ theme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
