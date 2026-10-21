import type { FeedItem } from '../domain/entities/feed-item';
import type { IFeedRepository, FeedFilterOptions } from '../domain/interfaces/feed-repo.interface';
import type { IDeadlineNotificationRepository } from '../domain/interfaces/deadline-notification-repo.interface';

export class GetFeedUseCase {
  constructor(
    private readonly feedRepo: IFeedRepository,
    private readonly deadlineRepo?: IDeadlineNotificationRepository,
  ) {}

  async execute(filters?: FeedFilterOptions): Promise<FeedItem[]> {
    const items = await this.feedRepo.getItems(filters);

    // Garante que o feed sempre seja entregue ordenado rigorosamente dos mais recentes para os mais antigos
    return [...items].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      if (timeB !== timeA) {
        return timeB - timeA;
      }
      return b.id.localeCompare(a.id);
    });
  }

  async markAsCompleted(id: string, isCompleted: boolean): Promise<void> {
    await this.feedRepo.markItemAsCompleted(id, isCompleted);
  }

  async archiveItem(id: string, isArchived: boolean = true): Promise<void> {
    await this.feedRepo.archiveItem(id, isArchived);
  }

  async clear(): Promise<void> {
    await this.feedRepo.clear();
    // Itens sumiram do feed: a memória de marcos notificados zera junto.
    await this.deadlineRepo?.clear();
  }
}

