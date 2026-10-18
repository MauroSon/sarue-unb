import type { IraScenario } from '../entities/ira-scenario';

/**
 * Persistência local do cenário da Calculadora de IRA. O cenário é dado do
 * aluno no próprio dispositivo (mesmo princípio local-first do perfil).
 */
export interface IIraScenarioRepository {
  getScenario(): Promise<IraScenario | null>;
  saveScenario(scenario: IraScenario): Promise<void>;
  clearScenario(): Promise<void>;
}
