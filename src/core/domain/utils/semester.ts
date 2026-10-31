/**
 * Utilitário centralizado para resolução dinâmica do semestre acadêmico vigente da UnB,
 * evitando strings fixas como "2026.1" ou "2026.2" espalhadas pela aplicação.
 */
export interface AcademicSemesterInfo {
  year: string;
  period: '1' | '2';
  /** Formato "YYYY.P" (ex.: "2026.2") */
  semester: string;
  /** Formato "YYYY-P" usado nas opções de select (ex.: "2026-2") */
  value: string;
  /** Rótulo legível (ex.: "2026 • 2º semestre") */
  label: string;
}

export function getDefaultAcademicSemester(now: Date = new Date()): AcademicSemesterInfo {
  const year = String(now.getFullYear());
  // Na UnB, o 1º semestre vai tipicamente até julho e o 2º semestre começa em julho/agosto
  const month = now.getMonth() + 1;
  const period: '1' | '2' = month <= 6 ? '1' : '2';

  return {
    year,
    period,
    semester: `${year}.${period}`,
    value: `${year}-${period}`,
    label: `${year} • ${period}º semestre`,
  };
}
