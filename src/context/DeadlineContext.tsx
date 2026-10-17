import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useContainer } from './ContainerContext';
import { subscribeToFeedUpdates } from '../hooks/useFeed';
import { subscribeToSyncComplete } from './SyncContext';
import type { DeadlineEntry } from '@/core';

interface DeadlineContextValue {
  entries: DeadlineEntry[];
  badgeCount: number;
  refresh: () => Promise<void>;
}

const DeadlineContext = createContext<DeadlineContextValue | null>(null);

/**
 * Avalia prazos (abertura do app, pós-sync e mudanças no feed) e publica o
 * buffer curto de prazos para o sino e o painel. Sem processo em fundo:
 * a checagem vive nesses três gatilhos.
 */
export const DeadlineProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { useCases } = useContainer();
  const [entries, setEntries] = useState<DeadlineEntry[]>([]);
  const [badgeCount, setBadgeCount] = useState<number>(0);

  const refresh = useCallback(async () => {
    try {
      const result = await useCases.evaluateDeadlines.execute();
      setEntries(result.entries);
      setBadgeCount(result.badgeCount);
    } catch (err) {
      console.error('Erro ao avaliar prazos:', err);
    }
  }, [useCases]);

  useEffect(() => {
    refresh();

    const unsubscribeFeed = subscribeToFeedUpdates(refresh);
    const unsubscribeSync = subscribeToSyncComplete(refresh);

    return () => {
      unsubscribeFeed();
      unsubscribeSync();
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ entries, badgeCount, refresh }),
    [entries, badgeCount, refresh],
  );

  return (
    <DeadlineContext.Provider value={value}>
      {children}
    </DeadlineContext.Provider>
  );
};

export function useDeadlines(): DeadlineContextValue {
  const context = useContext(DeadlineContext);
  if (!context) {
    throw new Error(
      'useDeadlines deve ser utilizado dentro de um DeadlineProvider',
    );
  }
  return context;
}
