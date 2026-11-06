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
  /**
   * Define o contador numérico de notificações no ícone do aplicativo
   * (macOS Dock, Linux Unity/D-Bus e Windows Taskbar Overlay Icon).
   * Valores nulos, indefinidos ou <= 0 removem o badge/overlay.
   * Não deve lançar exceções; erros de plataforma são tratados no adaptador.
   */
  setBadgeCount(count?: number | null): Promise<void>;
}
