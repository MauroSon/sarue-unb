import fs from 'node:fs/promises';
import path from 'node:path';
import { extractText } from 'unpdf';
import { USER_AGENT, fetchWithRetry } from './utils.ts';

export interface CalendarEventPeriod {
  inicio: string; // ISO YYYY-MM-DD
  fim: string;    // ISO YYYY-MM-DD
  raw: string;    // Texto original (ex: "10/08 a 14/12/2026")
}

export interface CalendarEventDeadline {
  limite: string; // ISO YYYY-MM-DD
  raw: string;    // Texto original (ex: "Até 12/11/2026")
}

export interface ScrapedAcademicCalendar {
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
  updatedAt: string;
}

const SAA_CALENDARIOS_URL = 'https://saa.unb.br/calendario-academico-graduacao/';

/**
 * Converte data em formato brasileiro (DD/MM/YYYY) para ISO (YYYY-MM-DD).
 */
export function brDateToIso(dateStr: string, defaultYear = '2026'): string {
  const clean = dateStr.trim();
  const parts = clean.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  if (parts.length === 2) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    return `${defaultYear}-${month}-${day}`;
  }
  return dateStr;
}

/**
 * Extrai o texto limpo de um buffer PDF utilizando unpdf.
 */
export async function extractPdfText(buffer: Uint8Array): Promise<string> {
  const { text } = await extractText(buffer);
  return Array.isArray(text) ? text.join('\n') : text;
}

/**
 * Realiza o parsing do texto de calendários da UnB (Atividades e Matrícula) para compor os marcos temporais.
 */
