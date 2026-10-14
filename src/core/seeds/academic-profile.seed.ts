import type { StudentAcademicProfile } from '../domain/entities/academic-profile';

/**
 * Fixture de texto de histórico escolar para testes unitários e prévia sem dados pessoais.
 */
export const MOCK_HISTORICO_TEXT = `
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
Matrícula: 202000000
Nome: Discente Demonstração

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

/**
 * Perfil acadêmico demonstrativo limpo para uso em testes e fallback fora do runtime desktop.
 */
export const DEMO_STUDENT_PROFILE: StudentAcademicProfile = {
  matricula: '202000000',
  studentName: 'Discente Demonstração',
  courseName: 'ENGENHARIA DE COMPUTAÇÃO',
  degree: 'BACHARELADO',
  shift: 'DIURNO',
  level: 'GRADUAÇÃO',
  admissionYear: '2022.1',
  curriculumCode: '1741/1',
  curriculumId: '354',
  completedDisciplines: [
    {
      code: 'CIC0004',
      name: 'ALGORITMOS E PROGRAMAÇÃO DE COMPUTADORES',
      workloadHours: 90,
      period: '2022.1',
      grade: 'MS',
      situation: 'APR',
      isCompleted: true,
    },
    {
      code: 'CIC0188',
      name: 'INTRODUÇÃO À ENGENHARIA DE COMPUTAÇÃO',
      workloadHours: 30,
      period: '2022.1',
      grade: 'SS',
      situation: 'APR',
      isCompleted: true,
    },
    {
      code: 'MAT0137',
      name: 'CÁLCULO 1',
      workloadHours: 90,
      period: '2022.2',
      grade: 'MS',
      situation: 'APR',
      isCompleted: true,
    },
    {
      code: 'IFD0173',
      name: 'FISICA 1 EXPERIMENTAL',
      workloadHours: 30,
      period: '2023.1',
      grade: 'MM',
      situation: 'APR',
      isCompleted: true,
    },
    {
      code: 'CIC0090',
      name: 'ESTRUTURAS DE DADOS',
      workloadHours: 60,
      period: '2023.1',
      grade: 'MM',
      situation: 'APR',
      isCompleted: true,
    },
    {
      code: 'CIC0099',
      name: 'PROJETO INTEGRADOR',
      workloadHours: 60,
      period: '2026.2',
      grade: '-',
      situation: 'MATR',
      isCompleted: false,
    },
  ],
  manualCompletedCodes: [],
  manualUncompletedCodes: [],
  updatedAt: new Date().toISOString(),
  ira: 4.12,
  mp: 4.05,
  chObrigatoriaPendente: 1050,
  chOptativaPendente: 240,
  chTotalCurriculo: 3600,
  chComplementarPendente: 60,
  percentualIntegralizado: 42.5,
};
