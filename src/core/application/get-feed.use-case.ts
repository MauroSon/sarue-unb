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

    // Garante que o feed sempre seja entregue ordenado cronologicamente
    return [...items].sort((a, b) => {
      // Se ambos forem tarefas com prazo definido, ordena por prazo mais próximo primeiro
      if (a.itemType === 'assignment' && b.itemType === 'assignment' && a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      // Ordenação padrão por createdAt decrescente
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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

