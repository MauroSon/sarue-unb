export interface CalendarEventPeriod {
  inicio: string; // Formato ISO "YYYY-MM-DD"
  fim: string;    // Formato ISO "YYYY-MM-DD"
  raw: string;    // Texto original (ex.: "10/08 a 14/12/2026")
}

export interface CalendarEventDeadline {
  limite: string; // Formato ISO "YYYY-MM-DD"
  raw: string;    // Texto original (ex.: "Até 12/11/2026")
}

export interface AcademicCalendar {
  semester: string; // "2026.2"
  year: string;     // "2026"
  period: string;   // "2"
  label: string;    // "2026 • 2º semestre"
  isCurrent?: boolean;
  periodoLetivo?: CalendarEventPeriod;
  periodoAulas?: CalendarEventPeriod;
  periodoMatricula?: CalendarEventPeriod;
  periodoRematricula?: CalendarEventPeriod;
  periodoMatriculaExtraordinaria?: CalendarEventPeriod;
  periodoRetirada?: CalendarEventPeriod;
  periodoTrancamentoParcial?: CalendarEventDeadline;
  periodoTrancamentoGeral?: CalendarEventDeadline;
  pdfUrl?: string;
  updatedAt?: string;
}
