import { describe, it, expect, beforeEach } from 'vitest';
import {
  ParseHistoricoUseCase,
  GetFlowchartUseCase,
  ManageAcademicProfileUseCase,
  type StudentAcademicProfile,
  type CurriculumStructure,
} from '@/core';
import { InMemoryAcademicProfileRepository } from '../infrastructure/in-memory-academic-profile.repo';

const MOCK_HISTORICO_TEXT = `
Histórico Escolar - Emitido em: 08/10/2026 às 00:19
DEG - Decanato de Ensino de Graduação
SAA - Secretaria de Administração Acadêmica
Dados Pessoais
Dados do Vínculo do(a) Discente
ENGENHARIA DE COMPUTAÇÃO/CIC - BACHARELADO - DIURNO
Curso:
Currículo: 1741/1 - 2016.1
Ano / Período Letivo Inicial: 2022.1
Status: ATIVO
Matrícula: 221020904
Nome: Kaleb Henrique Silva Pereira

Componentes Curriculares Cursados/Cursando
2022.1 ALGORITMOS E PROGRAMAÇÃO DE COMPUTADORES
08 APRCIC0004 90 90,0 MS
2022.1 INTRODUÇÃO À ENGENHARIA DE COMPUTAÇÃO
01 APRCIC0188 30 100,0 SS
2022.1 FISICA 1 EXPERIMENTAL
21 REPIFD0173 30 100,0 MI&
2022.1 CÁLCULO 1
06 REPMAT0025 90 100,0 MI&
2022.2 CÁLCULO 1
02 APRMAT0137 90 95,0 MS
2023.1 FISICA 1 EXPERIMENTAL
05 APRIFD0173 30 90,0 MM
2023.1 ESTRUTURAS DE DADOS
01 APRCIC0090 60 92,0 MM
2026.2 PROJETO INTEGRADOR
01 MATRCIC0099 60 100,0 -
`;

const MOCK_CURRICULUM: CurriculumStructure = {
  id: '19821268',
  courseId: '414610',
  courseName: 'ENGENHARIA DE COMPUTAÇÃO',
  code: '1741/3',
  status: 'Ativa',
  totalHours: 3600,
  mandatoryDisciplines: [
    {
      code: 'CIC0004',
      name: 'ALGORITMOS E PROGRAMAÇÃO DE COMPUTADORES',
      workloadHours: 90,
      level: 1,
      nature: 'Obrigatória',
      prerequisites: [],
      equivalences: ['CIC0088'],
    },
    {
      code: 'MAT0025',
      name: 'CÁLCULO 1',
      workloadHours: 90,
      level: 1,
      nature: 'Obrigatória',
      prerequisites: [],
      equivalences: ['MAT0137'],
    },
    {
      code: 'IFD0173',
      name: 'FISICA 1 EXPERIMENTAL',
      workloadHours: 30,
      level: 1,
      nature: 'Obrigatória',
      prerequisites: [],
      equivalences: [],
    },
    {
      code: 'CIC0090',
      name: 'ESTRUTURAS DE DADOS',
      workloadHours: 60,
      level: 2,
      nature: 'Obrigatória',
      prerequisites: ['CIC0004'],
      equivalences: [],
    },
    {
      code: 'MAT0026',
      name: 'CÁLCULO 2',
      workloadHours: 90,
      level: 2,
      nature: 'Obrigatória',
      prerequisites: ['MAT0025'],
      equivalences: [],
    },
    {
      code: 'CIC0099',
      name: 'ORGANIZAÇÃO E ARQUITETURA DE COMPUTADORES',
      workloadHours: 60,
      level: 3,
      nature: 'Obrigatória',
      prerequisites: ['CIC0090'],
      equivalences: [],
    },
    {
      code: 'CIC0104',
      name: 'SISTEMAS OPERACIONAIS',
      workloadHours: 60,
      level: 4,
      nature: 'Obrigatória',
      prerequisites: ['CIC0099'],
      equivalences: [],
    },
  ],
  electiveDisciplines: [],
  complementaryDisciplines: [],
};

