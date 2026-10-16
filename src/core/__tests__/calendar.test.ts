import { describe, it, expect, beforeEach } from 'vitest';
import { GetAcademicCalendarUseCase, type AcademicCalendar } from '@/core';
import { parseCalendarText, brDateToIso } from '../../scrapers/calendar-scraper';

const MOCK_ATIVIDADES_2026_2 = `
UNIVERSIDADE DE BRASÍLIA
CALENDÁRIO UNIVERSITÁRIO DE GRADUAÇÃO POR ATIVIDADES - 2026.2

PERÍODO LETIVO 22/07/2026 Primeiro dia letivo
19/12/2026 Último dia letivo

PERÍODO DE AULAS
10/08/2026 Primeiro dia de aulas
14/12/2026 Último dia de aulas

RETIRADA DE DISCIPLINA(S) Estudante 07/08 a 14/08/2026 Solicitação de Retirada de disciplina(s) de 14h do dia 07/08 até 23h59 do dia 14/08/2026 no SIGAA > Portal

TRANCAMENTO PARCIAL DE
MATRÍCULA AUTOMÁTICO Estudante Até 09/10/2026 Suspensão das atividades curriculares de um componente curricular apenas.

TRANCAMENTO GERAL DE
MATRÍCULA AUTOMÁTICO Estudante Até 12/11/2026 Suspensão de todas as atividades acadêmicas pelo período de um semestre letivo.
`;

const MOCK_MATRICULA_2026_2 = `
UNIVERSIDADE DE BRASÍLIA
CALENDÁRIO DE MATRÍCULA DE GRADUAÇÃO - 2º SEMESTRE DE 2026

Período para solicitação de matrícula de 07h do dia 27/07 até 23h59 do dia 29/07/2026 no SIGAA > Portal Discente > Ensino > Matrícula on-line > Realizar Matrícula.27/07 a 29/07/2026
Período para solicitação de rematrícula de 07h do dia 03/08 até 23h59 do dia 04/08/2026 no SIGAA > Portal Discente > Ensino > Matrícula on-line > Realizar Matrícula.
Matrícula Extraordinária de 10h do dia 07/08 até 23h59 do dia 14/08/2026 no SIGAA > Portal Discente > Ensino > Matrícula on-line > Realizar Matrícula Extraordinária.
`;

describe('Academic Calendar Scraper Parsing & Use Case', () => {
  describe('brDateToIso', () => {
    it('deve converter corretamente DD/MM/YYYY para YYYY-MM-DD', () => {
      expect(brDateToIso('10/08/2026')).toBe('2026-08-10');
      expect(brDateToIso('09/10/2026')).toBe('2026-10-09');
      expect(brDateToIso('27/07')).toBe('2026-07-27');
    });
  });

  describe('parseCalendarText', () => {
    it('deve extrair marcos temporais do Calendário de Atividades (aulas, período letivo, retirada e trancamentos)', () => {
      const parsed = parseCalendarText(MOCK_ATIVIDADES_2026_2, '2026', '2');

      expect(parsed.semester).toBe('2026.2');
      expect(parsed.periodoAulas?.inicio).toBe('2026-08-10');
      expect(parsed.periodoAulas?.fim).toBe('2026-12-14');

      expect(parsed.periodoLetivo?.inicio).toBe('2026-07-22');
      expect(parsed.periodoLetivo?.fim).toBe('2026-12-19');

      expect(parsed.periodoRetirada?.inicio).toBe('2026-08-07');
      expect(parsed.periodoRetirada?.fim).toBe('2026-08-14');

      expect(parsed.periodoTrancamentoParcial?.limite).toBe('2026-10-09');
      expect(parsed.periodoTrancamentoGeral?.limite).toBe('2026-11-12');
    });

    it('deve extrair prazos de matrícula, rematrícula e extraordinária do Calendário de Matrícula', () => {
      const parsed = parseCalendarText(MOCK_MATRICULA_2026_2, '2026', '2');

      expect(parsed.periodoMatricula?.inicio).toBe('2026-07-27');
      expect(parsed.periodoMatricula?.fim).toBe('2026-07-29');

      expect(parsed.periodoRematricula?.inicio).toBe('2026-08-03');
      expect(parsed.periodoRematricula?.fim).toBe('2026-08-04');

      expect(parsed.periodoMatriculaExtraordinaria?.inicio).toBe('2026-08-07');
      expect(parsed.periodoMatriculaExtraordinaria?.fim).toBe('2026-08-14');
    });
  });

  describe('GetAcademicCalendarUseCase', () => {
    let useCase: GetAcademicCalendarUseCase;
    const mockCalendars: AcademicCalendar[] = [
      {
        semester: '2026.2',
        year: '2026',
        period: '2',
        label: '2026 • 2º semestre',
        isCurrent: true,
        periodoAulas: {
          inicio: '2026-08-10',
          fim: '2026-12-14',
          raw: '10/08 a 14/12/2026',
        },
        periodoMatricula: {
          inicio: '2026-07-27',
          fim: '2026-07-29',
          raw: '27/07 a 29/07/2026',
        },
        periodoTrancamentoGeral: {
          limite: '2026-11-12',
          raw: 'Até 12/11/2026',
        },
      },
      {
        semester: '2027.1',
        year: '2027',
        period: '1',
        label: '2027 • 1º semestre',
        isCurrent: false,
        periodoAulas: {
          inicio: '2027-03-15',
          fim: '2027-07-17',
          raw: '15/03 a 17/07/2027',
        },
      },
    ];

    beforeEach(() => {
      useCase = new GetAcademicCalendarUseCase(mockCalendars);
    });

    it('deve listar os calendários acadêmicos disponíveis', async () => {
      const list = await useCase.execute();
      expect(list.length).toBe(2);
      expect(list[0].semester).toBe('2026.2');
    });

    it('deve encontrar calendário de semestre específico', async () => {
      const cal = await useCase.getCalendar('2026', '2');
      expect(cal).toBeDefined();
      expect(cal?.periodoAulas?.inicio).toBe('2026-08-10');
      expect(cal?.periodoTrancamentoGeral?.limite).toBe('2026-11-12');
    });

    it('deve verificar corretamente se o semestre já começou com base na data de referência', async () => {
      // Data anterior ao início das aulas (01/08/2026) -> false
      const beforeDate = new Date('2026-08-01T12:00:00');
      const isStartedBefore = await useCase.isSemesterStarted('2026', '2', beforeDate);
      expect(isStartedBefore).toBe(false);

      // Data exatamente no dia do início das aulas (10/08/2026) -> true
      const startDate = new Date('2026-08-10T08:00:00');
      const isStartedOn = await useCase.isSemesterStarted('2026', '2', startDate);
      expect(isStartedOn).toBe(true);

      // Data durante o semestre (15/10/2026) -> true
      const duringDate = new Date('2026-10-15T12:00:00');
      const isStartedDuring = await useCase.isSemesterStarted('2026', '2', duringDate);
      expect(isStartedDuring).toBe(true);
    });
  });
});
