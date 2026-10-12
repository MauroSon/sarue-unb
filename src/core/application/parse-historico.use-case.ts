import { extractText } from 'unpdf';
import type { CompletedDiscipline, StudentAcademicProfile } from '../domain/entities/academic-profile';
import type { CurriculumStructure } from '../domain/entities/course';

export interface ParseHistoricoInput {
  pdfData?: Uint8Array;
  pdfBase64?: string;
  rawText?: string;
  defaultProfile?: Partial<StudentAcademicProfile>;
  curriculaCatalog?: CurriculumStructure[];
}

export interface ParseHistoricoResult {
  profile: StudentAcademicProfile;
  matchedCurriculum?: CurriculumStructure;
}

/**
 * Decodifica string base64 para Uint8Array em qualquer ambiente JS
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = typeof atob !== 'undefined'
    ? atob(base64)
    : Buffer.from(base64, 'base64').toString('binary');
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function normalizeName(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrai o nome da disciplina a partir das linhas que antecedem o registro
 * compactado no histórico escolar da UnB (ex.: linha com "2026.2 SINAIS E SISTEMAS EM TEMPO CONTÍNUO").
 */
export function extractPrecedingDisciplineName(fullText: string, matchIndex: number): string | undefined {
  const windowStart = Math.max(0, matchIndex - 350);
  const textBefore = fullText.slice(windowStart, matchIndex);
  const lines = textBefore.split(/\r?\n/);

  // 1. Caso esteja na mesma linha: ex.: "2026.2 SINAIS E SISTEMAS EM TEMPO CONTÍNUO 01 "
  const currentLinePrefix = lines[lines.length - 1];
  const sameLineMatch = currentLinePrefix.match(/\b\d{4}\.[12]\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9–\-\s/]+?)(?:\s+\d{1,3})?\s*$/i);
  if (sameLineMatch && sameLineMatch[1].trim()) {
    const raw = sameLineMatch[1].trim();
    if (raw.length >= 3 && !/^(APR|REP|MATR|TR|DISP)\b/i.test(raw)) {
      return raw;
    }
  }

  // 2. Linhas anteriores retrocedendo a partir da linha imediatamente anterior
  const nameParts: string[] = [];
  for (let i = lines.length - 2; i >= 0; i--) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Se encontramos uma linha que pertence a outra disciplina (contém código ou situação anterior), paramos
    if (/(APR|REP|REPF|REPN|TR|MATR|DISP|CANC)\b/i.test(rawLine) || /[A-Z]{3}\d{4}/.test(rawLine)) {
      break;
    }

    // Linha com semestre e nome da disciplina: ex.: "2026.2 SINAIS E SISTEMAS EM TEMPO CONTÍNUO"
    const semMatch = rawLine.match(/^(\d{4}\.[12])\s+(.+)$/);
    if (semMatch) {
      nameParts.unshift(semMatch[2].trim());
      break;
    } else {
      // Linha de continuação do nome da disciplina (caso quebre linha no PDF)
      if (/Histórico|Componentes|Dados|Curso|Currículo|Status|Matrícula|Nome|SAA|DEG/i.test(rawLine)) {
        break;
      }
      nameParts.unshift(rawLine);
    }
  }

  if (nameParts.length > 0) {
    const combined = nameParts.join(' ').replace(/\s+/g, ' ').trim();
    if (combined.length >= 3 && !/^(APR|REP|MATR|TR|DISP)\b/i.test(combined)) {
      return combined;
    }
  }

  return undefined;
}

