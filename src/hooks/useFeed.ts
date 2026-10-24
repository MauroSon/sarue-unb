import { useState, useEffect, useCallback } from 'react';
import { useContainer } from '../context/ContainerContext';
import type { FeedItem, Course, PlatformType, FeedItemType, Discipline } from '@/core';

// Notificador global entre instâncias ativas do hook useFeed
const feedListeners = new Set<() => void>();

export function notifyFeedListeners() {
  feedListeners.forEach((fn) => fn());
}

/** Assina atualizações globais do feed (sync, conclusão, arquivamento). */
export function subscribeToFeedUpdates(listener: () => void): () => void {
  feedListeners.add(listener);
  return () => {
    feedListeners.delete(listener);
  };
}

export function useFeed() {
  const { useCases } = useContainer();
  const [items, setItems] = useState<FeedItem[]>([]);
  // Contagem absoluta do feed ativo (sem filtros): alimenta o título da página
  const [totalItems, setTotalItems] = useState<number>(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [unmatchedCourses, setUnmatchedCourses] = useState<Course[]>([]);
  const [otherCourses, setOtherCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncErrors, setSyncErrors] = useState<Partial<Record<PlatformType, string>> | null>(null);

  // Filtros ativos
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | 'all'>('all');
  const [selectedType, setSelectedType] = useState<FeedItemType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showArchived, setShowArchived] = useState<boolean>(false);

  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const feedItems = await useCases.getFeed.execute({
        platform: selectedPlatform,
        itemType: selectedType,
        searchQuery,
        onlyArchived: showArchived ? true : undefined,
      });
      setItems(feedItems);
      setHasLoadedOnce(true);

      const absoluteItems = await useCases.getFeed.execute({
        onlyArchived: false,
      });
      setTotalItems(absoluteItems.length);

      const courseList = await useCases.getCourses.execute();
      setCourses(courseList);

      const disciplinesResult = await useCases.getCourses.getDisciplines();
      setDisciplines(disciplinesResult.disciplines);
      setUnmatchedCourses(disciplinesResult.unmatchedCourses);
      setOtherCourses(disciplinesResult.otherCourses);
    } catch (err) {
      console.error('Erro ao carregar dados do feed e disciplinas:', err);
    } finally {
      setIsLoading(false);
    }
  }, [useCases, selectedPlatform, selectedType, searchQuery, showArchived]);

  useEffect(() => {
    loadFeed();

    const listener = () => {
      loadFeed();
    };
    feedListeners.add(listener);

    return () => {
      feedListeners.delete(listener);
    };
  }, [loadFeed]);

  const sync = async (platforms?: PlatformType[]) => {
    setIsSyncing(true);
    setSyncErrors(null);
    try {
      const result = await useCases.syncPlatforms.execute(platforms);
      setItems(result.items);
      setHasLoadedOnce(true);
      setTotalItems(result.items.length);
      setCourses(result.courses);
      setLastSyncedAt(result.syncedAt);

      const disciplinesResult = await useCases.getCourses.getDisciplines();
      setDisciplines(disciplinesResult.disciplines);
      setUnmatchedCourses(disciplinesResult.unmatchedCourses);
      setOtherCourses(disciplinesResult.otherCourses);

      if (result.errors && Object.keys(result.errors).length > 0) {
        setSyncErrors(result.errors);
      }
      notifyFeedListeners();
      return result;
    } catch (err) {
      console.error('Erro durante a sincronização:', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const clearFeedData = useCallback(async () => {
    setIsLoading(true);
    try {
      await useCases.getFeed.clear();
      setItems([]);
      setTotalItems(0);
      setCourses([]);
      setDisciplines([]);
      setUnmatchedCourses([]);
      setLastSyncedAt(null);
      notifyFeedListeners();
    } catch (err) {
      console.error('Erro ao limpar dados do feed e turmas:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [useCases]);

  const toggleTaskCompleted = async (id: string, currentStatus?: boolean) => {
    const nextStatus = !currentStatus;
    await useCases.getFeed.markAsCompleted(id, nextStatus);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isCompleted: nextStatus } : item))
    );
    // Conclusão muda prazos pendentes: o sino e o painel acompanham.
    notifyFeedListeners();
  };

  const archiveFeedItem = async (id: string, isArchived: boolean = true) => {
    await useCases.getFeed.archiveItem(id, isArchived);
    if (!showArchived && isArchived) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    } else if (showArchived && !isArchived) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isArchived } : item))
      );
    }
  };

  // Ações em lote do modo Selecionar: SQLite local, laço sequencial basta.
  // Estado e notificação global atualizam uma vez só, no fim.
  const completeTasksBatch = async (ids: string[]) => {
    if (ids.length === 0) return;
    for (const id of ids) {
      await useCases.getFeed.markAsCompleted(id, true);
    }
    setItems((prev) =>
      prev.map((item) =>
        ids.includes(item.id) ? { ...item, isCompleted: true } : item
      )
    );
    // Conclusão muda prazos pendentes: o sino e o painel acompanham.
    notifyFeedListeners();
  };

  const archiveItemsBatch = async (ids: string[], isArchived: boolean) => {
    if (ids.length === 0) return;
    for (const id of ids) {
      await useCases.getFeed.archiveItem(id, isArchived);
    }
    // Mesma regra do single: quando o modo atual esconde os itens movidos, saem da lista
    if (showArchived !== isArchived) {
      setItems((prev) => prev.filter((item) => !ids.includes(item.id)));
    } else {
      setItems((prev) =>
        prev.map((item) =>
          ids.includes(item.id) ? { ...item, isArchived } : item
        )
      );
    }
  };

  const associateCourse = async (aprenderCourseId: string, sigaaCourseId: string | null, isIgnored: boolean = false) => {
    await useCases.getCourses.associateCourse(aprenderCourseId, sigaaCourseId, isIgnored);
    const disciplinesResult = await useCases.getCourses.getDisciplines();
    setDisciplines(disciplinesResult.disciplines);
    setUnmatchedCourses(disciplinesResult.unmatchedCourses);
    setOtherCourses(disciplinesResult.otherCourses);
    notifyFeedListeners();
  };

  return {
    items,
    totalItems,
    courses,
    disciplines,
    unmatchedCourses,
    otherCourses,
    isLoading,
    hasLoadedOnce,
    isSyncing,
    lastSyncedAt,
    syncErrors,
    selectedPlatform,
    setSelectedPlatform,
    selectedType,
    setSelectedType,
    searchQuery,
    setSearchQuery,
    showArchived,
    setShowArchived,
    sync,
    clearFeedData,
    refresh: loadFeed,
    toggleTaskCompleted,
    archiveFeedItem,
    completeTasksBatch,
    archiveItemsBatch,
    associateCourse,
  };
}

