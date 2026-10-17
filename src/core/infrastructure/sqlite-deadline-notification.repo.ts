import type { IDeadlineNotificationRepository } from '../domain/interfaces/deadline-notification-repo.interface';
import { getDatabase } from './sqlite-feed.repo';

interface SqliteDeadlineRow {
  item_id: string;
  marco: string;
  notified_at: string;
}

const inMemoryKeys = new Set<string>();

function keyToRow(key: string): { itemId: string; marco: string } {
  const sep = key.lastIndexOf(':');
  return sep === -1
    ? { itemId: key, marco: '' }
    : { itemId: key.slice(0, sep), marco: key.slice(sep + 1) };
}

/**
 * Deduplicação de notificações de prazo no mesmo SQLite local do feed
 * (`deadline_notifications`), com espelho em memória para prévia web.
 */
export class SqliteDeadlineNotificationRepository
  implements IDeadlineNotificationRepository
{
  private async ensureTable(db: NonNullable<Awaited<ReturnType<typeof getDatabase>>>) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS deadline_notifications (
        item_id TEXT NOT NULL,
        marco TEXT NOT NULL,
        notified_at TEXT NOT NULL,
        PRIMARY KEY (item_id, marco)
      );
    `);
  }

  async getNotifiedKeys(): Promise<string[]> {
    const db = await getDatabase();
    if (db) {
      try {
        await this.ensureTable(db);
        const rows: SqliteDeadlineRow[] = await db.select(
          'SELECT item_id, marco, notified_at FROM deadline_notifications',
        );
        for (const row of rows) {
          inMemoryKeys.add(`${row.item_id}:${row.marco}`);
        }
      } catch (e) {
        console.warn('Erro ao carregar notificações de prazo no SQLite:', e);
      }
    }
    return Array.from(inMemoryKeys);
  }

  async markNotified(key: string): Promise<void> {
    inMemoryKeys.add(key);

    const db = await getDatabase();
    if (db) {
      try {
        await this.ensureTable(db);
        const { itemId, marco } = keyToRow(key);
        await db.execute(
          'INSERT OR REPLACE INTO deadline_notifications (item_id, marco, notified_at) VALUES ($1, $2, $3)',
          [itemId, marco, new Date().toISOString()],
        );
      } catch (e) {
        console.warn('Erro ao registrar notificação de prazo no SQLite:', e);
      }
    }
  }

  async clear(): Promise<void> {
    inMemoryKeys.clear();

    const db = await getDatabase();
    if (db) {
      try {
        await db.execute('DELETE FROM deadline_notifications');
      } catch (e) {
        console.warn('Erro ao limpar notificações de prazo no SQLite:', e);
      }
    }
  }
}
