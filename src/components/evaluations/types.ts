import {
  CONSENSUS_SEAL_MIN_EVALUATIONS,
  type CampusName,
  type ProfessorEvaluation,
} from '@/core';

export type EvaluationViewMode = 'professors' | 'disciplines';

export const FILTER_BY_COURSE_STORAGE_KEY =
  'unb_evaluations_filter_by_course';

export const PAGE_SIZE = 20;

export function getDidaticaBadgeStyle(score: number | null): string {
  if (score === null) {
    return 'bg-neutral-100 text-neutral-700 border-black';
  }
  if (score >= 8) {
    return 'bg-neo-green text-black border-black';
  }
  if (score >= 6) {
    return 'bg-neo-yellow text-black border-black';
  }
  return 'bg-neo-danger text-white border-black';
}

/** Cor do card de didática inteiro, por faixa de nota. */
export function getDidaticaCardStyle(score: number | null): string {
  if (score === null) {
    return 'bg-neutral-100 text-neutral-700';
  }
  if (score >= 8) {
    return 'bg-neo-green text-black';
  }
  if (score >= 6) {
    return 'bg-neo-yellow text-black';
  }
  return 'bg-neo-danger text-white';
}

export const DIFFICULTY_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todas as dificuldades' },
  { value: 'muito_facil', label: 'Muito fácil' },
  { value: 'facil', label: 'Fácil' },
  { value: 'medio', label: 'Médio' },
  { value: 'dificil', label: 'Difícil' },
  { value: 'muito_dificil', label: 'Muito difícil' },
  { value: 'nivel_god', label: 'Nível God' },
];

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'recommendation_desc', label: 'Mais recomendados' },
  { value: 'rating_desc', label: 'Maior didática (10 → 0)' },
  { value: 'rating_asc', label: 'Menor didática (0 → 10)' },
  { value: 'reviews_desc', label: 'Mais avaliados' },
];

export const CAMPUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos os campi' },
  { value: 'Darcy Ribeiro', label: 'Darcy Ribeiro' },
  { value: 'Ceilândia', label: 'Ceilândia' },
  { value: 'Gama', label: 'Gama' },
  { value: 'Planaltina', label: 'Planaltina' },
];

/** Selo exige muitas avaliações E consenso confirmado entre os relatos. */
export function hasConsensusSeal(summary: {
  hasConsistentLevels?: boolean;
  evaluationsCount: number;
}): boolean {
  return (
    Boolean(summary.hasConsistentLevels) &&
    summary.evaluationsCount >= CONSENSUS_SEAL_MIN_EVALUATIONS
  );
}

export interface DrillDownSummary {
  photoUrl?: string;
  siape?: string;
  publicUrl?: string;
  isSigaaVerified?: boolean;
  campuses: CampusName[];
  departments: string[];
  disciplines?: string[];
  evaluationsCount: number;
  hasConsistentLevels?: boolean;
  averageDidatica: number | null;
  recommendationRate: number;
  recommendYesCount: number;
  recommendDependeCount: number;
  recommendNoCount: number;
  evaluations: ProfessorEvaluation[];
}