export function parseCalendarText(
  text: string,
  year: string,
  period: string,
  pdfUrl?: string,
): Partial<ScrapedAcademicCalendar> {
  const result: Partial<ScrapedAcademicCalendar> = {
    semester: `${year}.${period}`,
    year,
    period,
    label: `${year} • ${period}º semestre`,
    isCurrent: year === '2026' && period === '2',
    pdfUrl,
    updatedAt: new Date().toISOString(),
  };

  // 1. Período de Aulas
  // Ex: "10/08/2026 Primeiro dia de aulas", "14/12/2026 Último dia de aulas" ou "10/08 - Início do período de aulas"
  const aulasIni =
    text.match(/(\d{2}\/\d{2}\/\d{4})\s+Primeiro dia de aulas/i) ||
    text.match(/In[íi]cio do per[íi]odo de aulas[^\n]*?(\d{2}\/\d{2}\/\d{4})/i) ||
    text.match(/(\d{2}\/\d{2})\s*-\s*In[íi]cio do per[íi]odo de aulas/i);

  const aulasFim =
    text.match(/(\d{2}\/\d{2}\/\d{4})\s+[Úu]ltimo dia de aulas/i) ||
    text.match(/T[ée]rmino do per[íi]odo de aulas[^\n]*?(\d{2}\/\d{2}\/\d{4})/i) ||
    text.match(/(\d{2}\/\d{2})\s*-\s*T[ée]rmino do per[íi]odo de aulas/i);

  if (aulasIni && aulasFim) {
    const iniStr = aulasIni[1].includes('/') && aulasIni[1].split('/').length === 2 ? `${aulasIni[1]}/${year}` : aulasIni[1];
    const fimStr = aulasFim[1].includes('/') && aulasFim[1].split('/').length === 2 ? `${aulasFim[1]}/${year}` : aulasFim[1];
    result.periodoAulas = {
      inicio: brDateToIso(iniStr, year),
      fim: brDateToIso(fimStr, year),
      raw: `${iniStr} a ${fimStr}`,
    };
  }

  // 2. Período Letivo
  // Ex: "22/07/2026 Primeiro dia letivo" e "19/12/2026 Último dia letivo"
  const letivoIni = text.match(/(\d{2}\/\d{2}\/\d{4})\s+Primeiro dia letivo/i);
  const letivoFim = text.match(/(\d{2}\/\d{2}\/\d{4})\s+[Úu]ltimo dia letivo/i);
  if (letivoIni && letivoFim) {
    result.periodoLetivo = {
      inicio: brDateToIso(letivoIni[1], year),
      fim: brDateToIso(letivoFim[1], year),
      raw: `${letivoIni[1]} a ${letivoFim[1]}`,
    };
  }

  // 3. Período de Solicitação de Matrícula
  // Ex: "Período para solicitação de matrícula de 07h do dia 27/07 até 23h59 do dia 29/07/2026"
  // ou "27/07 a 29/07/2026"
  const matr =
    text.match(/solicita[çc][ãa]o de matr[íi]cula.*?(\d{2}\/\d{2}(?:\/\d{4})?\s*(?:a|e)\s*\d{2}\/\d{2}\/\d{4})/is) ||
    text.match(/matr[íi]cula[^\n]*?dia\s+(\d{2}\/\d{2})\s+at[ée][^\n]*?(\d{2}\/\d{2}\/\d{4})/is);

  if (matr) {
    const iniPart = matr[1].includes(' a ') || matr[1].includes(' e ') ? matr[1].split(/\s+(?:a|e)\s+/)[0] : matr[1];
    const fimPart = matr[2] || (matr[1].includes(' a ') || matr[1].includes(' e ') ? matr[1].split(/\s+(?:a|e)\s+/)[1] : matr[1]);
    result.periodoMatricula = {
      inicio: brDateToIso(iniPart, year),
      fim: brDateToIso(fimPart, year),
      raw: `${iniPart} a ${fimPart}`,
    };
  }

  // 4. Período de Solicitação de Rematrícula
  // Ex: "03/08 e 04/08/2026" ou "03/08 até 04/08/2026"
  const rematr =
    text.match(/solicita[çc][ãa]o de rematr[íi]cula.*?(\d{2}\/\d{2}(?:\/\d{4})?\s*(?:a|e)\s*\d{2}\/\d{2}\/\d{4})/is) ||
    text.match(/rematr[íi]cula.*?dia\s+(\d{2}\/\d{2})\s+at[ée][^\n]*?(\d{2}\/\d{2}\/\d{4})/is);

  if (rematr) {
    const iniPart = rematr[1].includes(' a ') || rematr[1].includes(' e ') ? rematr[1].split(/\s+(?:a|e)\s+/)[0] : rematr[1];
    const fimPart = rematr[2] || (rematr[1].includes(' a ') || rematr[1].includes(' e ') ? rematr[1].split(/\s+(?:a|e)\s+/)[1] : rematr[1]);
    result.periodoRematricula = {
      inicio: brDateToIso(iniPart, year),
      fim: brDateToIso(fimPart, year),
      raw: `${iniPart} e ${fimPart}`,
    };
  }

  // 5. Período de Matrícula Extraordinária
  const extra =
    text.match(/Matr[íi]cula Extraordin[áa]ria.*?(\d{2}\/\d{2}(?:\/\d{4})?\s*(?:a|e)\s*\d{2}\/\d{2}\/\d{4})/is) ||
    text.match(/Matr[íi]cula Extraordin[áa]ria.*?dia\s+(\d{2}\/\d{2})\s+at[ée][^\n]*?(\d{2}\/\d{2}\/\d{4})/is);

  if (extra) {
    const iniPart = extra[1].includes(' a ') || extra[1].includes(' e ') ? extra[1].split(/\s+(?:a|e)\s+/)[0] : extra[1];
    const fimPart = extra[2] || (extra[1].includes(' a ') || extra[1].includes(' e ') ? extra[1].split(/\s+(?:a|e)\s+/)[1] : extra[1]);
    result.periodoMatriculaExtraordinaria = {
      inicio: brDateToIso(iniPart, year),
      fim: brDateToIso(fimPart, year),
      raw: `${iniPart} a ${fimPart}`,
    };
  }

  // 6. Período de Retirada de Disciplina(s)
  // Ex: "07/08 a 14/08/2026 Solicitação de Retirada de disciplina(s)"
  const ret =
    text.match(/solicita[çc][ãa]o de Retirada de disciplina.*?(\d{2}\/\d{2}(?:\/\d{4})?\s*(?:a|e)\s*\d{2}\/\d{2}\/\d{4})/is) ||
    text.match(/RETIRADA DE DISCIPLINA[^\n]*?(\d{2}\/\d{2}(?:\/\d{4})?\s*(?:a|e)\s*\d{2}\/\d{2}\/\d{4})/is);

  if (ret) {
    const iniPart = ret[1].split(/\s+(?:a|e)\s+/)[0];
    const fimPart = ret[1].split(/\s+(?:a|e)\s+/)[1] || iniPart;
    result.periodoRetirada = {
      inicio: brDateToIso(iniPart, year),
      fim: brDateToIso(fimPart, year),
      raw: `${iniPart} a ${fimPart}`,
    };
  }

  // 7. Trancamento Parcial de Matrícula (Automático)
  // Ex: "TRANCAMENTO PARCIAL DE MATRÍCULA AUTOMÁTICO Estudante Até 09/10/2026"
  const trancParcial = text.match(/TRANCAMENTO PARCIAL.*?At[ée]\s+(\d{2}\/\d{2}\/\d{4})/is);
  if (trancParcial) {
    result.periodoTrancamentoParcial = {
      limite: brDateToIso(trancParcial[1], year),
      raw: `Até ${trancParcial[1]}`,
    };
  }

  // 8. Trancamento Geral de Matrícula (Automático)
  // Ex: "TRANCAMENTO GERAL DE MATRÍCULA AUTOMÁTICO Estudante Até 12/11/2026"
  const trancGeral = text.match(/TRANCAMENTO GERAL.*?At[ée]\s+(\d{2}\/\d{2}\/\d{4})/is);
  if (trancGeral) {
    result.periodoTrancamentoGeral = {
      limite: brDateToIso(trancGeral[1], year),
      raw: `Até ${trancGeral[1]}`,
    };
  }

  return result;
}

