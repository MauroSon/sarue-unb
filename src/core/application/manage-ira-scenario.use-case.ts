import type { IraScenario } from '../domain/entities/ira-scenario';
import type { IIraScenarioRepository } from '../domain/interfaces/ira-scenario-repo.interface';

/**
 * Ciclo de vida do cenário da Calculadora de IRA: ler o cenário salvo, salvá-lo
 * (auto-save com debounce na tela) e limpá-lo ao restaurar o histórico real.
 */
export class ManageIraScenarioUseCase {
  constructor(private repo: IIraScenarioRepository) {}

  async get(): Promise<IraScenario | null> {
    return this.repo.getScenario();
  }

  async save(scenario: IraScenario): Promise<void> {
    await this.repo.saveScenario({ ...scenario, updatedAt: new Date().toISOString() });
  }

  async clear(): Promise<void> {
    await this.repo.clearScenario();
  }
}
