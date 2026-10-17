import type { FeedItem } from './feed-item';

/**
 * Marcos fixos de notificação de prazo: cada tarefa cruza cada marco no
 * máximo uma vez. A deduplicação vive em IDeadlineNotificationRepository.
 */
export type DeadlineMarco = '48h' | '24h' | 'atrasada';

/** Urgência calculada, define a seção do painel de prazos. */
export type DeadlineUrgency = 'overdue' | 'today' | 'tomorrow' | 'week';

export interface DeadlineEntry {
  item: FeedItem;
  /** Horas até o prazo no momento da avaliação; negativo significa atrasada. */
  hoursRemaining: number;
  urgency: DeadlineUrgency;
  /** Marcos já cruzados por esta tarefa nesta avaliação. */
  enteredMarcos: DeadlineMarco[];
}
