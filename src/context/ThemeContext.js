import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Always start in dark mode
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Optional: Persist dark mode in localStorage
    localStorage.setItem('theme', 'dark');
    document.body.className = 'dark-theme';
  }, [isDarkMode]);

  const toggleTheme = () => {
    // Optional: If you want to allow toggling, keep this.
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