describe('Meu Curso - Casos de Uso e Domínio', () => {
  describe('ParseHistoricoUseCase', () => {
    const parseUseCase = new ParseHistoricoUseCase();

    it('deve extrair metadados e disciplinas do texto do histórico oficial da UnB', async () => {
      const result = await parseUseCase.execute({
        rawText: MOCK_HISTORICO_TEXT,
        curriculaCatalog: [MOCK_CURRICULUM],
      });

      expect(result.profile.matricula).toBe('221020904');
      expect(result.profile.studentName).toContain('Kaleb');
      expect(result.profile.courseName).toBe('ENGENHARIA DE COMPUTAÇÃO');
      expect(result.profile.admissionYear).toBe('2022.1');
      expect(result.profile.curriculumCode).toBe('1741/1');

      // Verifica correspondência de matriz curricular pelo prefixo 1741
      expect(result.matchedCurriculum).toBeDefined();
      expect(result.matchedCurriculum?.id).toBe(MOCK_CURRICULUM.id);

      // Verifica lista de disciplinas cursadas
      const completedCodes = result.profile.completedDisciplines.filter((d) => d.isCompleted).map((d) => d.code);
      expect(completedCodes).toContain('CIC0004'); // Aprovado
      expect(completedCodes).toContain('MAT0137'); // Aprovado
      expect(completedCodes).toContain('IFD0173'); // Reprovado primeiro, depois aprovado
      expect(completedCodes).toContain('CIC0090'); // Aprovado

      // CIC0099 deve constar como matriculada (MATR), não concluída
      const matriculada = result.profile.completedDisciplines.find((d) => d.code === 'CIC0099');
      expect(matriculada).toBeDefined();
      expect(matriculada?.situation).toBe('MATR');
      expect(matriculada?.isCompleted).toBe(false);
    });
  });

  describe('GetFlowchartUseCase', () => {
    const flowchartUseCase = new GetFlowchartUseCase();

    it('deve calcular corretamente status, equivalências, pré-requisitos e métricas', () => {
      const profile: StudentAcademicProfile = {
        matricula: '221020904',
        courseName: 'ENGENHARIA DE COMPUTAÇÃO',
        level: 'GRADUAÇÃO',
        admissionYear: '2022.1',
        completedDisciplines: [
          { code: 'CIC0004', name: 'APC', workloadHours: 90, grade: 'MS', situation: 'APR', isCompleted: true },
          { code: 'MAT0137', name: 'Cálculo 1 Equiv', workloadHours: 90, grade: 'MS', situation: 'APR', isCompleted: true },
          { code: 'IFD0173', name: 'Fis Exp 1', workloadHours: 30, grade: 'MM', situation: 'APR', isCompleted: true },
          { code: 'CIC0090', name: 'ED', workloadHours: 60, grade: 'MM', situation: 'APR', isCompleted: true },
          { code: 'CIC0099', name: 'OAC', workloadHours: 60, situation: 'MATR', isCompleted: false },
        ],
        manualCompletedCodes: [],
        manualUncompletedCodes: [],
        updatedAt: new Date().toISOString(),
      };

      const flowchart = flowchartUseCase.execute(MOCK_CURRICULUM, profile);

      // Semestres organizados
      expect(flowchart.semesters.length).toBeGreaterThanOrEqual(4);
      expect(flowchart.semesters[0].level).toBe(1);

      // CIC0004 e IFD0173 concluídas
      const s1 = flowchart.semesters[0].disciplines;
      const cic0004 = s1.find((d) => d.code === 'CIC0004');
      expect(cic0004?.status).toBe('completed');

      // MAT0025 foi cumprido via equivalência MAT0137
      const mat0025 = s1.find((d) => d.code === 'MAT0025');
      expect(mat0025?.status).toBe('completed');

      // Semestre 2: MAT0026 desbloqueado (Cálculo 1 feito) -> status 'available'
      const s2 = flowchart.semesters[1].disciplines;
      const mat0026 = s2.find((d) => d.code === 'MAT0026');
      expect(mat0026?.status).toBe('available');

      // CIC0099 está em andamento (in_progress)
      const s3 = flowchart.semesters[2].disciplines;
      const cic0099 = s3.find((d) => d.code === 'CIC0099');
      expect(cic0099?.status).toBe('in_progress');

      // Semestre 4: CIC0104 depende de CIC0099 que ainda não foi concluída -> status 'locked'
      const s4 = flowchart.semesters[3].disciplines;
      const cic0104 = s4.find((d) => d.code === 'CIC0104');
      expect(cic0104?.status).toBe('locked');
      expect(cic0104?.missingPrerequisites.length).toBeGreaterThan(0);

      // Métricas
      expect(flowchart.metrics.completedMandatoryDisciplines).toBe(4); // CIC0004, MAT0025, IFD0173, CIC0090
      expect(flowchart.metrics.inProgressCount).toBe(1); // CIC0099
      expect(flowchart.metrics.availableCount).toBe(1); // MAT0026
    });
  });

  describe('ManageAcademicProfileUseCase', () => {
    let repo: InMemoryAcademicProfileRepository;
    let manageUseCase: ManageAcademicProfileUseCase;

    beforeEach(async () => {
      repo = new InMemoryAcademicProfileRepository();
      await repo.clearProfile();
      manageUseCase = new ManageAcademicProfileUseCase(repo);
    });

    it('deve permitir marcar e desmarcar matérias manualmente', async () => {
      const initialProfile: StudentAcademicProfile = {
        matricula: '221020904',
        courseName: 'ENGENHARIA DE COMPUTAÇÃO',
        level: 'GRADUAÇÃO',
        admissionYear: '2022.1',
        completedDisciplines: [
          { code: 'CIC0004', name: 'APC', workloadHours: 90, grade: 'MS', situation: 'APR', isCompleted: true },
        ],
        manualCompletedCodes: [],
        manualUncompletedCodes: [],
        updatedAt: new Date().toISOString(),
      };

      await repo.saveProfile(initialProfile);

      // Marca manualmente uma matéria que não estava concluída
      const updated1 = await manageUseCase.toggleDiscipline('MAT0026');
      expect(updated1.manualCompletedCodes).toContain('MAT0026');

      // Desmarca a matéria marcada manualmente
      const updated2 = await manageUseCase.toggleDiscipline('MAT0026');
      expect(updated2.manualCompletedCodes).not.toContain('MAT0026');

      // Desmarca uma matéria que era originalmente concluída do histórico
      const updated3 = await manageUseCase.toggleDiscipline('CIC0004');
      expect(updated3.manualUncompletedCodes).toContain('CIC0004');

      // Redefine todos os overrides manuais
      const reset = await manageUseCase.resetManualOverrides();
      expect(reset.manualCompletedCodes).toEqual([]);
      expect(reset.manualUncompletedCodes).toEqual([]);
    });
  });
});
