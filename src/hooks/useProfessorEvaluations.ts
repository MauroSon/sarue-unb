import { useState, useEffect, useCallback } from 'react';
import { useContainer } from '../context/ContainerContext';
import type {
  ProfessorSummary,
  DisciplineSummary,
  CampusName,
  DifficultyLevel,
  ProfessorEvaluationSortBy,
} from '@/core';

export function useProfessorEvaluations() {
  const { useCases } = useContainer();

  const [summaries, setSummaries] = useState<ProfessorSummary[]>([]);
  const [disciplineSummaries, setDisciplineSummaries] = useState<
    DisciplineSummary[]
  >([]);
  // Agregados SEM filtro: base fixa para contagem absoluta (título, barra
  // "N de M") e drill-downs, imune a busca/filtros.
  const [unfilteredSummaries, setUnfilteredSummaries] = useState<
    ProfessorSummary[]
  >([]);
  const [unfilteredDisciplineSummaries, setUnfilteredDisciplineSummaries] =
    useState<DisciplineSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  // Filtros e parâmetros de busca
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCampus, setSelectedCampus] = useState<CampusName | 'all'>(
    'all'
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    DifficultyLevel | 'all'
  >('all');
  const [sortBy, setSortBy] = useState<ProfessorEvaluationSortBy>(
    'recommendation_desc'
  );

  const loadData = useCallback(
    async (forceRefresh = false) => {
      if (!forceRefresh) {
        setIsLoading(true);
      }

      try {
        const filters = {
          query: searchQuery,
          campus: selectedCampus,
          difficulty: selectedDifficulty,
          sortBy,
        };

        // As duas chamadas execute aquecem/renovam o cache do use-case; os
        // resultados brutos não são consumidos pelo hook.
        const [
          ,
          ,
          summaryList,
          disciplineSummaryList,
          unfilteredSummaryList,
          unfilteredDisciplineSummaryList,
        ] = await Promise.all([
          useCases.getProfessorEvaluations.execute(undefined, forceRefresh),
          useCases.getProfessorEvaluations.execute(filters, false),
          useCases.getProfessorEvaluations.getSummaries(filters, false),
          useCases.getProfessorEvaluations.getDisciplineSummaries(
            filters,
            false
          ),
          useCases.getProfessorEvaluations.getSummaries(undefined, false),
          useCases.getProfessorEvaluations.getDisciplineSummaries(
            undefined,
            false
          ),
        ]);

        setSummaries(summaryList);
        setDisciplineSummaries(disciplineSummaryList);
        setUnfilteredSummaries(unfilteredSummaryList);
        setUnfilteredDisciplineSummaries(unfilteredDisciplineSummaryList);
        setHasLoadedOnce(true);
        setError(false);
        return true;
      } catch (err) {
        console.error('Erro ao carregar avaliações de professores:', err);
        setError(true);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [
      useCases,
      searchQuery,
      selectedCampus,
      selectedDifficulty,
      sortBy,
    ]
  );

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCampus('all');
    setSelectedDifficulty('all');
    setSortBy('recommendation_desc');
  }, []);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCampus !== 'all' ||
    selectedDifficulty !== 'all';

  return {
    summaries,
    disciplineSummaries,
    unfilteredSummaries,
    unfilteredDisciplineSummaries,
    isLoading,
    hasLoadedOnce,
    searchQuery,
    setSearchQuery,
    selectedCampus,
    setSelectedCampus,
    selectedDifficulty,
    setSelectedDifficulty,
    sortBy,
    setSortBy,
    hasActiveFilters,
    clearFilters,
    error,
    retry: () => loadData(false),
    refresh: () => loadData(true),
  };
}
