import React, { createContext, useContext, ReactNode, useEffect } from 'react';

type Theme = 'sports';

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

/** Tema fixo dark navy + gold (layout Taquaralto). */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  useEffect(() => {
    document.body.className = 'theme-sports';
    localStorage.setItem('theme', 'sports');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'sports' }}>
      {children}
    </ThemeContext.Provider>
  );
};
