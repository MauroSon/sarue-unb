import type { StudentAcademicProfile } from '../domain/entities/academic-profile';
import type { CurriculumStructure } from '../domain/entities/course';
import type { SigaaCredentials } from '../domain/entities/credential';
import type { IAcademicProfileRepository } from '../domain/interfaces/academic-profile-repo.interface';
import { ParseHistoricoUseCase } from './parse-historico.use-case';

export class ManageAcademicProfileUseCase {
  private parseHistoricoUseCase = new ParseHistoricoUseCase();

  constructor(private readonly repo: IAcademicProfileRepository) {}

  async getProfile(): Promise<StudentAcademicProfile | null> {
    return this.repo.getProfile();
  }

  async getAllCurricula(): Promise<CurriculumStructure[]> {
    return this.repo.getAllCurricula();
  }

  async saveProfile(profile: StudentAcademicProfile): Promise<void> {
    await this.repo.saveProfile(profile);
  }

  async clearProfile(): Promise<void> {
    await this.repo.clearProfile();
  }

  async toggleDiscipline(code: string): Promise<StudentAcademicProfile> {
    const current = await this.repo.getProfile();
    if (!current) {
      throw new Error('Nenhum perfil acadêmico carregado para alternar disciplinas.');
    }

    const normCode = code.toUpperCase();
    const isOriginallyCompleted = current.completedDisciplines.some(
      (d) => d.code === normCode && d.isCompleted
    );

    const manualCompleted = new Set(current.manualCompletedCodes || []);
    const manualUncompleted = new Set(current.manualUncompletedCodes || []);

    if (isOriginallyCompleted) {
      // Se era originalmente aprovada, alternar significa desmarcar ou remover da lista de desmarcadas
      if (manualUncompleted.has(normCode)) {
        manualUncompleted.delete(normCode);
      } else {
        manualUncompleted.add(normCode);
      }
    } else {
      // Se não era originalmente aprovada, alternar significa marcar ou desmarcar
      if (manualCompleted.has(normCode)) {
        manualCompleted.delete(normCode);
      } else {
        manualCompleted.add(normCode);
      }
    }

    const updated: StudentAcademicProfile = {
      ...current,
      manualCompletedCodes: Array.from(manualCompleted),
      manualUncompletedCodes: Array.from(manualUncompleted),
      updatedAt: new Date().toISOString(),
    };

    await this.repo.saveProfile(updated);
    return updated;
  }

  async resetManualOverrides(): Promise<StudentAcademicProfile> {
    const current = await this.repo.getProfile();
    if (!current) {
      throw new Error('Nenhum perfil acadêmico para redefinir.');
    }

    const updated: StudentAcademicProfile = {
      ...current,
      manualCompletedCodes: [],
      manualUncompletedCodes: [],
      updatedAt: new Date().toISOString(),
    };

    await this.repo.saveProfile(updated);
    return updated;
  }

  async setCurriculum(curriculum: CurriculumStructure): Promise<StudentAcademicProfile> {
    const current = (await this.repo.getProfile()) || {
      matricula: '',
      courseName: curriculum.courseName,
      level: 'Graduação',
      admissionYear: '2024.1',
      completedDisciplines: [],
      manualCompletedCodes: [],
      manualUncompletedCodes: [],
      updatedAt: new Date().toISOString(),
    };

    const updated: StudentAcademicProfile = {
      ...current,
      courseName: curriculum.courseName,
      curriculumCode: curriculum.code,
      curriculumId: curriculum.id,
      updatedAt: new Date().toISOString(),
    };

    await this.repo.saveProfile(updated);
    return updated;
  }

  async syncWithSigaa(creds: SigaaCredentials): Promise<{
    profile: StudentAcademicProfile;
    matchedCurriculum?: CurriculumStructure;
  }> {
    const rawRes = await this.repo.fetchSigaaHistory(creds);
    const curriculaCatalog = await this.repo.getAllCurricula();

    const parseResult = await this.parseHistoricoUseCase.execute({
      pdfBase64: rawRes.pdfBase64,
      defaultProfile: {
        matricula: rawRes.matricula,
        studentName: rawRes.nome,
        courseName: rawRes.curso,
        level: rawRes.nivel,
        admissionYear: rawRes.entrada,
        ira: rawRes.ira,
        mp: rawRes.mp,
        chObrigatoriaPendente: rawRes.chObrigatoriaPendente,
        chOptativaPendente: rawRes.chOptativaPendente,
        chTotalCurriculo: rawRes.chTotalCurriculo,
        chComplementarPendente: rawRes.chComplementarPendente,
        percentualIntegralizado: rawRes.percentualIntegralizado,
      },
      curriculaCatalog,
    });

    const currentProfile = await this.repo.getProfile();
    // Preserva eventuais marcações manuais anteriores
    if (currentProfile) {
      parseResult.profile.manualCompletedCodes = currentProfile.manualCompletedCodes || [];
      parseResult.profile.manualUncompletedCodes = currentProfile.manualUncompletedCodes || [];
    }

    await this.repo.saveProfile(parseResult.profile);
    return parseResult;
  }
}
