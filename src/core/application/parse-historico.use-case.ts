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

    // Padrão 1 (UnB oficial comprimido do iText): 08 APRCIC0004 90 90,0 MS
    // Suporta notas com sufixos comuns do histórico: SS*, MSe, --#, MI& etc.
    const patternCompact = /(APR|REP|TR|MATR|DISP|CANC)([A-Z]{3}\d{4})\s+(\d+)\s+([\d,]+|-+)\s+([A-Z0-9&*\-–#e]+)/g;
    let match: RegExpExecArray | null;
    while ((match = patternCompact.exec(fullText)) !== null) {
      const situation = match[1];
      const code = match[2].toUpperCase();
      const ch = parseInt(match[3], 10);
      const rawGrade = match[5].trim();
      const cleanGrade = rawGrade.replace(/[^A-Z0-9-]/gi, '').toUpperCase();

      const isCompleted = situation === 'APR'
        || situation === 'DISP'
        || ['SS', 'MS', 'MM', 'AP', 'CC'].some(g => cleanGrade.startsWith(g));

      const existing = completedMap.get(code);
      if (!existing || (!existing.isCompleted && isCompleted) || (existing.situation !== 'APR' && situation === 'APR')) {
        completedMap.set(code, {
          code,
          name: code,
          workloadHours: ch,
          grade: cleanGrade || rawGrade,
          situation,
          isCompleted,
        });
      }
    }

    // Padrão 2 (Tabelado ou padrão com código separado): [A-Z]{3}\d{4} ... APROVADO|DISPENSADO
    const patternStandard = /([A-Z]{3}\d{4})\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s0-9–-]+?)\s+(\d{2,3})\s+(?:\d{2}\s+)?([A-Z]{2})\s+(APROVADO|DISPENSADO|REPROVADO|TRANCADO|MATRICULADO)/gi;
    while ((match = patternStandard.exec(fullText)) !== null) {
      const code = match[1].toUpperCase();
      const name = match[2].trim();
      const ch = parseInt(match[3], 10);
      const grade = match[4].toUpperCase();
      const situation = match[5].toUpperCase();
      const isCompleted = situation.includes('APROV') || situation.includes('DISP') || ['SS', 'MS', 'MM', 'AP'].includes(grade);

      const existing = completedMap.get(code);
      if (!existing || (!existing.isCompleted && isCompleted)) {
        completedMap.set(code, {
          code,
          name: name || code,
          workloadHours: ch,
          grade,
          situation,
          isCompleted,
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

    // Se encontramos a matriz curricular, enriquece o nome das disciplinas cursadas
    if (matchedCurriculum) {
      const allDiscs = [
        ...(matchedCurriculum.mandatoryDisciplines || []),
        ...(matchedCurriculum.electiveDisciplines || []),
        ...(matchedCurriculum.complementaryDisciplines || []),
      ];
      const discMap = new Map<string, string>();
      for (const d of allDiscs) {
        discMap.set(d.code, d.name);
      }

      for (const [code, item] of completedMap.entries()) {
        const officialName = discMap.get(code);
        if (officialName) {
          item.name = officialName;
        }
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
