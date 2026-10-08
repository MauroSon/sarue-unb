import { describe, it, expect, beforeEach } from 'vitest';
import { createContainer } from '../container';
import { ScrapedClass } from '../domain/entities/grade';

describe('Clean Architecture Grade & Web Scraping Use Cases', () => {
  let container: ReturnType<typeof createContainer>;

  beforeEach(() => {
    container = createContainer();
  });

  it('deve listar departamentos disponíveis da UnB', async () => {
    const departments = await container.useCases.getDepartments.execute();
    expect(departments.length).toBeGreaterThan(0);
    const cic = departments.find((d) => d.id === '508');
    expect(cic).toBeDefined();
    expect(cic?.name).toContain('COMPUTAÇÃO');
  });

  it('deve consultar e obter turmas do departamento de computação (CIC)', async () => {
    const disciplines = await container.useCases.scrapeClasses.execute('508', '2026', '1');
    expect(disciplines.length).toBeGreaterThan(0);

    const apc = disciplines.find((d) => d.code === 'CIC0004');
    expect(apc).toBeDefined();
    expect(apc?.classes.length).toBeGreaterThanOrEqual(2);
    expect(apc?.classes[0].scheduleSlots.length).toBeGreaterThan(0);
  });

  it('deve validar obrigatoriedade do id do departamento ao coletar turmas', async () => {
    await expect(container.useCases.scrapeClasses.execute('', '2026', '1')).rejects.toThrow(
      'Código do departamento é obrigatório'
    );
  });

  it('deve detectar conflito entre turmas com mesmo horário no solver', async () => {
    // Duas turmas no mesmo horário: Segunda e Quarta das 10:00 às 11:50 (24M34)
    const classA: ScrapedClass = {
      id: 'CIC0004-01',
      disciplineCode: 'CIC0004',
      disciplineName: 'APC',
      classCode: '01',
      teachers: ['Prof. Carla'],
      classroom: 'PJC BT 110',
      scheduleCode: '24M34',
      scheduleSlots: [
        { day: 2, dayName: 'Seg', shift: 'M', period: 3, timeRange: '10:00 - 10:55', globalSlotIndex: 2 },
        { day: 2, dayName: 'Seg', shift: 'M', period: 4, timeRange: '10:55 - 11:50', globalSlotIndex: 3 },
      ],
    };

    const classB: ScrapedClass = {
      id: 'MAT0025-01',
      disciplineCode: 'MAT0025',
      disciplineName: 'CÁLCULO 1',
      classCode: '01',
      teachers: ['Prof. Luciana'],
      classroom: 'ICC CENTRO',
      scheduleCode: '24M34',
      scheduleSlots: [
        { day: 2, dayName: 'Seg', shift: 'M', period: 3, timeRange: '10:00 - 10:55', globalSlotIndex: 2 },
        { day: 2, dayName: 'Seg', shift: 'M', period: 4, timeRange: '10:55 - 11:50', globalSlotIndex: 3 },
      ],
    };

    const conflicts = await container.useCases.solveSchedule.checkConflicts([classA, classB]);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0]).toContain('CIC0004');
    expect(conflicts[0]).toContain('MAT0025');
  });

  it('deve gerar combinações sem conflito para turmas compatíveis', async () => {
    const classA: ScrapedClass = {
      id: 'CIC0004-01',
      disciplineCode: 'CIC0004',
      disciplineName: 'APC',
      classCode: '01',
      teachers: ['Prof. Carla'],
      classroom: 'PJC BT 110',
      scheduleCode: '24M34',
      scheduleSlots: [
        { day: 2, dayName: 'Seg', shift: 'M', period: 3, timeRange: '10:00 - 10:55', globalSlotIndex: 2 },
      ],
    };

    const classB: ScrapedClass = {
      id: 'MAT0025-01',
      disciplineCode: 'MAT0025',
      disciplineName: 'CÁLCULO 1',
      classCode: '01',
      teachers: ['Prof. Luciana'],
      classroom: 'ICC CENTRO',
      scheduleCode: '35T23',
      scheduleSlots: [
        { day: 3, dayName: 'Ter', shift: 'T', period: 2, timeRange: '14:00 - 14:55', globalSlotIndex: 6 },
      ],
    };

    const options = await container.useCases.solveSchedule.execute([classA, classB]);
    expect(options.length).toBe(1);
    expect(options[0].hasConflict).toBe(false);
    expect(options[0].classes.length).toBe(2);
  });

  it('deve salvar e carregar a grade planejada no repositório de persistência', async () => {
    const gradeToSave = {
      id: 'grade-2026-1',
      name: 'Minha Grade Ideal',
      semester: '2026.1',
      selectedClasses: [
        {
          id: 'CIC0004-01',
          disciplineCode: 'CIC0004',
          disciplineName: 'APC',
          classCode: '01',
          teachers: ['Prof. Carla'],
          classroom: 'PJC BT 110',
          scheduleCode: '24M34',
          scheduleSlots: [],
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    await container.useCases.manageGrade.save(gradeToSave);

    const saved = await container.useCases.manageGrade.get();
    expect(saved).toBeDefined();
    expect(saved?.id).toBe('grade-2026-1');
    expect(saved?.selectedClasses.length).toBe(1);
    expect(saved?.selectedClasses[0].disciplineCode).toBe('CIC0004');

    await container.useCases.manageGrade.clear();
    const afterClear = await container.useCases.manageGrade.get();
    expect(afterClear).toBeNull();
  });

  it('deve gerar siglas automáticas ignorando preposições e tratando números/romanos', async () => {
    const { generateAcronyms } = await import('../domain/grade-acronym');

    expect(generateAcronyms('Cálculo 1')).toEqual({
      acronym: 'C1',
      acronyms: ['C1', 'CI'],
    });

    expect(generateAcronyms('Cálculo I')).toEqual({
      acronym: 'C1',
      acronyms: ['C1', 'CI'],
    });

    expect(generateAcronyms('Organização e Arquitetura de Computadores')).toEqual({
      acronym: 'OAC',
      acronyms: ['OAC'],
    });

    expect(generateAcronyms('Sistemas Digitais')).toEqual({
      acronym: 'SD',
      acronyms: ['SD'],
    });

    expect(generateAcronyms('Introdução a Sociologia')).toEqual({
      acronym: 'IS',
      acronyms: ['IS'],
    });

    expect(generateAcronyms('Algoritmos e Programação de Computadores')).toEqual({
      acronym: 'APC',
      acronyms: ['APC'],
    });
  });

  it('deve retornar opções de semestres priorizando o atual e o próximo sem incluir período 3', async () => {
    const semesters = await container.useCases.getSemesters.execute();
    expect(semesters.length).toBeGreaterThanOrEqual(2);

    // Semestre atual (2026.2) e próximo (2027.1)
    const current = semesters.find((s) => s.isCurrent);
    expect(current).toBeDefined();
    expect(current?.period).toBe('2');
    expect(current?.label).toContain('2º semestre');

    const next = semesters.find((s) => !s.isCurrent);
    expect(next).toBeDefined();
    expect(next?.year).toBe('2027');
    expect(next?.period).toBe('1');
    expect(next?.label).toContain('1º semestre');

    // Período 3 não existe na UnB e nunca deve estar presente
    const invalidPeriod3 = semesters.find((s) => s.period === '3');
    expect(invalidPeriod3).toBeUndefined();
  });

  it('deve carregar turmas com siglas preenchidas e vagas ocupadas consistentes', async () => {
    const disciplines = await container.useCases.scrapeClasses.execute('508', '2026', '1');
    const apc = disciplines.find((d) => d.code === 'CIC0004');
    expect(apc).toBeDefined();
    expect(apc?.acronym).toBe('APC');
    expect(apc?.acronyms).toContain('APC');

    // Verifica que as vagas de cada turma não têm ocupadas > vagas totais absurdamente ou vagas 0 com 50 ocupadas
    for (const cls of apc?.classes || []) {
      if (cls.vacancies !== undefined && cls.occupied !== undefined) {
        expect(cls.vacancies).toBeGreaterThan(0);
        expect(cls.occupied).toBeLessThanOrEqual(cls.vacancies);
      }
    }
  });

  it('deve extrair semestres no scraper garantindo apenas semestre atual e o próximo', async () => {
    const { GradeScraper } = await import('../../scrapers/grade-scraper');
    const scraper = new GradeScraper();

    const mockHtml = `
      <input id="formTurma:inputAno" name="formTurma:inputAno" value="2026" />
      <select id="formTurma:inputPeriodo" name="formTurma:inputPeriodo">
        <option value="1">1</option>
        <option value="2" selected="selected">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
    `;

    const options = scraper.parseSemesters(mockHtml);
    expect(options).toHaveLength(2);
    expect(options[0]).toEqual({
      value: '2026-2',
      year: '2026',
      period: '2',
      label: '2026 • 2º semestre',
      is_current: true,
    });
    expect(options[1]).toEqual({
      value: '2027-1',
      year: '2027',
      period: '1',
      label: '2027 • 1º semestre',
      is_current: false,
    });
  });
});

