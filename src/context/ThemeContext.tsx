import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  applyTheme,
  getThemeMode,
  setThemeModePersistence,
  watchSystemTheme,
  type ThemeMode,
} from '@/lib/theme';

interface ThemeContextValue {
  /** Modo escolhido pelo usuário (claro | escuro | sistema). */
  themeMode: ThemeMode;
  /** Troca o modo, persiste e aplica a classe no <html>. */
  setThemeMode: (mode: ThemeMode) => void;
  /** Tema efetivo depois de resolver "sistema". */
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Fonte única da preferência de tema. A classe `dark` no <html> já é
 * aplicada antes do primeiro paint (main.tsx chama applyTheme direto da
 * lib); este provider espelha o estado para as telas e reage ao sistema
 * operacional enquanto o modo é "sistema".
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() =>
    getThemeMode(),
  );
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    applyTheme(getThemeMode()),
  );

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModePersistence(mode);
    setThemeModeState(mode);
    setResolvedTheme(applyTheme(mode));
  }, []);

  // Enquanto o modo é "sistema", acompanha a troca do SO em tempo real.
  useEffect(() => {
    return watchSystemTheme(
      () => getThemeMode(),
      (resolved) => setResolvedTheme(resolved),
    );
  }, []);

  const value = useMemo(
    () => ({ themeMode, setThemeMode, resolvedTheme }),
    [themeMode, setThemeMode, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
}