export class CalendarScraper {
  /**
   * Obtém a lista de links para os PDFs de calendários na página oficial da SAA UnB.
   */
  async fetchCalendarLinks(): Promise<Array<{ text: string; url: string; year: string; period: string; type: 'ativ' | 'mat' | 'other' }>> {
    const res = await fetchWithRetry(SAA_CALENDARIOS_URL, {
      headers: { 'User-Agent': USER_AGENT },
    });
    const html = await res.text();

    const linkRegex = /<a[^>]+href=["']([^"']+\.pdf[^"']*)["'][^>]*>(.*?)<\/a>/gi;
    const links: Array<{ text: string; url: string; year: string; period: string; type: 'ativ' | 'mat' | 'other' }> = [];
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1].trim();
      const rawText = match[2].replace(/<[^>]+>/g, '').replace(/&#8211;/g, '-').trim();

      const semMatch = url.match(/(\d{4})_([124])_Calend_(Ati?v|Mat)/i) || rawText.match(/(\d{4})\.([124])/);
      if (semMatch) {
        const year = semMatch[1];
        const period = semMatch[2];
        const type = /mat/i.test(url) ? 'mat' : /ati?v/i.test(url) ? 'ativ' : 'other';
        links.push({
          text: rawText,
          url,
          year,
          period,
          type,
        });
      }
    }

    return links;
  }

  /**
   * Executa a extração completa dos calendários acadêmicos disponíveis.
   */
  async scrapeAll(): Promise<ScrapedAcademicCalendar[]> {
    const links = await this.fetchCalendarLinks();
    const calendarMap = new Map<string, ScrapedAcademicCalendar>();

    for (const item of links) {
      const key = `${item.year}.${item.period}`;
      try {
        console.log(`[CalendarScraper] Baixando PDF para ${key} (${item.type}): ${item.url}`);
        const res = await fetchWithRetry(item.url, { headers: { 'User-Agent': USER_AGENT } });
        const buf = await res.arrayBuffer();
        const text = await extractPdfText(new Uint8Array(buf));
        const parsed = parseCalendarText(text, item.year, item.period, item.url);

        const existing = calendarMap.get(key) || {
          semester: key,
          year: item.year,
          period: item.period,
          label: `${item.year} • ${item.period}º semestre`,
          isCurrent: item.year === '2026' && item.period === '2',
          updatedAt: new Date().toISOString(),
        };

        // Mescla propriedades não vazias (calendário de matrícula complementa o de atividades)
        const merged: ScrapedAcademicCalendar = {
          ...existing,
          ...Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== undefined)),
        };

        calendarMap.set(key, merged);
      } catch (err) {
        console.warn(`[CalendarScraper] Falha ao processar ${item.url}:`, err);
      }
    }

    return Array.from(calendarMap.values()).sort((a, b) => b.semester.localeCompare(a.semester));
  }
}

