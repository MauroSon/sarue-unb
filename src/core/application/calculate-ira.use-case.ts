import type { IraScenario, IraScenarioDiscipline } from '../domain/entities/ira-scenario';
import { IRA_MENTION_VALUES } from '../domain/entities/ira-scenario';

export interface IraCalculation {
  /** IRA final na escala 0–5; null quando nenhuma linha tem menção e créditos. */
  ira: number | null;
  /** Σ(menção × créditos) das linhas com menção. */
  weightedSum: number;
  /** Σ créditos das linhas com menção. */
  creditsSum: number;
  /** N = nº de disciplinas com menção (denominador da penalidade de trancamento). */
  mentionCount: number;
  trancadasObrigatorias: number;
  trancadasOptativas: number;
  /** Fator (1 − penalidade) aplicado por trancamentos; 1 quando não há trancamentos. */
  trancamentoFactor: number;
  /** IRA por semestre (média ponderada das menções, sem penalidade), por semesterId. */
  semesterIras: Record<string, number | null>;
}

/**
 * Calcula o IRA segundo a fórmula oficial da UnB — a mesma lógica do IRA.xlsx
 * de referência, na forma normalizada:
 *
 *   IRA = (1 − (0,6·TO + 0,4·TOPT) / (N + TO + TOPT)) × Σ(menção × créditos) / Σ(créditos)
 *
 * TO = disciplinas obrigatórias trancadas; TOPT = optativas/complementares
 * trancadas; N = disciplinas cursadas com menção. A planilha original dividia
 * por uma soma com multiplicadores por semestre (bug de montagem); aqui o
 * denominador é a soma simples dos créditos, que mantém o resultado na escala
 * 0–5. Linhas sem menção (ex.: cursando agora, sem previsão) ficam fora de
 * todos os somatórios.
 */
export class CalculateIraUseCase {
  execute(scenario: IraScenario): IraCalculation {
    const allDisciplines: IraScenarioDiscipline[] = scenario.semesters.flatMap(
      (s) => s.disciplines,
    );

    const withMention = allDisciplines.filter(
      (d) => d.mention != null && d.credits >= 0,
    );

    let weightedSum = 0;
    let creditsSum = 0;
    for (const d of withMention) {
      weightedSum += (IRA_MENTION_VALUES[d.mention as keyof typeof IRA_MENTION_VALUES] ?? 0) * d.credits;
      creditsSum += d.credits;
    }

    // O ajuste do aluno pode descontar trancamentos do histórico (extra
    // negativo); o total efetivo nunca fica abaixo de zero.
    const trancadasObrigatorias = Math.max(
      0,
      scenario.baseTrancadasObrigatorias + scenario.extraTrancadasObrigatorias,
    );
    const trancadasOptativas = Math.max(
      0,
      scenario.baseTrancadasOptativas + scenario.extraTrancadasOptativas,
    );

    const penaltyDenominator =
      withMention.length + trancadasObrigatorias + trancadasOptativas;
    const trancamentoFactor =
      penaltyDenominator > 0
        ? 1 -
          (0.6 * trancadasObrigatorias + 0.4 * trancadasOptativas) /
            penaltyDenominator
        : 1;

    const ira =
      withMention.length > 0 && creditsSum > 0
        ? trancamentoFactor * (weightedSum / creditsSum)
        : null;

    // IRA por semestre: média ponderada das menções do semestre, sem a
    // penalidade global de trancamento (que é uma penalidade do curso inteiro).
    const semesterIras: Record<string, number | null> = {};
    for (const semester of scenario.semesters) {
      let semWeighted = 0;
      let semCredits = 0;
      for (const d of semester.disciplines) {
        if (d.mention != null && d.credits >= 0) {
          semWeighted += (IRA_MENTION_VALUES[d.mention] ?? 0) * d.credits;
          semCredits += d.credits;
        }
      }
      semesterIras[semester.id] =
        semester.disciplines.length > 0 && semCredits > 0 ? semWeighted / semCredits : null;
    }

    return {
      ira,
      weightedSum,
      creditsSum,
      mentionCount: withMention.length,
      trancadasObrigatorias,
      trancadasOptativas,
      trancamentoFactor,
      semesterIras,
    };
  }
}
