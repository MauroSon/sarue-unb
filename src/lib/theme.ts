/**
 * Módulo de Tema da Interface
 *
 * Persistência e aplicação da preferência de tema do app: claro, escuro ou
 * seguir o sistema operacional. Aplica a classe `dark` no <html> (a inversão
 * de cores toda vive no index.css, escopo .dark) e sincroniza o tema nativo
 * da janela Tauri para a moldura acompanhar.
 *
 * Molde: lib/accessibility.ts — mesma estratégia de chave no localStorage
 * e guard de ambiente do Tauri (`__TAURI_INTERNALS__`, como useAutostart).
 */

const THEME_KEY = 'sarue_theme';

/** Modos de tema escolhíveis em Configurações → Aparência. */
export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_MODES: ThemeMode[] = ['light', 'dark', 'system'];

export const DEFAULT_THEME_MODE: ThemeMode = 'system';

const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

function isThemeMode(value: unknown): value is ThemeMode {
  return THEME_MODES.includes(value as ThemeMode);
}

/** Lê o modo salvo. Sem valor salvo (ou valor inválido), segue o sistema. */
export function getThemeMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return isThemeMode(stored) ? stored : DEFAULT_THEME_MODE;
  } catch {
    return DEFAULT_THEME_MODE;
  }
}

export function setThemeModePersistence(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    // localStorage indisponível: preferência vale só para a sessão.
  }
}

/** Resolução efetiva do modo "system" contra o sistema operacional. */
export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'system') return mode;
  try {
    return window.matchMedia(DARK_MEDIA_QUERY).matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/**
 * Sincroniza o tema nativo da janela (moldura/titlebar no macOS e Windows).
 * No modo "system" o override é limpo (setTheme(null)): fixar light/dark
 * congela o prefers-color-scheme do WebView no último tema aplicado e o
 * modo sistema deixa de acompanhar o sistema operacional.
 * Fire-and-forget: falha silenciosa fora do Tauri ou em versões sem o comando.
 */
function applyNativeTheme(
  mode: ThemeMode,
  resolved: 'light' | 'dark',
): void {
  try {
    const tauri = (
      window as unknown as { __TAURI_INTERNALS__?: { metadata?: unknown } }
    ).__TAURI_INTERNALS__;
    if (!tauri) return;
    void import('@tauri-apps/api/window')
      .then(({ getCurrentWindow }) =>
        getCurrentWindow().setTheme(mode === 'system' ? null : resolved),
      )
      .then(() => {
        // Limpamos um override antigo? O effectiveAppearance da janela
        // propaga em outra rodada do runloop — re-resolve depois de um tick
        // e corrige a classe caso o matchMedia refletisse o tema fixado.
        if (mode !== 'system' || typeof window === 'undefined') return;
        window.setTimeout(() => {
          if (resolveTheme('system') !== resolved) applyTheme('system');
        }, 50);
      })
      .catch(() => {
        // Janela sem suporte a setTheme: a classe .dark já governa a UI.
      });
  } catch {
    // Ambiente sem Tauri (dev no navegador): nada a fazer.
  }
}

/**
 * Aplica o tema resolvido: classe `dark` no <html> (antes de qualquer paint
 * quando chamado do boot) + tema nativo da janela. Retorna o tema efetivo.
 */
export function applyTheme(mode: ThemeMode): 'light' | 'dark' {
  const resolved = resolveTheme(mode);
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    // Cor de fundo do <html> acompanha o papel (evita franja em overscroll).
    document.documentElement.style.backgroundColor =
      resolved === 'dark' ? '#111622' : '#E8EFF8';
  }
  applyNativeTheme(mode, resolved);
  return resolved;
}

/**
 * Observa mudanças do tema do sistema enquanto o modo é "system".
 * Retorna a função de limpeza (molde initSoundEffectsListener).
 */
export function watchSystemTheme(
  getMode: () => ThemeMode,
  onChange: (resolved: 'light' | 'dark') => void,
): () => void {
  try {
    const media = window.matchMedia(DARK_MEDIA_QUERY);
    const handler = () => {
      if (getMode() === 'system') {
        onChange(applyTheme('system'));
      }
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  } catch {
    return () => {};
  }
}