/**
 * Ponto de entrada CLI para o scraper de calendários.
 */
export async function main() {
  const args = process.argv.slice(2);
  let outDir = path.resolve('data');

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out-dir' && args[i + 1]) {
      outDir = path.resolve(args[i + 1]);
      i++;
    }
  }

  console.log(`[CalendarScraper] Iniciando coleta de calendários acadêmicos da SAA UnB...`);
  console.log(`[CalendarScraper] Diretório de saída: ${outDir}`);

  await fs.mkdir(outDir, { recursive: true });

  const scraper = new CalendarScraper();
  let calendars: ScrapedAcademicCalendar[] = [];

  try {
    calendars = await scraper.scrapeAll();
    console.log(`[CalendarScraper] ${calendars.length} calendários coletados com sucesso.`);
  } catch (err) {
    console.warn(`[CalendarScraper] Falha ao raspar calendário ao vivo: ${err}. Usando fallback local.`);
    // Se falhar a rede (ex.: sandbox), preserva ou lê o arquivo data/calendars.json existente
    try {
      const fallbackPath = path.resolve('data', 'calendars.json');
      const content = await fs.readFile(fallbackPath, 'utf-8');
      calendars = JSON.parse(content);
    } catch {}
  }

  if (calendars.length === 0) {
    calendars = [
      {
        semester: '2026.2',
        year: '2026',
        period: '2',
        label: '2026 • 2º semestre',
        isCurrent: true,
        periodoLetivo: { inicio: '2026-07-22', fim: '2026-12-19', raw: '22/07/2026 a 19/12/2026' },
        periodoAulas: { inicio: '2026-08-10', fim: '2026-12-14', raw: '10/08/2026 a 14/12/2026' },
        periodoMatricula: { inicio: '2026-07-27', fim: '2026-07-29', raw: '27/07 a 29/07/2026' },
        periodoRematricula: { inicio: '2026-08-03', fim: '2026-08-04', raw: '03/08 e 04/08/2026' },
        periodoMatriculaExtraordinaria: { inicio: '2026-08-07', fim: '2026-08-14', raw: '07/08 a 14/08/2026' },
        periodoRetirada: { inicio: '2026-08-07', fim: '2026-08-14', raw: '07/08 a 14/08/2026' },
        periodoTrancamentoParcial: { limite: '2026-10-09', raw: 'Até 09/10/2026' },
        periodoTrancamentoGeral: { limite: '2026-11-12', raw: 'Até 12/11/2026' },
        pdfUrl: 'https://saa.unb.br/wp-content/uploads/2026/10/2026_2_Calend_Ativ_Grad_02_10_2026.pdf',
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  const outPath = path.join(outDir, 'calendars.json');
  await fs.writeFile(outPath, JSON.stringify(calendars, null, 2), 'utf-8');
  console.log(`[CalendarScraper] Salvo: ${outPath} (${calendars.length} calendários)`);

  // Sincroniza cópia para public/data/
  const publicDataDir = path.resolve('public', 'data');
  if (path.resolve(outDir) !== publicDataDir) {
    try {
      await fs.mkdir(publicDataDir, { recursive: true });
      await fs.copyFile(outPath, path.join(publicDataDir, 'calendars.json'));
      console.log(`[CalendarScraper] Sincronizado para ${publicDataDir}`);
    } catch {}
  }
}

if (process.argv[1] && process.argv[1].endsWith('calendar-scraper.ts')) {
  main().catch((err) => {
    console.error('[CalendarScraper] Falha fatal:', err);
    process.exit(1);
  });
}
