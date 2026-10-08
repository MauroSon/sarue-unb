import type { IGradeRepository } from '../domain/interfaces/grade-repo.interface';
import type { SemesterOption } from '../domain/entities/grade';

export class GetSemestersUseCase {
  constructor(private gradeRepo: IGradeRepository) {}

  async execute(): Promise<SemesterOption[]> {
    if (this.gradeRepo.getSemesters) {
      return this.gradeRepo.getSemesters();
    }
    return [
      { value: '2026-2', year: '2026', period: '2', label: '2026 • 2º semestre', isCurrent: true },
      { value: '2026-4', year: '2026', period: '4', label: '2026 - Sem 4' },
      { value: '2026-1', year: '2026', period: '1', label: '2026 • 1º semestre' },
      { value: '2027-1', year: '2027', period: '1', label: '2027 • 1º semestre' },
    ];
  }
}
