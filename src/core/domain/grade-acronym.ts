import type { ScheduleSlot } from './entities/grade';

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

/**
 * Decodifica o código de horário padrão UnB (ex: "24M34 6T12") em slots estruturados.
 */
export function parseScheduleCode(scheduleStr: string): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  const regex = /(\d+)([MTN])(\d+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(scheduleStr)) !== null) {
    const daysPart = match[1] || '';
    const shiftChar = (match[2] || 'M') as 'M' | 'T' | 'N';
    const periodsPart = match[3] || '';

    for (const dayCh of daysPart) {
      const day = parseInt(dayCh, 10);
      if (isNaN(day)) continue;

      const dayName =
        day === 2 ? 'Seg' :
        day === 3 ? 'Ter' :
        day === 4 ? 'Qua' :
        day === 5 ? 'Qui' :
        day === 6 ? 'Sex' :
        day === 7 ? 'Sáb' : 'Outro';

      for (const periodCh of periodsPart) {
        const period = parseInt(periodCh, 10);
        if (isNaN(period)) continue;

        let timeRange = '';
        let shiftOffset = 0;

        switch (shiftChar) {
          case 'M':
            shiftOffset = period - 1;
            timeRange =
              period === 1 ? '08:00 - 08:55' :
              period === 2 ? '08:55 - 09:50' :
              period === 3 ? '10:00 - 10:55' :
              period === 4 ? '10:55 - 11:50' :
              period === 5 ? '12:00 - 12:55' : 'Horário Manhã';
            break;
          case 'T':
            shiftOffset = 5 + (period - 1);
            timeRange =
              period === 1 ? '12:55 - 13:50' :
              period === 2 ? '14:00 - 14:55' :
              period === 3 ? '14:55 - 15:50' :
              period === 4 ? '16:00 - 16:55' :
              period === 5 ? '16:55 - 17:50' :
              period === 6 ? '18:00 - 18:55' : 'Horário Tarde';
            break;
          case 'N':
            shiftOffset = 11 + (period - 1);
            timeRange =
              period === 1 ? '19:00 - 19:50' :
              period === 2 ? '19:50 - 20:40' :
              period === 3 ? '20:50 - 21:40' :
              period === 4 ? '21:40 - 22:30' : 'Horário Noite';
            break;
        }

        slots.push({
          day,
          dayName,
          shift: shiftChar,
          period,
          timeRange,
          globalSlotIndex: shiftOffset,
        });
      }
    }
  }

  return slots;
}

