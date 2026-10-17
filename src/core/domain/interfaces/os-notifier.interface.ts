export interface OSNotificationPayload {
  title: string;
  body: string;
}

/**
 * Porta para notificações do sistema operacional. Em ambiente sem Tauri a
 * implementação é no-op (NullNotifier).
 */
export interface IOSNotifier {
  /** Garante a permissão do SO; false = sem suporte ou permissão negada. */
  ensurePermission(): Promise<boolean>;
  notify(payload: OSNotificationPayload): Promise<void>;
}
