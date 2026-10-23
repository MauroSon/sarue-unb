import { describe, expect, it } from 'vitest';
import {
  BuildIraScenarioUseCase,
  CalculateIraUseCase,
  ParseHistoricoUseCase,
  creditsFromWorkload,
  extractPrecedingPeriod,
} from '../index';
import type {
  CurriculumStructure,
  IraMention,
  IraScenario,
  IraScenarioDiscipline,
  StudentAcademicProfile,
} from '../index';

function makeProfile(
  completedDisciplines: StudentAcademicProfile['completedDisciplines'],
): StudentAcademicProfile {
  return {
    matricula: '202012345',
    courseName: 'Engenharia de Computação',
    level: 'Graduação',
    admissionYear: '2020.1',
    completedDisciplines,
    manualCompletedCodes: [],
    manualUncompletedCodes: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

const CURRICULUM: CurriculumStructure = {
  id: 'cur1',
  courseId: 'course1',
  courseName: 'Engenharia de Computação',
  code: '1741/1',
  status: 'ACTIVE',
  mandatoryDisciplines: [
    { code: 'CIC0004', name: 'APC', workloadHours: 90, nature: 'Obrigatória', prerequisites: [], equivalences: [] },
    { code: 'MAT0024', name: 'Cálculo 1', workloadHours: 90, nature: 'Obrigatória', prerequisites: [], equivalences: [] },
    { code: 'CIC0099', name: 'SD1', workloadHours: 90, nature: 'Obrigatória', prerequisites: [], equivalences: [] },
    { code: 'MAT0026', name: 'Cálculo 2', workloadHours: 90, nature: 'Obrigatória', prerequisites: [], equivalences: [] },
    { code: 'CIC0189', name: 'Projeto e Análise de Algoritmos', workloadHours: 60, nature: 'Obrigatória', prerequisites: [], equivalences: [] },
  ],
  electiveDisciplines: [
    { code: 'CIC0123', name: 'IA', workloadHours: 60, nature: 'Optativa', prerequisites: [], equivalences: [] },
    { code: 'CIC0456', name: 'Optativa X', workloadHours: 90, nature: 'Optativa', prerequisites: [], equivalences: [] },
  ],
  complementaryDisciplines: [],
};

function makeScenario(overrides?: Partial<IraScenario>): IraScenario {
  return {
    semesters: [],
    baseTrancadasObrigatorias: 0,
    baseTrancadasOptativas: 0,
    extraTrancadasObrigatorias: 0,
    extraTrancadasOptativas: 0,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function disc(mention: IraMention | null, credits: number, id = 'd1'): IraScenarioDiscipline {
  return { id, name: 'Disciplina', credits, mention, origin: 'added' };
}

describe('CalculateIraUseCase', () => {
  const calc = new CalculateIraUseCase();

  it('calcula IRA sem trancamentos: média ponderada das menções pelos créditos', () => {
    const scenario = makeScenario({
      semesters: [
        {
          id: 's1',
          label: '1º Semestre',
          kind: 'history',
          disciplines: [disc('SS', 6, 'a'), disc('MM', 6, 'b')],
        },
      ],
    });

    const result = calc.execute(scenario);
    expect(result.weightedSum).toBe(48);
    expect(result.creditsSum).toBe(12);
    expect(result.ira).toBe(4);
  });

  it('aplica os pesos SS=5 MS=4 MM=3 MI=2 II=1 SR=0', () => {
    const scenario = makeScenario({
      semesters: [
        {
          id: 's1',
          label: '1º Semestre',
          kind: 'history',
          disciplines: [
            disc('SS', 1, 'a'), disc('MS', 1, 'b'), disc('MM', 1, 'c'),
            disc('MI', 1, 'd'), disc('II', 1, 'e'), disc('SR', 1, 'f'),
          ],
        },
      ],
    });

    const result = calc.execute(scenario);
    expect(result.ira).toBeCloseTo(2.5, 5);
  });

  it('exclui linhas sem menção do somatório e do N', () => {
    const scenario = makeScenario({
      semesters: [
        {
          id: 's1',
          label: '1º Semestre',
          kind: 'history',
          disciplines: [disc('SS', 6, 'a'), disc(null, 6, 'b')],
        },
      ],
    });

    const result = calc.execute(scenario);
    expect(result.mentionCount).toBe(1);
    expect(result.ira).toBe(5);
  });

  it('não penaliza trancamentos no IRA conforme Resolução CEPE nº 093/2018', () => {
    const disciplines = Array.from({ length: 10 }, (_, i) => disc('SS', 6, `d${i}`));
    const scenario = makeScenario({
      semesters: [{ id: 's1', label: '1º Semestre', kind: 'history', disciplines }],
      baseTrancadasObrigatorias: 1,
      baseTrancadasOptativas: 2,
    });

    const result = calc.execute(scenario);
    // Trancamentos não reduzem o IRA de 5 (Resolução CEPE nº 093/2018)
    expect(result.ira).toBe(5);
    expect(result.trancadasObrigatorias).toBe(1);
    expect(result.trancadasOptativas).toBe(2);
  });

  it('aplica pesos progressivos por semestre min(6, semestre) da Resolução CEG nº 0001/2020', () => {
    const scenario = makeScenario({
      semesters: [
        {
          id: 's1',
          label: '1º Semestre',
          kind: 'history',
          // Semestre 1: peso 1 -> 5 * 4 * 1 = 20, créditos ponderados: 4 * 1 = 4
          disciplines: [disc('SS', 4, 'd1')],
        },
        {
          id: 's2',
          label: '2º Semestre',
          kind: 'history',
          // Semestre 2: peso 2 -> 3 * 4 * 2 = 24, créditos ponderados: 4 * 2 = 8
          disciplines: [disc('MM', 4, 'd2')],
        },
        {
          id: 's3',
          label: '3º Semestre',
          kind: 'history',
          // Semestre 3: peso 3 -> 4 * 4 * 3 = 48, créditos ponderados: 4 * 3 = 12
          disciplines: [disc('MS', 4, 'd3')],
        },
      ],
    });

    const result = calc.execute(scenario);
    // Soma ponderada: 20 + 24 + 48 = 92
    // Créditos reais: 4 + 4 + 4 = 12
    // Créditos ponderados (denominador): 4*1 + 4*2 + 4*3 = 24
    // IRA: 92 / 24 = 3.8333... (diferente da média simples que seria 4.0)
    expect(result.weightedSum).toBe(92);
    expect(result.creditsSum).toBe(12);
    expect(result.weightedCreditsSum).toBe(24);
    expect(result.ira).toBeCloseTo(92 / 24, 4);
  });

  it('limita o peso semestral no teto 6 a partir do 6º semestre', () => {
    const scenario = makeScenario({
      semesters: [
        {
          id: 's7',
          label: '7º Semestre',
          kind: 'history',
          // Semestre 7: peso min(6, 7) = 6 -> 4 * 4 * 6 = 96, créd ponderados: 4 * 6 = 24, créd reais: 4
          disciplines: [disc('MS', 4, 'd7')],
        },
      ],
    });

    const result = calc.execute(scenario);
    expect(result.weightedSum).toBe(96);
    expect(result.creditsSum).toBe(4);
    expect(result.weightedCreditsSum).toBe(24);
    expect(result.ira).toBe(4);
  });

  it('linha sem créditos conta no N mas não no somatório de créditos', () => {
    const scenario = makeScenario({
      semesters: [
        {
          id: 's1',
          label: '1º Semestre',
          kind: 'history',
          disciplines: [disc('SS', 0, 'a'), disc('MM', 6, 'b')],
        },
      ],
    });

    const result = calc.execute(scenario);
    expect(result.mentionCount).toBe(2);
    expect(result.creditsSum).toBe(6);
    expect(result.ira).toBe(3);
  });

  it('retorna ira null quando nenhuma linha tem menção', () => {
    const scenario = makeScenario({
      semesters: [
        {
          id: 's1',
          label: 'Cursando agora',
          kind: 'current',
          disciplines: [disc(null, 6, 'a'), disc(null, 4, 'b')],
        },
      ],
    });

    const result = calc.execute(scenario);
    expect(result.ira).toBeNull();
    expect(result.mentionCount).toBe(0);
  });

  it('calcula o IRA de cada semestre sem a penalidade global', () => {
    const scenario = makeScenario({
      semesters: [
        {
          id: 's1',
          label: '1º Semestre',
          kind: 'history',
          disciplines: [disc('SS', 6, 'a'), disc('MM', 6, 'b')],
        },
        {
          id: 's2',
          label: '2º Semestre',
          kind: 'history',
          disciplines: [disc('MS', 4, 'c')],
        },
      ],
      baseTrancadasObrigatorias: 1,
    });

    const result = calc.execute(scenario);
    expect(result.semesterIras['s1']).toBe(4);
    expect(result.semesterIras['s2']).toBe(4);
  });
});

describe('BuildIraScenarioUseCase', () => {
  const build = new BuildIraScenarioUseCase();

  it('agrupa por período, ordena, resolve natureza e separa TR/MATR/CANC', () => {
    const profile = makeProfile([
      { code: 'CIC0999', name: 'Cancelada', workloadHours: 60, period: '2020.1', grade: '-', situation: 'CANC', isCompleted: false },
      { code: 'CIC0004', name: 'APC', workloadHours: 90, period: '2020.1', grade: 'SS', situation: 'APR', isCompleted: true },
      { code: 'MAT0024', name: 'Cálculo 1', workloadHours: 90, period: '2020.1', grade: 'MS', situation: 'APR', isCompleted: true },
      { code: 'CIC0099', name: 'SD1', period: '2020.2', grade: 'MM', situation: 'APR', isCompleted: true },
      { code: 'CIC0123', name: 'IA', workloadHours: 60, period: '2020.2', situation: 'DISP', isCompleted: true },
      { code: 'CIC0456', name: 'Optativa X', workloadHours: 90, situation: 'TR', isCompleted: false },
      { code: 'CIC0777', name: 'Cursando', workloadHours: 60, situation: 'MATR', isCompleted: false },
      { code: 'CIC0888', name: 'Sem Período', workloadHours: 60, grade: 'II', situation: 'REP', isCompleted: false },
    ]);

    const scenario = build.execute(profile, CURRICULUM);

    // 1º e 2º semestres ordenados, depois bloco sem período, depois cursando
    expect(scenario.semesters.map((s) => s.id)).toEqual([
      'history:2020.1', 'history:2020.2', 'unknown', 'current',
    ]);
    expect(scenario.semesters[0].label).toBe('1º Semestre');
    expect(scenario.semesters[1].label).toBe('2º Semestre');
    expect(scenario.semesters[0].disciplines.map((d) => d.code)).toEqual(['CIC0004', 'MAT0024']);
    // SD1 sem workloadHours no histórico: créditos vêm da matriz (90h = 6 créditos)
    const sd1 = scenario.semesters[1].disciplines.find((d) => d.code === 'CIC0099');
    expect(sd1?.credits).toBe(6);
    // DISP sem menção: linha presente, menção vazia
    const ia = scenario.semesters[1].disciplines.find((d) => d.code === 'CIC0123');
    expect(ia?.mention).toBeNull();
    // TR optativa: contador, sem linha
    expect(scenario.baseTrancadasOptativas).toBe(1);
    expect(scenario.baseTrancadasObrigatorias).toBe(0);
    expect(scenario.semesters.flatMap((s) => s.disciplines.map((d) => d.code))).not.toContain('CIC0456');
    // MATR: bloco "Cursando agora", menção vazia, 60h = 4 créditos
    const cursando = scenario.semesters.find((s) => s.id === 'current');
    expect(cursando?.disciplines).toHaveLength(1);
    expect(cursando?.disciplines[0].mention).toBeNull();
    expect(cursando?.disciplines[0].credits).toBe(4);
    // REP sem período: bloco "Semestre não identificado", menção II preservada
    const unknown = scenario.semesters.find((s) => s.id === 'unknown');
    expect(unknown?.disciplines[0].mention).toBe('II');
    // CANC some de todos os blocos
    expect(scenario.semesters.flatMap((s) => s.disciplines.map((d) => d.code))).not.toContain('CIC0999');
  });

  it('conta TR de disciplina obrigatória no contador de obrigatórias', () => {
    const profile = makeProfile([
      { code: 'CIC0004', name: 'APC', workloadHours: 90, situation: 'TR', isCompleted: false },
    ]);

    const scenario = build.execute(profile, CURRICULUM);
    expect(scenario.baseTrancadasObrigatorias).toBe(1);
    expect(scenario.semesters).toHaveLength(0);
  });

  it('TR sem correspondência na matriz conta como optativa', () => {
    const profile = makeProfile([
      { code: 'ZZZ9999', name: 'Fora da matriz', workloadHours: 60, situation: 'TR', isCompleted: false },
    ]);

    const scenario = build.execute(profile, CURRICULUM);
    expect(scenario.baseTrancadasOptativas).toBe(1);
  });

  it('menções inválidas viram linha sem menção', () => {
    const profile = makeProfile([
      { code: 'CIC0004', name: 'APC', workloadHours: 90, period: '2020.1', grade: 'AP', situation: 'APR', isCompleted: true },
    ]);

    const scenario = build.execute(profile, CURRICULUM);
    expect(scenario.semesters[0].disciplines[0].mention).toBeNull();
  });

  it('usa carga da matriz quando o histórico não traz carga horária', () => {
    const profile = makeProfile([
      { code: 'CIC0099', name: 'SD1', period: '2021.1', grade: 'SS', situation: 'APR', isCompleted: true },
    ]);

    const scenario = build.execute(profile, CURRICULUM);
    expect(scenario.semesters[0].disciplines[0].credits).toBe(6);
  });
});

describe('creditsFromWorkload', () => {
  it('converte horas em créditos (1 crédito = 15h)', () => {
    expect(creditsFromWorkload(90)).toBe(6);
    expect(creditsFromWorkload(60)).toBe(4);
    expect(creditsFromWorkload(45)).toBe(3);
    expect(creditsFromWorkload(68)).toBe(4.53);
    expect(creditsFromWorkload(undefined)).toBe(0);
  });
});

describe('extractPrecedingPeriod', () => {
  const raw = [
    'HISTÓRICO ESCOLAR',
    'Matrícula: 202012345',
    '2020.1 INTRODUÇÃO A COMPUTAÇÃO',
    '01 APRCIC0004 60 60,0 SS',
    '2020.1 CÁLCULO 1',
    '02 REPMAT0024 90 90,0 MS',
    '2021.1 ESTRUTURAS DE DADOS',
    '03 APRCIC0099 90 90,0 SS',
  ].join('\n');

  it('pega o período do agrupamento imediatamente anterior ao registro', () => {
    expect(extractPrecedingPeriod(raw, raw.indexOf('APRCIC0004'))).toBe('2020.1');
    expect(extractPrecedingPeriod(raw, raw.indexOf('REPMAT0024'))).toBe('2020.1');
    expect(extractPrecedingPeriod(raw, raw.indexOf('APRCIC0099'))).toBe('2021.1');
  });

  it('não confunde matrícula (sem ponto) com período', () => {
    expect(extractPrecedingPeriod(raw, raw.indexOf('202012345'))).toBeUndefined();
  });
});

describe('ParseHistoricoUseCase com período', () => {
  it('captura o período letivo de cada disciplina', async () => {
    const parse = new ParseHistoricoUseCase();
    const raw = [
      'Matrícula: 202012345',
      'Curso: ENGENHARIA DE COMPUTAÇÃO/CIC - BACHARELADO',
      'Componentes Curriculares',
      '2020.1 INTRODUÇÃO A COMPUTAÇÃO',
      '01 APRCIC0004 60 60,0 SS',
      '2020.2 CÁLCULO 1',
      '02 APRMAT0024 90 90,0 MS',
    ].join('\n');

    const result = await parse.execute({ rawText: raw });
    const byCode = new Map(result.profile.completedDisciplines.map((d) => [d.code, d]));
    expect(byCode.get('CIC0004')?.period).toBe('2020.1');
    expect(byCode.get('MAT0024')?.period).toBe('2020.2');
  });
});

describe('situações longas do padrão tabelado', () => {
  it('TRANCADO vira TR no build', async () => {
    const parse = new ParseHistoricoUseCase();
    const raw = [
      'Matrícula: 202012345',
      'Componentes Curriculares',
      '2020.2 OPTATIVA LIVRE',
      'CIC0123 OPTATIVA LIVRE 60 - TRANCADO',
    ].join('\n');

    const result = await parse.execute({ rawText: raw });
    const entry = result.profile.completedDisciplines.find((d) => d.code === 'CIC0123');
    expect(entry?.situation).toBe('TR');

    const build = new BuildIraScenarioUseCase();
    const scenario = build.execute(result.profile, CURRICULUM);
    expect(scenario.baseTrancadasOptativas + scenario.baseTrancadasObrigatorias).toBe(1);
    expect(scenario.semesters.flatMap((s) => s.disciplines.map((d) => d.code))).not.toContain('CIC0123');
  });
});

describe('trancadas com situação colada ao código (padrão comprimido)', () => {
  it('TRAN colado (TRANCIC0123) vira TR e conta como trancada', async () => {
    const parse = new ParseHistoricoUseCase();
    const raw = [
      'Matrícula: 202012345',
      'Componentes Curriculares',
      '2020.2 OPTATIVA LIVRE',
      '01 TRANCIC0123 60 60,0 -',
    ].join('\n');

    const result = await parse.execute({ rawText: raw });
    const entry = result.profile.completedDisciplines.find((d) => d.code === 'CIC0123');
    expect(entry?.situation).toBe('TR');

    const build = new BuildIraScenarioUseCase();
    const scenario = build.execute(result.profile, CURRICULUM);
    expect(scenario.baseTrancadasOptativas + scenario.baseTrancadasObrigatorias).toBe(1);
  });
});

describe('assinatura do perfil no cenário', () => {
  it('muda quando o histórico muda e o cenário guardado é descartado', () => {
    const build = new BuildIraScenarioUseCase();
    const profileA = makeProfile([
      { code: 'CIC0004', name: 'APC', workloadHours: 90, period: '2020.1', grade: 'SS', situation: 'APR', isCompleted: true },
    ]);
    const profileB = makeProfile([
      { code: 'CIC0004', name: 'APC', workloadHours: 90, period: '2020.1', grade: 'MS', situation: 'APR', isCompleted: true },
    ]);

    const scenarioA = build.execute(profileA, CURRICULUM);
    expect(scenarioA.profileSignature).toBeDefined();
    expect(scenarioA.profileSignature).not.toBe(build.execute(profileB, CURRICULUM).profileSignature);
    // Ressincronização idêntica: assinatura igual, cenário do usuário sobrevive
    expect(build.execute(profileA, CURRICULUM).profileSignature).toBe(scenarioA.profileSignature);
  });
});

describe('fallbacks de trancada no parse', () => {
  it('TR sem carga horária e TRAN colado/reverso entram como trancadas', async () => {
    const parse = new ParseHistoricoUseCase();
    const raw = [
      'Matrícula: 202012345',
      'Componentes Curriculares',
      '2020.1 A',
      'TR CIC0123',
      '2020.2 B',
      '01 TRANCIC0456 60 60,0 -',
      '2021.1 C',
      'CIC0999 60 - TRAN',
    ].join('\n');

    const result = await parse.execute({ rawText: raw });
    const situations = new Map(result.profile.completedDisciplines.map((d) => [d.code, d.situation]));
    expect(situations.get('CIC0123')).toBe('TR');
    expect(situations.get('CIC0456')).toBe('TR');
    expect(situations.get('CIC0999')).toBe('TR');

    const build = new BuildIraScenarioUseCase();
    const scenario = build.execute(result.profile, CURRICULUM);
    expect(scenario.baseTrancadasObrigatorias + scenario.baseTrancadasOptativas).toBe(3);
  });

  it('fallback não rebaixa disciplina já aprovada', async () => {
    const parse = new ParseHistoricoUseCase();
    const raw = [
      'Componentes Curriculares',
      '01 APRCIC0004 60 60,0 SS',
      'TR CIC0004',
    ].join('\n');

    const result = await parse.execute({ rawText: raw });
    const entry = result.profile.completedDisciplines.find((d) => d.code === 'CIC0004');
    expect(entry?.situation).toBe('APR');
  });
});

describe('pós-passo de menções', () => {
  it('recupera menção colada ao número quando o padrão principal perde', async () => {
    const parse = new ParseHistoricoUseCase();
    const raw = [
      'Componentes Curriculares',
      '01 APRCIC0004 60 60,0SS',
    ].join('\n');

    const result = await parse.execute({ rawText: raw });
    const entry = result.profile.completedDisciplines.find((d) => d.code === 'CIC0004');
    expect(entry?.grade).toBe('SS');

    const scenario = new BuildIraScenarioUseCase().execute(result.profile, CURRICULUM);
    expect(scenario.semesters[0].disciplines[0].mention).toBe('SS');
  });

  it('não inventa menção para linha sem sigla no fim', async () => {
    const parse = new ParseHistoricoUseCase();
    const raw = [
      'Componentes Curriculares',
      '01 MATRCIC0101 60 100,0 -',
    ].join('\n');

    const result = await parse.execute({ rawText: raw });
    const entry = result.profile.completedDisciplines.find((d) => d.code === 'CIC0101');
    expect(entry?.grade).toBe('-');
  });
});

describe('eventos de trancamento', () => {
  it('conta trancamento mesmo quando a disciplina foi aprovada depois', async () => {
    const parse = new ParseHistoricoUseCase();
    const raw = [
      'Matrícula: 202012345',
      'Componentes Curriculares',
      '2023.2 CÁLCULO 2',
      '08 TRANCMAT0026 90 -- -',
      '2024.2 CÁLCULO 2',
      '04 APRMAT0026 90 100,0 MM',
      '2024.2 PROJETO E ANÁLISE DE ALGORITMOS',
      '02 TRANCCIC0189 60 -- -',
    ].join('\n');

    const result = await parse.execute({ rawText: raw });
    // MAT0026 foi aprovada depois: situação vigente APR, mas o evento de 2023.2 conta
    expect(result.profile.trancadaEvents).toHaveLength(2);
    const byCode = new Map(result.profile.completedDisciplines.map((d) => [d.code, d]));
    expect(byCode.get('MAT0026')?.situation).toBe('APR');
    expect(byCode.get('CIC0189')?.situation).toBe('TR');

    const build = new BuildIraScenarioUseCase();
    const scenario = build.execute(result.profile, CURRICULUM);
    // MAT0026 e CIC0189 são obrigatórias na matriz do fixture
    expect(scenario.baseTrancadasObrigatorias).toBe(2);
    expect(scenario.baseTrancadasOptativas).toBe(0);
    // Cálculo 2 aprovada aparece como linha; CIC0189 só trancada vigente não vira linha
    const codes = scenario.semesters.flatMap((s) => s.disciplines.map((d) => d.code));
    expect(codes).toContain('MAT0026');
    expect(codes).not.toContain('CIC0189');
  });

  it('perfil antigo sem eventos cai no fallback das trancadas vigentes', () => {
    const build = new BuildIraScenarioUseCase();
    const profile = makeProfile([
      { code: 'CIC0456', name: 'Optativa X', workloadHours: 90, situation: 'TR', isCompleted: false },
    ]);
    const scenario = build.execute(profile, CURRICULUM);
    expect(scenario.baseTrancadasOptativas).toBe(1);
  });
});

describe('ajuste de trancamentos', () => {
  it('desconto negativo reduz o total e nunca fica abaixo de zero', () => {
    const calc = new CalculateIraUseCase();
    const disciplines = Array.from({ length: 10 }, (_, i) => disc('SS', 6, `d${i}`));

    const base = calc.execute(makeScenario({
      semesters: [{ id: 's1', label: '1º Semestre', kind: 'history', disciplines }],
      baseTrancadasObrigatorias: 2,
    }));
    const discounted = calc.execute(makeScenario({
      semesters: [{ id: 's1', label: '1º Semestre', kind: 'history', disciplines }],
      baseTrancadasObrigatorias: 2,
      extraTrancadasObrigatorias: -2,
    }));
    const overDiscounted = calc.execute(makeScenario({
      semesters: [{ id: 's1', label: '1º Semestre', kind: 'history', disciplines }],
      baseTrancadasObrigatorias: 2,
      extraTrancadasObrigatorias: -5,
    }));

    expect(base.trancadasObrigatorias).toBe(2);
    expect(discounted.trancadasObrigatorias).toBe(0);
    expect(overDiscounted.trancadasObrigatorias).toBe(0);
    expect(base.ira).toBe(5);
    expect(discounted.ira).toBe(5);
    expect(overDiscounted.ira).toBe(5);
  });

  it('aplica o fator de correção baseado no histórico oficial do SIGAA mantendo limites 0-5', () => {
    const calc = new CalculateIraUseCase();
    const scenario = makeScenario({
      semesters: [
        {
          id: 's1',
          label: '1º Semestre',
          kind: 'history',
          disciplines: [
            disc('MS', 4, 'd1'), // 4 * 4 * 1 = 16
            disc('MM', 4, 'd2'), // 3 * 4 * 1 = 12
          ],
        },
      ],
    });

    // Média bruta: (16 + 12) / 8 = 3.50
    const rawCalc = calc.execute(scenario, 0);
    expect(rawCalc.rawIra).toBe(3.5);
    expect(rawCalc.ira).toBe(3.5);

    // Ajuste com offset de calibração (-0.15): 3.50 - 0.15 = 3.35
    const adjustedCalc = calc.execute(scenario, -0.15);
    expect(adjustedCalc.rawIra).toBe(3.5);
    expect(adjustedCalc.ira).toBe(3.35);

    // Limites de segurança (nunca ultrapassa 5 nem fica negativo)
    expect(calc.execute(scenario, 2.0).ira).toBe(5.0);
    expect(calc.execute(scenario, -4.0).ira).toBe(0.0);
  });

  it('é resiliente a semestres com label corrompido, disciplines nulo ou offset NaN', () => {
    const calc = new CalculateIraUseCase();
    const scenario: IraScenario = {
      semesters: [
        {
          id: 's_corrupted',
          label: 'Semestre Especial de Verão',
          kind: 'history',
          // @ts-expect-error teste com disciplinas malformadas
          disciplines: [null, undefined, { id: 'd1', credits: NaN, mention: 'SS' }],
        },
        {
          id: 's_empty',
          label: '',
          kind: 'history',
          disciplines: [],
        },
      ],
      baseTrancadasObrigatorias: 0,
      baseTrancadasOptativas: 0,
      extraTrancadasObrigatorias: 0,
      extraTrancadasOptativas: 0,
      updatedAt: '2026-01-01',
    };

    expect(() => calc.execute(scenario, NaN)).not.toThrow();
    const result = calc.execute(scenario, NaN);
    expect(result.ira).toBeNull();
    expect(result.correctionOffset).toBe(0);
  });
});
