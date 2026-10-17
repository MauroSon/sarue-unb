/**
 * Memória de deduplicação das notificações de prazo: garante que cada tarefa
 * avise no máximo uma vez por marco (`itemId:marco`).
 */
export interface IDeadlineNotificationRepository {
  getNotifiedKeys(): Promise<string[]>;
  markNotified(key: string): Promise<void>;
  clear(): Promise<void>;
}
