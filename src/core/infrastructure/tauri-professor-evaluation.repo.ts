import type { ProfessorEvaluation } from '../domain/entities/professor-evaluation';
import { parseProfessorEvaluationsCsv } from '../domain/entities/professor-evaluation';
import type { IProfessorEvaluationRepository } from '../domain/interfaces/professor-evaluation-repo.interface';
import { InMemoryProfessorEvaluationRepository } from './in-memory-professor-evaluation.repo';
import { getDatabase } from './sqlite-feed.repo';

let evaluationsTableCreated = false;
async function ensureEvaluationsTable(
  db: NonNullable<Awaited<ReturnType<typeof getDatabase>>>
) {
  if (!evaluationsTableCreated) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS professor_evaluations (
        id TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    evaluationsTableCreated = true;
  }
}

export class TauriProfessorEvaluationRepository
  implements IProfessorEvaluationRepository
{
  private fallbackRepo = new InMemoryProfessorEvaluationRepository();
  private cache: ProfessorEvaluation[] | null = null;

  async getEvaluations(forceRefresh = false): Promise<ProfessorEvaluation[]> {
    if (!forceRefresh && this.cache && this.cache.length > 0) {
      return this.cache;
    }

    const db = await getDatabase();
    if (!forceRefresh && db) {
      try {
        await ensureEvaluationsTable(db);
        const rows = await db.select<{ payload: string }[]>(
          'SELECT payload FROM professor_evaluations WHERE id = $1 LIMIT 1;',
          ['raw_evaluations']
        );
        if (rows && rows.length > 0) {
          const parsed = JSON.parse(rows[0].payload) as ProfessorEvaluation[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.cache = parsed;
            return parsed;
          }
        }
      } catch (e) {
        console.warn(
          '[TauriProfessorEvaluationRepository] Falha ao ler avaliações brutas do SQLite:',
          e
        );
      }
    }

    try {
      const { commands } = await import('@/core/infrastructure/bindings');
      const response = await commands.fetchProfessorEvaluationsCsv(
        Boolean(forceRefresh)
      );
      if (response.status === 'ok' && response.data) {
        const parsed = parseProfessorEvaluationsCsv(response.data);
        if (parsed.length > 0) {
          this.cache = parsed;
          if (db) {
            try {
              await ensureEvaluationsTable(db);
              await db.execute(
                `INSERT INTO professor_evaluations (id, payload, updated_at) VALUES ($1, $2, $3)
                 ON CONFLICT(id) DO UPDATE SET payload = $2, updated_at = $3;`,
                [
                  'raw_evaluations',
                  JSON.stringify(parsed),
                  new Date().toISOString(),
                ]
              );
            } catch (e) {
              console.warn(
                '[TauriProfessorEvaluationRepository] Falha ao persistir avaliações brutas no SQLite:',
                e
              );
            }
          }
          return parsed;
        }
      }
    } catch {
      // Degradação elegante com fallback web / memória
    }

    const fallback = await this.fallbackRepo.getEvaluations(forceRefresh);
    if (fallback.length > 0) {
      this.cache = fallback;
    }
    return fallback;
  }

  async getPersistedEnrichedEvaluations(): Promise<ProfessorEvaluation[] | null> {
    const db = await getDatabase();
    if (db) {
      try {
        await ensureEvaluationsTable(db);
        const rows = await db.select<{ payload: string }[]>(
          'SELECT payload FROM professor_evaluations WHERE id = $1 LIMIT 1;',
          ['enriched_evaluations']
        );
        if (rows && rows.length > 0) {
          const parsed = JSON.parse(rows[0].payload) as ProfessorEvaluation[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn(
          '[TauriProfessorEvaluationRepository] Falha ao ler avaliações enriquecidas do SQLite:',
          e
        );
      }
    }
    return null;
  }

  async savePersistedEnrichedEvaluations(
    evaluations: ProfessorEvaluation[]
  ): Promise<void> {
    const db = await getDatabase();
    if (db) {
      try {
        await ensureEvaluationsTable(db);
        await db.execute(
          `INSERT INTO professor_evaluations (id, payload, updated_at) VALUES ($1, $2, $3)
           ON CONFLICT(id) DO UPDATE SET payload = $2, updated_at = $3;`,
          [
            'enriched_evaluations',
            JSON.stringify(evaluations),
            new Date().toISOString(),
          ]
        );
      } catch (e) {
        console.warn(
          '[TauriProfessorEvaluationRepository] Falha ao salvar avaliações enriquecidas no SQLite:',
          e
        );
      }
    }
  }

  async clearPersistedEvaluations(): Promise<void> {
    this.cache = null;
    await this.fallbackRepo.clearPersistedEvaluations?.();
    const db = await getDatabase();
    if (db) {
      try {
        await ensureEvaluationsTable(db);
        await db.execute(
          'DELETE FROM professor_evaluations WHERE id IN ($1, $2);',
          ['raw_evaluations', 'enriched_evaluations']
        );
      } catch (e) {
        console.warn(
          '[TauriProfessorEvaluationRepository] Falha ao limpar avaliações do SQLite:',
          e
        );
      }
    }
  }
}
