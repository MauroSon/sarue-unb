/**
 * Turno de um curso/matriz da UnB. O SIGAA usa o vocabulário DIURNO /
 * NOTURNO / INTEGRAL na listagem oficial de cursos, mas abrevia o turno
 * no portal do discente (ex.: "- MT" para matutino, "- N" para noturno).
 */
export type ShiftFamily = 'DIURNO' | 'NOTURNO' | 'INTEGRAL';

/** Primeira letra canônica de cada família (D/N/I) para casamento rápido. */
const FAMILY_INITIAL: Record<ShiftFamily, string> = {
  DIURNO: 'D',
  NOTURNO: 'N',
  INTEGRAL: 'I',
};

/**
 * Normaliza um token de turno para comparação: maiúsculas, sem acentos,
 * só a primeira letra relevantemente distinta (M/T/V são variantes diurnas).
 */
function initialOf(text: string | null | undefined): string | null {
  if (!text) return null;
  const clean = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase();
  return clean[0] || null;
}

/**
 * Converte o token de turno do SIGAA (portal do discente, histórico ou valor
 * legado já persistido no perfil) na família canônica. Regra pela primeira
 * letra: N = noturno; D/I = explícitos; M/V/T = matutino, vespertino e
 * combinações (MT, MTV...) que o catálogo lista como DIURNO. Graus como
 * "Bacharelado" no lugar do turno viram null (sem pistas).
 */
export function shiftFamilyFromSigaaToken(token: string | null | undefined): ShiftFamily | null {
  switch (initialOf(token)) {
    case 'N':
      return 'NOTURNO';
    case 'D':
      return 'DIURNO';
    case 'I':
      return 'INTEGRAL';
    case 'M':
    case 'V':
    case 'T':
      return 'DIURNO';
    default:
      return null;
  }
}

/**
 * O turno de uma entrada do catálogo (curso ou matriz) pertence à família?
 * Noturno casa só com noturno; integral casa com integral; diurno aceita
 * diurno, integral e as variantes matutino/vespertino ("Matutino e Vespertino").
 */
export function catalogShiftMatchesFamily(
  catalogShift: string | null | undefined,
  family: ShiftFamily
): boolean {
  const catalogInitial = initialOf(catalogShift);
  if (!catalogInitial) return false;
  if (family === 'NOTURNO') return catalogInitial === 'N';
  if (family === 'INTEGRAL') return catalogInitial === 'I';
  return catalogInitial !== 'N';
}

/**
 * Reordena estávelmente matrizes/entradas colocando primeiro as do turno do
 * discente (exatas, depois compatíveis). Usado nos fallbacks de casamento de
 * matriz por nome/ano, para não escolher a matriz de outro turno quando o
 * curso existe em diurno e noturno.
 */
export function preferShiftCompatible<T extends { shift?: string | null }>(
  items: T[],
  family: ShiftFamily | null
): T[] {
  if (!family || items.length <= 1) return items;
  const rank = (shift: string | null | undefined): number => {
    const initial = initialOf(shift);
    if (!initial) return 2;
    if (initial === FAMILY_INITIAL[family]) return 0;
    if (family === 'DIURNO' && initial !== 'N') return 1;
    return 2;
  };
  return [...items].sort((a, b) => rank(a.shift) - rank(b.shift));
}
