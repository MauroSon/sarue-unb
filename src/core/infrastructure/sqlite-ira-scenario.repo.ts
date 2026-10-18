import type { IraScenario } from '../domain/entities/ira-scenario';
import type { IIraScenarioRepository } from '../domain/interfaces/ira-scenario-repo.interface';
import { InMemoryIraScenarioRepository } from './in-memory-ira-scenario.repo';

import type Database from '@tauri-apps/plugin-sql';

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

const SCENARIO_ROW_ID = 'current';

// Cache global da conexão (mesmo banco sarue_unb.db do feed)
let cachedDbPromise: Promise<Database | null> | null = null;

// Espelho em memória para ambientes sem Tauri (prévia web e testes)
const fallbackRepo = new InMemoryIraScenarioRepository();

async function getDatabase(): Promise<Database | null> {
  if (!isTauriEnvironment()) return null;

  if (!cachedDbPromise) {
    cachedDbPromise = (async () => {
      try {
        const { default: Database } = await import('@tauri-apps/plugin-sql');
        const db = await Database.load('sqlite:sarue_unb.db');
        await db.execute(`
          CREATE TABLE IF NOT EXISTS ira_scenario (
            id TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
        return db;
      } catch (e) {
        console.warn('[SqliteIraScenarioRepository] Banco indisponível, usando memória:', e);
        return null;
      }
    })();
  }

  return cachedDbPromise;
}

export class SqliteIraScenarioRepository implements IIraScenarioRepository {
  async getScenario(): Promise<IraScenario | null> {
    const db = await getDatabase();
    if (!db) return fallbackRepo.getScenario();

    try {
      const result = await db.select<{ payload: string }[]>(
        'SELECT payload FROM ira_scenario WHERE id = $1 LIMIT 1;',
        [SCENARIO_ROW_ID],
      );
      if (result && result.length > 0) {
        return JSON.parse(result[0].payload) as IraScenario;
      }
      return null;
    } catch (e) {
      console.warn('[SqliteIraScenarioRepository] Falha ao ler cenário:', e);
      return fallbackRepo.getScenario();
    }
  }

  async saveScenario(scenario: IraScenario): Promise<void> {
    const db = await getDatabase();
    if (!db) return fallbackRepo.saveScenario(scenario);

    const payload = JSON.stringify(scenario);
    try {
      await db.execute(
        `INSERT INTO ira_scenario (id, payload, updated_at) VALUES ($1, $2, $3)
         ON CONFLICT(id) DO UPDATE SET payload = $2, updated_at = $3;`,
        [SCENARIO_ROW_ID, payload, scenario.updatedAt],
      );
    } catch (e) {
      console.warn('[SqliteIraScenarioRepository] Falha ao salvar cenário:', e);
      await fallbackRepo.saveScenario(scenario);
    }
  }

  async clearScenario(): Promise<void> {
    const db = await getDatabase();
    if (!db) return fallbackRepo.clearScenario();

    try {
      await db.execute('DELETE FROM ira_scenario WHERE id = $1;', [SCENARIO_ROW_ID]);
    } catch (e) {
      console.warn('[SqliteIraScenarioRepository] Falha ao limpar cenário:', e);
    }
    await fallbackRepo.clearScenario();
  }
}
