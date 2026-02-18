'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes, ThemeType } from '@/lib/theme';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colors: typeof themes.admin;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>('patient');

  useEffect(() => {
    // Get theme from localStorage or default to patient
    const savedTheme = localStorage.getItem('theme') as ThemeType;
    if (savedTheme && themes[savedTheme]) {
      setTheme(savedTheme);
    }
  }, []);

  const value = {
    theme,
    setTheme: (newTheme: ThemeType) => {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    },
    colors: themes[theme],
  };

  const getBackgroundStyle = () => {
    switch (theme) {
      case 'admin':
        return {
          backgroundImage: `linear-gradient(135deg, 
            ${value.colors.primary}80 0%, 
            ${value.colors.secondary}80 25%, 
            ${value.colors.primary}80 50%, 
            ${value.colors.secondary}80 75%, 
            ${value.colors.primary}80 100%
          )`,
          backgroundSize: '400% 400%',
          animation: 'gradient 15s ease infinite',
        };
      case 'doctor':
        return {
          backgroundImage: `
            linear-gradient(135deg, ${value.colors.background} 0%, ${value.colors.secondary}40 50%, ${value.colors.primary}40 100%),
            repeating-linear-gradient(45deg, ${value.colors.primary}40 0px, ${value.colors.primary}40 2px, transparent 2px, transparent 10px),
            repeating-linear-gradient(-45deg, ${value.colors.secondary}40 0px, ${value.colors.secondary}40 2px, transparent 2px, transparent 10px)
          `,
          backgroundSize: '20px 20px',
        };
      case 'patient':
        return {
          backgroundImage: `linear-gradient(135deg, 
            ${value.colors.primary}80 0%, 
            ${value.colors.brown}80 25%, 
            ${value.colors.secondary}80 50%, 
            ${value.colors.brown}80 75%, 
            ${value.colors.primary}80 100%
          )`,
          backgroundSize: '400% 400%',
          animation: 'gradient 15s ease infinite',
        };
      default:
        return {
          backgroundColor: value.colors.background,
        };
    }
  };

  return (
    <ThemeContext.Provider value={value}>
      <div
        className="min-h-screen transition-colors duration-300"
        style={{
          ...getBackgroundStyle(),
          color: value.colors.text,
        }}
      >
        <style jsx global>{`
          :root {
            --primary-color: ${value.colors.primary};
            --secondary-color: ${value.colors.secondary};
            --background-color: ${value.colors.background};
            --text-color: ${value.colors.text};
            --accent-color: ${value.colors.accent};
            --success-color: ${value.colors.success};
            --warning-color: ${value.colors.warning};
            --error-color: ${value.colors.error};
          }

          @keyframes gradient {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
        `}</style>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 