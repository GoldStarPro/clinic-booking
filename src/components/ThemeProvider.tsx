'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { usePathname } from 'next/navigation';
import { themes, ThemeType } from '@/lib/theme';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colors: typeof themes.admin;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Landing + auth pages keep their own CSS; do not paint role gradients behind them
const PUBLIC_PATHS = ['/', '/login', '/register'];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setThemeState] = useState<ThemeType>('patient');
  const [mounted, setMounted] = useState(false);
  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeType;
    if (savedTheme && themes[savedTheme]) {
      setThemeState(savedTheme);
    }
    setMounted(true);
  }, []);

  const setTheme = useCallback((newTheme: ThemeType) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
  }, []);

  const colors = themes[theme];

  const getBackgroundStyle = (): React.CSSProperties => {
    if (isPublic) {
      return { backgroundColor: 'transparent' };
    }
    if (!mounted) {
      return { backgroundColor: themes.patient.background };
    }

    switch (theme) {
      case 'admin':
        return {
          backgroundImage: `linear-gradient(135deg, 
            ${colors.primary}80 0%, 
            ${colors.secondary}80 25%, 
            ${colors.primary}80 50%, 
            ${colors.secondary}80 75%, 
            ${colors.primary}80 100%
          )`,
          backgroundSize: '400% 400%',
          animation: 'gradient 15s ease infinite',
        };
      case 'doctor':
        return {
          backgroundImage: `
            linear-gradient(135deg, ${colors.background} 0%, ${colors.secondary}40 50%, ${colors.primary}40 100%),
            repeating-linear-gradient(45deg, ${colors.primary}40 0px, ${colors.primary}40 2px, transparent 2px, transparent 10px),
            repeating-linear-gradient(-45deg, ${colors.secondary}40 0px, ${colors.secondary}40 2px, transparent 2px, transparent 10px)
          `,
          backgroundSize: '20px 20px',
        };
      case 'patient':
        return {
          backgroundImage: `linear-gradient(135deg, 
            ${colors.primary}80 0%, 
            ${colors.brown}80 25%, 
            ${colors.secondary}80 50%, 
            ${colors.brown}80 75%, 
            ${colors.primary}80 100%
          )`,
          backgroundSize: '400% 400%',
          animation: 'gradient 15s ease infinite',
        };
      default:
        return {
          backgroundColor: colors.background,
        };
    }
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    colors,
    mounted,
  };

  return (
    <ThemeContext.Provider value={value}>
      <div
        className="min-h-screen transition-colors duration-300"
        style={{
          ...getBackgroundStyle(),
          color: isPublic ? undefined : colors.text,
        }}
        suppressHydrationWarning
      >
        {!isPublic && (
          <style jsx global>{`
            :root {
              --primary-color: ${colors.primary};
              --secondary-color: ${colors.secondary};
              --background-color: ${colors.background};
              --text-color: ${colors.text};
              --accent-color: ${colors.accent};
              --success-color: ${colors.success};
              --warning-color: ${colors.warning};
              --error-color: ${colors.error};
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
        )}
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
