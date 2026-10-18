import type {
  CompletedDiscipline,
  StudentAcademicProfile,
} from '../domain/entities/academic-profile';
import type { CurriculumStructure } from '../domain/entities/course';
import type {
  IraDisciplineNature,
  IraMention,
  IraScenario,
  IraScenarioDiscipline,
  IraScenarioSemester,
} from '../domain/entities/ira-scenario';
import { IRA_MENTIONS } from '../domain/entities/ira-scenario';

const VALID_MENTIONS = new Set<string>(IRA_MENTIONS);
const PERIOD_PATTERN = /^\d{4}\.[12]$/;

/** Horas por crédito na UnB: 1 crédito = 15 horas. */
export function creditsFromWorkload(workloadHours: number | undefined): number {
  if (!workloadHours || workloadHours <= 0) return 0;
  return Math.round((workloadHours / 15) * 100) / 100;
}

function normalizeMention(grade?: string): IraMention | null {
  const raw = (grade || '').trim().toUpperCase();
  return VALID_MENTIONS.has(raw) ? (raw as IraMention) : null;
}

/**
 * Monta o cenário inicial da calculadora a partir do perfil acadêmico
 * sincronizado do SIGAA:
 *
 * - disciplinas cursadas (APR/REP/DISP) viram linhas agrupadas por período
 *   letivo, ordenadas do mais antigo para o mais recente;
 * - trancadas (TR) não viram linhas — viram contadores de trancamento,
 *   classificados pela natureza na matriz (sem correspondência, contam como
 *   optativas, a penalidade mais leve);
 * - cursando agora (MATR) vira o bloco "Cursando agora" com menção vazia
 *   (o aluno prevê a menção do semestre corrente, como no passo 3 do Excel);
 * - disciplinas sem período identificável caem em "Semestre não identificado".
 */
/**
 * Assinatura do conteúdo do histórico (código, menção, situação, período e
 * carga de cada disciplina): muda quando o SIGAA traz dado novo, não quando o
 * perfil é apenas ressincronizado igual.
 */
export function scenarioProfileSignature(profile: StudentAcademicProfile): string {
  return JSON.stringify([
    (profile.completedDisciplines || []).map((d) => [
      d.code,
      d.grade,
      d.situation,
      d.period,
      d.workloadHours,
    ]),
    profile.trancadaEvents || [],
  ]);
}

export class BuildIraScenarioUseCase {
  execute(profile: StudentAcademicProfile, curriculum?: CurriculumStructure | null): IraScenario {
    const natureByCode = new Map<string, IraDisciplineNature>();
    if (curriculum) {
      const push = (list: { code: string; nature: string }[] | undefined) => {
        for (const d of list || []) {
          if (d.code && !natureByCode.has(d.code)) {
            natureByCode.set(d.code, d.nature as IraDisciplineNature);
          }
        }
      };
      push(curriculum.mandatoryDisciplines as never);
      push(curriculum.electiveDisciplines as never);
      push(curriculum.complementaryDisciplines as never);
    }

    const historyByPeriod = new Map<string, IraScenarioDiscipline[]>();
    const unknownPeriod: IraScenarioDiscipline[] = [];
    const currentSemester: IraScenarioDiscipline[] = [];
    let trancadasObrigatorias = 0;
    let trancadasOptativas = 0;

    const countTrancada = (code: string) => {
      if (natureByCode.get(code) === 'Obrigatória') {
        trancadasObrigatorias += 1;
      } else {
        trancadasOptativas += 1;
      }
    };

    // Eventos de trancamento (um por ocorrência no histórico, mesmo que a
    // disciplina tenha sido aprovada depois). Perfis antigos, sem eventos,
    // caem no fallback pelas trancadas vigentes.
    if (profile.trancadaEvents && profile.trancadaEvents.length > 0) {
      for (const ev of profile.trancadaEvents) {
        countTrancada(ev.code);
      }
    }

    const toDiscipline = (entry: CompletedDiscipline): IraScenarioDiscipline => {
      const workloadHours =
        entry.workloadHours ??
        // Fallback: carga horária da matriz quando o histórico não traz a hora
        lookupWorkload(curriculum, entry.code);
      return {
        id: entry.code,
        code: entry.code,
        name: entry.name || entry.code,
        credits: creditsFromWorkload(workloadHours),
        workloadHours,
        mention: entry.situation === 'MATR' ? null : normalizeMention(entry.grade),
        nature: natureByCode.get(entry.code),
        origin: 'history',
      };
    };

    for (const entry of profile.completedDisciplines || []) {
      const situation = (entry.situation || '').toUpperCase();

      if (situation === 'TR' || situation.startsWith('TRANC')) {
        if (!profile.trancadaEvents || profile.trancadaEvents.length === 0) {
          countTrancada(entry.code);
        }
        continue;
      }

      if (situation === 'CANC') continue;

      if (situation === 'MATR') {
        currentSemester.push(toDiscipline(entry));
        continue;
      }

      const discipline = toDiscipline(entry);
      const period = (entry.period || '').trim();
      if (PERIOD_PATTERN.test(period)) {
        const bucket = historyByPeriod.get(period) || [];
        bucket.push(discipline);
        historyByPeriod.set(period, bucket);
      } else {
        unknownPeriod.push(discipline);
      }
    }

    const semesters: IraScenarioSemester[] = [];

    const sortedPeriods = [...historyByPeriod.keys()].sort();
    sortedPeriods.forEach((period, index) => {
      semesters.push({
        id: `history:${period}`,
        label: `${index + 1}º Semestre`,
        period,
        kind: 'history',
        disciplines: historyByPeriod.get(period) || [],
      });
    });

    if (unknownPeriod.length > 0) {
      semesters.push({
        id: 'unknown',
        label: 'Semestre não identificado',
        kind: 'unknown',
        disciplines: unknownPeriod,
      });
    }

    if (currentSemester.length > 0) {
      semesters.push({
        id: 'current',
        label: 'Cursando agora',
        kind: 'current',
        disciplines: currentSemester,
      });
    }

    return {
      semesters,
      baseTrancadasObrigatorias: trancadasObrigatorias,
      baseTrancadasOptativas: trancadasOptativas,
      extraTrancadasObrigatorias: 0,
      extraTrancadasOptativas: 0,
      profileSignature: scenarioProfileSignature(profile),
      updatedAt: new Date().toISOString(),
    };
  }
}

function lookupWorkload(
  curriculum: CurriculumStructure | undefined | null,
  code: string,
): number | undefined {
  if (!curriculum) return undefined;
  const all = [
    ...(curriculum.mandatoryDisciplines || []),
    ...(curriculum.electiveDisciplines || []),
    ...(curriculum.complementaryDisciplines || []),
  ];
  return all.find((d) => d.code === code)?.workloadHours;
}
