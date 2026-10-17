import type {
  IOSNotifier,
  OSNotificationPayload,
} from '../domain/interfaces/os-notifier.interface';

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * Adaptador do plugin oficial de notificação do Tauri. A importação é
 * preguiçosa para não quebrar a prévia web (fora do runtime Tauri).
 */
export class TauriOSNotifier implements IOSNotifier {
  async ensurePermission(): Promise<boolean> {
    if (!isTauriEnvironment()) return false;
    try {
      const { isPermissionGranted, requestPermission } = await import(
        '@tauri-apps/plugin-notification'
      );
      if (await isPermissionGranted()) return true;
      return (await requestPermission()) === 'granted';
    } catch (e) {
      console.warn('Não foi possível verificar permissão de notificação:', e);
      return false;
    }
  }

  async notify(payload: OSNotificationPayload): Promise<void> {
    if (!isTauriEnvironment()) return;
    try {
      const { isPermissionGranted, sendNotification } = await import(
        '@tauri-apps/plugin-notification'
      );
      if (await isPermissionGranted()) {
        await sendNotification(payload);
      }
    } catch (e) {
      console.warn('Falha ao enviar notificação do sistema:', e);
    }
  }
}

/** No-op para prévia web e testes. */
export class NullNotifier implements IOSNotifier {
  async ensurePermission(): Promise<boolean> {
    return false;
  }

  async notify(): Promise<void> {
    // Sem SO, sem notificação.
  }
}