export class ParseHistoricoUseCase {
  async execute(input: ParseHistoricoInput): Promise<ParseHistoricoResult> {
    let fullText = input.rawText || '';

    // 1. Extração do PDF via unpdf se fornecido
    if (!fullText) {
      let uint8: Uint8Array | undefined = input.pdfData;
      if (!uint8 && input.pdfBase64) {
        uint8 = base64ToUint8Array(input.pdfBase64);
      }

      if (uint8) {
        try {
          const res = await extractText(uint8);
          if (Array.isArray(res.text)) {
            fullText = res.text.join('\n');
          } else if (typeof res.text === 'string') {
            fullText = res.text;
          }
        } catch (e) {
          console.warn('[ParseHistoricoUseCase] Falha ao extrair texto com unpdf:', e);
        }
      }
    }

    // 2. Extração dos metadados principais
    const matriculaMatch = fullText.match(/Matr[íi]cula:\s*(\d+)/i);
    const matricula = matriculaMatch?.[1] || input.defaultProfile?.matricula || '';

    const nomeMatch = fullText.match(/Nome:\s*([^\n\r]+)/i);
    const studentName = nomeMatch?.[1]?.trim() || input.defaultProfile?.studentName;

    // Procura Curso: "ENGENHARIA DE COMPUTAÇÃO/CIC - BACHARELADO..."
    const cursoMatch = fullText.match(/(?:Curso:\s*|\n)([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]+(?:\/[A-Z]+)?\s*-\s*BACHARELADO|\n[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]+(?:\/[A-Z]+)?\s*-\s*LICENCIATURA)/i)
      || fullText.match(/Curso:\s*([^\n\r]+)/i);
    let rawCurso = cursoMatch?.[1]?.trim() || input.defaultProfile?.courseName || 'Curso UnB';
    // Remove sufixos após '/' ou '-'
    if (rawCurso.includes('/')) {
      rawCurso = rawCurso.split('/')[0].trim();
    } else if (rawCurso.includes(' - ')) {
      rawCurso = rawCurso.split(' - ')[0].trim();
    }
    const courseName = rawCurso;

    // Currículo / Matriz Ativa
    const headerPortion = fullText.split(/Componentes Curriculares/i)[0] || fullText.slice(0, 3000);
    const curriculoMatch = headerPortion.match(/\b(\d{3,5}\/\d+)\b/)
      || fullText.match(/Curr[íi]culo:\s*([\d/]+)/i)
      || fullText.match(/Estrutura\s*Curricular:\s*([\d/]+)/i);
    const curriculumCode = curriculoMatch?.[1] || input.defaultProfile?.curriculumCode;

    // Ano de Ingresso
    const anoMatch = fullText.match(/(?:Ano\s*\/\s*Per[íi]odo\s*Letivo\s*Inicial|Entrada):\s*(\d{4}\.[12]|\d{4})/i);
    const admissionYear = anoMatch?.[1] || input.defaultProfile?.admissionYear || '';

    // Nível
    const nivelMatch = fullText.match(/N[íi]vel:\s*([^\n\r]+)/i);
    const level = nivelMatch?.[1]?.trim() || input.defaultProfile?.level || 'Graduação';

    const iraMatch = fullText.match(/IRA:\s*([\d.]+)/i);
    const mpMatch = fullText.match(/MP:\s*([\d.]+)/i);
    const ira = input.defaultProfile?.ira ?? (iraMatch ? parseFloat(iraMatch[1]) : undefined);
    const mp = input.defaultProfile?.mp ?? (mpMatch ? parseFloat(mpMatch[1]) : undefined);

    // 3. Extração das disciplinas cursadas e em andamento
    const completedMap = new Map<string, CompletedDiscipline>();

    const setOrUpdateDiscipline = (entry: CompletedDiscipline) => {
      const existing = completedMap.get(entry.code);
      if (!existing) {
        completedMap.set(entry.code, entry);
        return;
      }

      // Preserva o nome real se a nova entrada tiver só o código
      const resolvedName = (entry.name && entry.name !== entry.code)
        ? entry.name
        : (existing.name && existing.name !== existing.code)
        ? existing.name
        : entry.name || existing.name;

      // Se a nova entrada representa conclusão efetiva e a anterior não:
      if (!existing.isCompleted && entry.isCompleted) {
        completedMap.set(entry.code, { ...entry, name: resolvedName });
        return;
      }

      // Se a existente já é concluída (APR/DISP):
      if (existing.isCompleted) {
        if (entry.situation === 'APR' && existing.situation !== 'APR') {
          completedMap.set(entry.code, { ...entry, name: resolvedName });
        } else if (resolvedName !== existing.name) {
          existing.name = resolvedName;
        }
        return;
      }

      // Ambas não concluídas (REP, TR, CANC, MATR):
      // MATR representa matrícula ativa atual -> tem precedência sobre reprovações/trancamentos anteriores!
      if (entry.situation === 'MATR' || entry.situation === 'MATRICULADO') {
        completedMap.set(entry.code, {
          ...entry,
          name: resolvedName,
          situation: 'MATR',
          isCompleted: false,
        });
        return;
      }

      // Se a existente não for MATR e a nova tiver APR:
      if (existing.situation !== 'MATR' && entry.situation === 'APR') {
        completedMap.set(entry.code, { ...entry, name: resolvedName });
      } else if (resolvedName !== existing.name) {
        existing.name = resolvedName;
      }
    };

    // Padrão 1 (UnB oficial comprimido do iText): 08 APRCIC0004 90 90,0 MS ou 01 MATRCIC0099 60 100,0 -
    // Suporta espaços opcionais entre situação e código, notas com sufixos ou traços:
    const patternCompact = /(APR|REP|REPF|REPN|TR|MATR|DISP|CANC)\s*([A-Z]{3}\d{4})\s+(\d+)(?:\s+([\d,]+|-+))?(?:\s+([A-Z0-9&*\-–#e]+))?/gi;
    let match: RegExpExecArray | null;
    while ((match = patternCompact.exec(fullText)) !== null) {
      const rawSit = match[1].toUpperCase();
      const code = match[2].toUpperCase();
      const ch = parseInt(match[3], 10);
      const rawGrade = (match[5] || '').trim();
      const cleanGrade = rawGrade.replace(/[^A-Z0-9-]/gi, '').toUpperCase();

      const situation = rawSit.startsWith('MATR') ? 'MATR' : rawSit;
      const isCompleted = situation === 'APR'
        || situation === 'DISP'
        || ['SS', 'MS', 'MM', 'AP', 'CC'].some((g) => cleanGrade.startsWith(g));

      const parsedName = extractPrecedingDisciplineName(fullText, match.index);

      setOrUpdateDiscipline({
        code,
        name: parsedName || code,
        workloadHours: ch,
        grade: cleanGrade || rawGrade || (situation === 'MATR' ? '-' : undefined),
        situation,
        isCompleted: situation === 'MATR' ? false : isCompleted,
      });
    }

    // Padrão 2 (Tabelado ou padrão com código separado): [A-Z]{3}\d{4} ... APROVADO|DISPENSADO|MATRICULADO
    const patternStandard = /([A-Z]{3}\d{4})\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s0-9–-]+?)\s+(\d{2,3})\s+(?:[\d,]+|-+|\s+)*(?:([A-Z]{2})\s+)?(APROVADO|DISPENSADO|REPROVADO|TRANCADO|CANCELADO|MATRICULADO|MATR|APR|REP|TR|DISP|CANC)\b/gi;
    while ((match = patternStandard.exec(fullText)) !== null) {
      const code = match[1].toUpperCase();
      const name = match[2].trim();
      const ch = parseInt(match[3], 10);
      const grade = (match[4] || '').toUpperCase();
      const rawSit = match[5].toUpperCase();

      const isMatr = rawSit.includes('MATR');
      const situation = isMatr ? 'MATR' : rawSit.includes('APROV') || rawSit === 'APR' ? 'APR' : rawSit;
      const isCompleted = !isMatr && (situation.includes('APROV') || situation.includes('DISP') || ['SS', 'MS', 'MM', 'AP'].includes(grade));

      setOrUpdateDiscipline({
        code,
        name: name || code,
        workloadHours: ch,
        grade: grade || (isMatr ? '-' : undefined),
        situation,
        isCompleted,
      });
    }

    // Fallback de segurança: qualquer linha contendo código de disciplina acompanhado de MATR/MATRICULADO
    const patternMatrFallback = /(?:^|\n)[^\n\r]*?\b([A-Z]{3}\d{4})\b[^\n\r]*?\b(MATRICULADO|MATR)\b|(?:^|\n)[^\n\r]*?\b(MATRICULADO|MATR)\b[^\n\r]*?\b([A-Z]{3}\d{4})\b/gi;
    while ((match = patternMatrFallback.exec(fullText)) !== null) {
      const code = (match[1] || match[4] || '').toUpperCase();
      if (code) {
        const parsedName = extractPrecedingDisciplineName(fullText, match.index);
        setOrUpdateDiscipline({
          code,
          name: parsedName || code,
          workloadHours: 60,
          grade: '-',
          situation: 'MATR',
          isCompleted: false,
        });
      }
    }

    // 4. Casamento com o catálogo de currículos (curriculaCatalog)
    let matchedCurriculum: CurriculumStructure | undefined;
    const curricula = input.curriculaCatalog || [];

    if (curriculumCode && curricula.length > 0) {
      // Tenta correspondência exata de código (ex: "1741/1")
      matchedCurriculum = curricula.find((c) => c.code === curriculumCode);
      if (!matchedCurriculum) {
        const prefix = curriculumCode.split('/')[0];
        const candidates = curricula.filter((c) => c.code.startsWith(`${prefix}/`) || c.code.startsWith(prefix));

        // Prioridade 1: Carga horária total correspondente (ex: 3480h)
        if (input.defaultProfile?.chTotalCurriculo) {
          matchedCurriculum = candidates.find((c) => c.totalHours === input.defaultProfile?.chTotalCurriculo);
        }

        // Prioridade 2: Ano de criação compatível com ano de ingresso (<= ingresso)
        if (!matchedCurriculum && admissionYear) {
          const admYear = parseInt(admissionYear.split('.')[0], 10);
          if (!isNaN(admYear)) {
            const compatible = candidates.filter((c) => {
              const yr = c.createdYear ? parseInt(c.createdYear, 10) : undefined;
              return yr ? yr <= admYear : true;
            });
            if (compatible.length > 0) {
              matchedCurriculum = compatible[compatible.length - 1]; // Mais recente até o ingresso
            }
          }
        }

        if (!matchedCurriculum) {
          matchedCurriculum = candidates.find((c) => c.status === 'Ativa') || candidates[0];
        }
      }
    }

    // Se não encontrou por código de currículo, tenta por nome de curso normalizado
    if (!matchedCurriculum && courseName && curricula.length > 0) {
      const normCourse = normalizeName(courseName);
      const candidates = curricula.filter(
        (c) => normalizeName(c.courseName) === normCourse || normalizeName(c.courseName).includes(normCourse)
      );

      // Prioridade 1: Carga horária total correspondente
      if (input.defaultProfile?.chTotalCurriculo) {
        matchedCurriculum = candidates.find((c) => c.totalHours === input.defaultProfile?.chTotalCurriculo);
      }

      // Prioridade 2: Ano de ingresso compatível
      if (!matchedCurriculum && admissionYear) {
        const admYear = parseInt(admissionYear.split('.')[0], 10);
        if (!isNaN(admYear)) {
          const compatible = candidates.filter((c) => {
            const yr = c.createdYear ? parseInt(c.createdYear, 10) : undefined;
            return yr ? yr <= admYear : true;
          });
          if (compatible.length > 0) {
            matchedCurriculum = compatible[compatible.length - 1];
          }
        }
      }

      if (!matchedCurriculum) {
        matchedCurriculum = candidates.find((c) => c.status === 'Ativa') || candidates[0];
      }
    }

    // 5. Enriquecimento de nomes das disciplinas com o catálogo de currículos
    // a) Da matriz curricular correspondente (prioridade máxima)
    const matchedMap = new Map<string, string>();
    if (matchedCurriculum) {
      const allMatchedDiscs = [
        ...(matchedCurriculum.mandatoryDisciplines || []),
        ...(matchedCurriculum.electiveDisciplines || []),
        ...(matchedCurriculum.complementaryDisciplines || []),
      ];
      for (const d of allMatchedDiscs) {
        if (d.code && d.name) matchedMap.set(d.code, d.name);
      }
    }

    // b) De outras matrizes do mesmo curso (prioridade secundária, ex.: 1741/3 quando o aluno é 1741/1)
    const sameCourseMap = new Map<string, string>();
    const normCourse = courseName ? normalizeName(courseName) : '';
    for (const curr of curricula) {
      if (curr === matchedCurriculum) continue;
      if (normCourse && normalizeName(curr.courseName).includes(normCourse)) {
        for (const d of [
          ...(curr.mandatoryDisciplines || []),
          ...(curr.electiveDisciplines || []),
          ...(curr.complementaryDisciplines || []),
        ]) {
          if (d.code && d.name && !sameCourseMap.has(d.code)) {
            sameCourseMap.set(d.code, d.name);
          }
        }
      }
    }

    // c) De qualquer matriz do catálogo (fallback global para optativas/módulos livres de outros departamentos)
    const globalCatalogMap = new Map<string, string>();
    for (const curr of curricula) {
      if (curr === matchedCurriculum) continue;
      for (const d of [
        ...(curr.mandatoryDisciplines || []),
        ...(curr.electiveDisciplines || []),
        ...(curr.complementaryDisciplines || []),
      ]) {
        if (d.code && d.name && !globalCatalogMap.has(d.code)) {
          globalCatalogMap.set(d.code, d.name);
        }
      }
    }

    // Aplica os nomes enriquecidos:
    for (const [code, item] of completedMap.entries()) {
      const officialName =
        matchedMap.get(code) ||
        sameCourseMap.get(code) ||
        globalCatalogMap.get(code);

      if (officialName && (!item.name || item.name === item.code || matchedMap.has(code))) {
        item.name = officialName;
      }
    }

    const profile: StudentAcademicProfile = {
      matricula,
      studentName,
      courseName,
      degree: input.defaultProfile?.degree || 'Bacharelado',
      shift: input.defaultProfile?.shift || 'DIURNO',
      level,
      admissionYear,
      curriculumCode: curriculumCode || matchedCurriculum?.code,
      curriculumId: matchedCurriculum?.id,
      completedDisciplines: Array.from(completedMap.values()),
      manualCompletedCodes: input.defaultProfile?.manualCompletedCodes || [],
      manualUncompletedCodes: input.defaultProfile?.manualUncompletedCodes || [],
      updatedAt: new Date().toISOString(),
      ira,
      mp,
      chObrigatoriaPendente: input.defaultProfile?.chObrigatoriaPendente,
      chOptativaPendente: input.defaultProfile?.chOptativaPendente,
      chTotalCurriculo: input.defaultProfile?.chTotalCurriculo,
      chComplementarPendente: input.defaultProfile?.chComplementarPendente,
      percentualIntegralizado: input.defaultProfile?.percentualIntegralizado,
    };

    return {
      profile,
      matchedCurriculum,
    };
  }
}
