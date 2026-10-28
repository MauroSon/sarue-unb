import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'sarue_background_run_enabled';

export function useBackgroundRun() {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    // Ativo por padrão se ainda não configurado
    return stored !== null ? stored === 'true' : true;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
          const { commands } = await import('@/core/infrastructure/bindings');
          const res = await commands.isBackgroundRunEnabled();
          if (res.status === 'ok' && isMounted) {
            setIsEnabled(res.data);
            localStorage.setItem(STORAGE_KEY, String(res.data));
          }
        }
      } catch (e) {
        console.warn('Erro ao consultar status de execução em segundo plano:', e);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggle = useCallback(async (nextValue: boolean) => {
    setIsEnabled(nextValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(nextValue));
    }

    setIsLoading(true);
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { commands } = await import('@/core/infrastructure/bindings');
        await commands.setBackgroundRun(nextValue);
      }
    } catch (e) {
      console.warn('Erro ao atualizar execução em segundo plano:', e);
      setIsEnabled(!nextValue);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(!nextValue));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isEnabled, isLoading, toggle };
}
