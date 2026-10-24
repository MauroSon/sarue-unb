/**
 * Log de depuração da sessão de diagnóstico: além do console do webview,
 * espelha a mensagem para o terminal via comando Rust `debug_log` — assim
 * boot da página e etapas da sync ficam intercalados com os logs do Rust.
 */
export function logDebug(message: string): void {
  console.log(`[SARUE] ${message}`);
  void import('@/core/infrastructure/bindings')
    .then(({ commands }) => commands.debugLog(message))
    .catch(() => {
      // Fora do Tauri (dev no browser): só o console mesmo.
    });
}
