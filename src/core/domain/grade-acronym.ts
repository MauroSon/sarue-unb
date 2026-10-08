const STOPWORDS = new Set([
  'de', 'da', 'do', 'das', 'dos',
  'e',
  'a', 'o', 'as', 'os',
  'em', 'no', 'na', 'nos', 'nas',
  'para', 'por', 'com', 'sob', 'sobre',
  'ao', 'aos', 'à', 'às',
]);

const ROMAN_TO_ARABIC: Record<string, string> = {
  I: '1', II: '2', III: '3', IV: '4', V: '5', VI: '6', VII: '7', VIII: '8', IX: '9', X: '10',
};

const ARABIC_TO_ROMAN: Record<string, string> = {
  '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V', '6': 'VI', '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X',
};

/**
 * Cria siglas associadas para disciplinas removendo preposições e tratando números/algarismos romanos.
 * Ex: "Cálculo 1" -> { acronym: "C1", acronyms: ["C1", "CI"] }
 *     "Organização e Arquitetura de Computações" -> { acronym: "OAC", acronyms: ["OAC"] }
 *     "Sistemas Digitais" -> { acronym: "SD", acronyms: ["SD"] }
 *     "Introdução a Sociologia" -> { acronym: "IS", acronyms: ["IS"] }
 */
export function generateAcronyms(name: string): { acronym: string; acronyms: string[] } {
  if (!name) return { acronym: '', acronyms: [] };

  const cleaned = name
    .replace(/\s*\(\d+h\).*$/i, '')
    .replace(/[-–—/\\()]/g, ' ')
    .trim();

  const tokens = cleaned.split(/\s+/).filter((t) => t.length > 0);
  const filtered = tokens.filter((t) => {
    const norm = t
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return !STOPWORDS.has(norm);
  });

  if (filtered.length < 2) {
    if (filtered.length === 1 && /^\w+\d+$/i.test(filtered[0])) {
      const ac = filtered[0].toUpperCase();
      return { acronym: ac, acronyms: [ac] };
    }
    return { acronym: '', acronyms: [] };
  }

  const mainLetters: string[] = [];
  const altLetters: string[] = [];

  for (const t of filtered) {
    if (/^\d+$/.test(t)) {
      mainLetters.push(t);
      const roman = ARABIC_TO_ROMAN[t];
      altLetters.push(roman || t);
    } else if (/^(I|II|III|IV|V|VI|VII|VIII|IX|X)$/i.test(t)) {
      const upper = t.toUpperCase();
      const arabic = ROMAN_TO_ARABIC[upper];
      mainLetters.push(arabic || upper);
      altLetters.push(upper);
    } else {
      const ch = t[0]
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (/[A-Z0-9]/.test(ch)) {
        mainLetters.push(ch);
        altLetters.push(ch);
      }
    }
  }

  const primary = mainLetters.join('');
  const secondary = altLetters.join('');
  const set = new Set<string>();
  if (primary) set.add(primary);
  if (secondary) set.add(secondary);

  return {
    acronym: primary,
    acronyms: Array.from(set),
  };
}
