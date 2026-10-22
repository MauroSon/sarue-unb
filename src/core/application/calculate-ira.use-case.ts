import type { IraScenario, IraScenarioDiscipline } from '../domain/entities/ira-scenario';
import { IRA_MENTION_VALUES } from '../domain/entities/ira-scenario';

export interface IraCalculation {
  /** IRA final na escala 0–5 (com fator de correção aplicado se houver); null quando nenhuma linha tem menção e créditos. */
  ira: number | null;
  /** IRA bruto da fórmula UnB CEG 0001/2020 sem fator de correção. */
  rawIra: number | null;
  /** Fator/offset de correção aplicado com base no histórico oficial do SIGAA. */
  correctionOffset: number;
  /** Σ(menção × créditos × pesoSemestre) das linhas com menção. */
  weightedSum: number;
  /** Σ créditos reais das linhas com menção (para exibição na UI). */
  creditsSum: number;
  /** Σ(créditos × pesoSemestre) das linhas com menção (denominador da fórmula). */
  weightedCreditsSum: number;
  /** N = nº de disciplinas com menção. */
  mentionCount: number;
  trancadasObrigatorias: number;
  trancadasOptativas: number;
  /** IRA por semestre (média ponderada das menções, sem penalidade), por semesterId. */
  semesterIras: Record<string, number | null>;
}

/**
 * Calcula o IRA segundo a fórmula oficial da UnB (Resolução CEG nº 0001/2020):
 *
 *   IRA = Σ(menção × créditos × pesoSemestre) / Σ(créditos × pesoSemestre)
 *
 * Onde pesoSemestre = min(6, semestre), atribuindo peso progressivo de 1 a 6
 * aos períodos regulares. Conforme a Resolução CEPE nº 093/2018, trancamentos
 * (TR / TGM) não afetam nem penalizam mais o IRA na UnB.
 *
 * Suporta opcionalmente um `correctionOffset` derivado da diferença entre o IRA
 * oficial reportado pelo SIGAA no histórico e o IRA bruto calculado, garantindo
 * alinhamento exato para simulações futuras.
 */
export class CalculateIraUseCase {
  execute(scenario: IraScenario, correctionOffset = 0): IraCalculation {
    let weightedSum = 0;
    let rawCreditsSum = 0;
    let weightedCreditsSum = 0;
    let mentionCount = 0;

    const semesterIras: Record<string, number | null> = {};

    // Identifica semestres de histórico, atual e futuros para indexação progressiva contínua
    const historySemesters = scenario.semesters.filter((s) => s.kind === 'history');
    const hasCurrent = scenario.semesters.some((s) => s.kind === 'current');
    const futureSemesters = scenario.semesters.filter((s) => s.kind === 'future');

    scenario.semesters.forEach((semester, sIdx) => {
      let semesterIndex = 1;

      if (semester.kind === 'history') {
        const match = semester.label?.match(/^(\d+)º/);
        semesterIndex = match ? parseInt(match[1], 10) : sIdx + 1;
      } else if (semester.kind === 'current') {
        semesterIndex = Math.max(1, historySemesters.length + 1);
      } else if (semester.kind === 'future') {
        const futureIdx = futureSemesters.indexOf(semester);
        semesterIndex = Math.max(1, historySemesters.length + (hasCurrent ? 1 : 0) + (futureIdx >= 0 ? futureIdx + 1 : 1));
      } else {
        semesterIndex = Math.max(1, sIdx + 1);
      }

      const semesterWeight = Math.min(6, Math.max(1, semesterIndex));

      let semWeighted = 0;
      let semCredits = 0;

      for (const d of semester.disciplines) {
        if (d.mention != null && d.credits >= 0) {
          const mentionVal = IRA_MENTION_VALUES[d.mention as keyof typeof IRA_MENTION_VALUES] ?? 0;
          weightedSum += mentionVal * d.credits * semesterWeight;
          weightedCreditsSum += d.credits * semesterWeight;
          rawCreditsSum += d.credits;
          mentionCount += 1;

          semWeighted += mentionVal * d.credits;
          semCredits += d.credits;
        }
      }

      semesterIras[semester.id] =
        semester.disciplines.length > 0 && semCredits > 0 ? semWeighted / semCredits : null;
    });

    // Contadores de trancamento mantidos apenas para visualização e dados informativos;
    // pela Resolução CEPE nº 093/2018, o trancamento não aplica mais penalidade ao IRA.
    const trancadasObrigatorias = Math.max(
      0,
      scenario.baseTrancadasObrigatorias + scenario.extraTrancadasObrigatorias,
    );
    const trancadasOptativas = Math.max(
      0,
      scenario.baseTrancadasOptativas + scenario.extraTrancadasOptativas,
    );

    const rawIra =
      mentionCount > 0 && weightedCreditsSum > 0
        ? weightedSum / weightedCreditsSum
        : null;

    const ira =
      rawIra != null
        ? Math.max(0, Math.min(5, Number((rawIra + correctionOffset).toFixed(4))))
        : null;

    return {
      ira,
      rawIra,
      correctionOffset,
      weightedSum,
      creditsSum: rawCreditsSum,
      weightedCreditsSum,
      mentionCount,
      trancadasObrigatorias,
      trancadasOptativas,
      semesterIras,
    };
  }
}
