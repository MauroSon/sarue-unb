import type { ProfessorEvaluation } from '../entities/professor-evaluation';

export interface IProfessorEvaluationRepository {
  getEvaluations(forceRefresh?: boolean): Promise<ProfessorEvaluation[]>;
  getPersistedEnrichedEvaluations?(): Promise<ProfessorEvaluation[] | null>;
  savePersistedEnrichedEvaluations?(
    evaluations: ProfessorEvaluation[]
  ): Promise<void>;
  clearPersistedEvaluations?(): Promise<void>;
}
