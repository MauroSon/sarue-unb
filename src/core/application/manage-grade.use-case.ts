import { IGradeRepository } from '../domain/interfaces/grade-repo.interface';
import { SavedGrade } from '../domain/entities/grade';

export class ManageGradeUseCase {
  constructor(private gradeRepo: IGradeRepository) {}

  async save(grade: SavedGrade): Promise<void> {
    if (!grade.selectedClasses) {
      throw new Error('Grade inválida para salvamento.');
    }
    await this.gradeRepo.saveGrade(grade);
  }

  async get(semester?: string): Promise<SavedGrade | null> {
    return this.gradeRepo.getSavedGrade(semester);
  }

  async clear(semester?: string): Promise<void> {
    await this.gradeRepo.clearSavedGrade(semester);
  }
}
