/**
 * Módulo de Acessibilidade da Interface
 *
 * Persistência e aplicação das preferências de acessibilidade do app:
 * zoom da interface (via WebView do Tauri, com fallback CSS no navegador)
 * e redução de animações (MotionConfig + classe global no <html>).
 *
 * Molde: lib/sound-effects.ts — mesma estratégia de chave no localStorage
 * e guard de ambiente do Tauri (`__TAURI_INTERNALS__`, como useAutostart).
 */

const UI_ZOOM_KEY = 'sarue_ui_zoom';
const REDUCED_MOTION_KEY = 'sarue_reduced_motion';

/** Paradas de zoom da interface: de 90% a 120%, em passos de 5%. */
export type UiZoom = 0.9 | 0.95 | 1 | 1.05 | 1.1 | 1.15 | 1.2;

export const UI_ZOOM_MIN_PERCENT = 90;
export const UI_ZOOM_MAX_PERCENT = 120;
export const UI_ZOOM_STEP_PERCENT = 5;

export const UI_ZOOM_VALUES: UiZoom[] = [
  0.9, 0.95, 1, 1.05, 1.1, 1.15, 1.2,
];

export const DEFAULT_UI_ZOOM: UiZoom = 1;

function isUiZoom(value: unknown): value is UiZoom {
  return UI_ZOOM_VALUES.includes(value as UiZoom);
}

/** Lê o zoom salvo. Sem valor salvo (ou valor inválido), 100%. */
export function getUiZoom(): UiZoom {
  try {
    const parsed = Number(localStorage.getItem(UI_ZOOM_KEY));
    return isUiZoom(parsed) ? parsed : DEFAULT_UI_ZOOM;
  } catch {
    return DEFAULT_UI_ZOOM;
  }
}

/**
 * Persiste e aplica o zoom da interface via CSS zoom no <body> (variável
 * `--app-zoom`, com altura compensada no index.css para o app ocupar
 * exatamente a viewport em qualquer parada). Um caminho só para Tauri e
 * navegador — não usa o setZoom nativo do WebView, que já apresentou
 * race condition no Windows.
 */
export function applyUiZoom(zoom: UiZoom): void {
  try {
    localStorage.setItem(UI_ZOOM_KEY, String(zoom));
  } catch {
    // localStorage indisponível: zoom vale só para a sessão.
  }
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--app-zoom', String(zoom));
  }
}

/**
 * Preferência de redução de animações. `false` (padrão) = o app segue a
 * configuração do sistema operacional (`prefers-reduced-motion`); `true` =
 * reduz animações incondicionalmente, independente do sistema.
 */
export function getReducedMotionPreference(): boolean {
  try {
    return localStorage.getItem(REDUCED_MOTION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setReducedMotionPreference(reduced: boolean): void {
  try {
    localStorage.setItem(REDUCED_MOTION_KEY, String(reduced));
  } catch {
    // localStorage indisponível: preferência vale só para a sessão.
  }
  // A classe espelha a preferência nas transições CSS globais (index.css),
  // que não passam pelo MotionConfig.
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('reduce-motion', reduced);
  }
}
