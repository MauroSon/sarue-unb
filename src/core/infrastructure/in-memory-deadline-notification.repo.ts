import type { IDeadlineNotificationRepository } from '../domain/interfaces/deadline-notification-repo.interface';

export class InMemoryDeadlineNotificationRepository
  implements IDeadlineNotificationRepository
{
  private keys = new Set<string>();

  async getNotifiedKeys(): Promise<string[]> {
    return Array.from(this.keys);
  }

  async markNotified(key: string): Promise<void> {
    this.keys.add(key);
  }

  async clear(): Promise<void> {
    this.keys.clear();
  }
}
