import type { AcademicCalendar } from '../domain/entities/academic-calendar';

export class GetAcademicCalendarUseCase {
  private cache: AcademicCalendar[] | null = null;

  constructor(private fallbackCalendars: AcademicCalendar[] = []) {}

  /**
   * Obtém a lista completa de calendários acadêmicos disponíveis.
   */
  async execute(): Promise<AcademicCalendar[]> {
    if (this.cache && this.cache.length > 0) {
      return this.cache;
    }

    if (typeof fetch !== 'undefined') {
      try {
        const res = await fetch('/data/calendars.json');
        if (res.ok) {
          const list = (await res.json()) as AcademicCalendar[];
          if (Array.isArray(list) && list.length > 0) {
            this.cache = list;
            return list;
          }
        }
      } catch {
        // Fallback para cache ou sementes locais em caso de indisponibilidade
      }
    }

    if (this.fallbackCalendars.length > 0) {
      this.cache = this.fallbackCalendars;
      return this.fallbackCalendars;
    }

    // Semente institucional padrão
    const defaultList: AcademicCalendar[] = [
      {
        semester: '2026.2',
        year: '2026',
        period: '2',
        label: '2026 • 2º semestre',
        isCurrent: true,
        periodoLetivo: {
          inicio: '2026-07-22',
          fim: '2026-12-19',
          raw: '22/07/2026 a 19/12/2026',
        },
        periodoAulas: {
          inicio: '2026-08-10',
          fim: '2026-12-14',
          raw: '10/08/2026 a 14/12/2026',
        },
        periodoMatricula: {
          inicio: '2026-07-27',
          fim: '2026-07-29',
          raw: '27/07 a 29/07/2026',
        },
        periodoRematricula: {
          inicio: '2026-08-03',
          fim: '2026-08-04',
          raw: '03/08 e 04/08/2026',
        },
        periodoMatriculaExtraordinaria: {
          inicio: '2026-08-07',
          fim: '2026-08-14',
          raw: '07/08 a 14/08/2026',
        },
        periodoRetirada: {
          inicio: '2026-08-07',
          fim: '2026-08-14',
          raw: '07/08 a 14/08/2026',
        },
        periodoTrancamentoParcial: {
          limite: '2026-10-09',
          raw: 'Até 09/10/2026',
        },
        periodoTrancamentoGeral: {
          limite: '2026-11-12',
          raw: 'Até 12/11/2026',
        },
        pdfUrl: 'https://saa.unb.br/wp-content/uploads/2026/10/2026_2_Calend_Ativ_Grad_02_10_2026.pdf',
        updatedAt: '2026-10-15T00:00:00.000Z',
      },
    ];

    this.cache = defaultList;
    return defaultList;
  }

  /**
   * Obtém o calendário de um semestre específico.
   */
  async getCalendar(year: string, period: string): Promise<AcademicCalendar | null> {
    const list = await this.execute();
    return list.find((c) => c.year === year && c.period === period) || null;
  }

  /**
   * Identifica se as aulas ou período letivo do semestre indicado já iniciaram em relação à data de referência.
   */
  async isSemesterStarted(year: string, period: string, refDate: Date = new Date()): Promise<boolean> {
    const calendar = await this.getCalendar(year, period);
    if (!calendar) {
      // Se for o semestre marcado como atual, assume iniciado por padrão
      return year === '2026' && period === '2';
    }

    const startDateStr = calendar.periodoAulas?.inicio || calendar.periodoLetivo?.inicio;
    if (!startDateStr) {
      return Boolean(calendar.isCurrent);
    }

    const start = new Date(`${startDateStr}T00:00:00`);
    return refDate.getTime() >= start.getTime();
  }
}
