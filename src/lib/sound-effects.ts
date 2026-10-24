/**
 * Módulo de Efeitos Sonoros Tácteis (Switch Mecânico e Toque Suave)
 *
 * Utiliza a Web Audio API (AudioContext) para reproduzir cliques de botões,
 * checkboxes e navegação de abas com latência zero (<5ms), suporte a toques rápidos
 * sobrepostos e microvariação de tom (pitch jitter) para sensação tátil e orgânica.
 */

const STORAGE_KEY = 'sarue_sound_effects_enabled';
const BUTTON_AUDIO_URL = '/566196__scholzi982__press_button_01.wav';
const SIDEBAR_AUDIO_URL = '/sidebar-tap.wav';

let audioCtx: AudioContext | null = null;
let buttonSoundBuffer: AudioBuffer | null = null;
let sidebarSoundBuffer: AudioBuffer | null = null;
let loadingPromise: Promise<void> | null = null;
let isListenerInitialized = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  return audioCtx;
}

/**
 * Carrega e decodifica um arquivo de áudio específico para a memória.
 */
async function loadAudioBuffer(url: string, ctx: AudioContext): Promise<AudioBuffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('[sound-effects] Falha ao carregar áudio:', url, response.statusText);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer);
  } catch (err) {
    console.warn('[sound-effects] Erro ao decodificar áudio:', url, err);
    return null;
  }
}

/**
 * Carrega e decodifica os arquivos de áudio para a memória RAM em paralelo.
 */
export async function preloadSoundEffects(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (buttonSoundBuffer && sidebarSoundBuffer) return;
  if (loadingPromise) return loadingPromise;

  const ctx = getAudioContext();
  if (!ctx) return;

  loadingPromise = (async () => {
    try {
      const promises: Promise<void>[] = [];

      if (!buttonSoundBuffer) {
        promises.push(
          loadAudioBuffer(BUTTON_AUDIO_URL, ctx).then((buffer) => {
            buttonSoundBuffer = buffer;
          })
        );
      }

      if (!sidebarSoundBuffer) {
        promises.push(
          loadAudioBuffer(SIDEBAR_AUDIO_URL, ctx).then((buffer) => {
            sidebarSoundBuffer = buffer;
          })
        );
      }

      await Promise.allSettled(promises);
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/**
 * Verifica se os efeitos sonoros estão ativados nas configurações.
 * Desativado por padrão (retorna false a menos que explicitamente ativado).
 */
export function isSoundEffectsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Altera a preferência de efeitos sonoros nas configurações.
 */
export function setSoundEffectsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {}
}

/**
 * Dispara um buffer de áudio com microvariação de tom (pitch jitter) e ganho suave.
 */
async function playBuffer(
  getBuffer: () => AudioBuffer | null,
  jitterRange: [number, number],
  gain: number,
  label: string,
): Promise<void> {
  if (!isSoundEffectsEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  // Sem await: start(0) enfileira o áudio e ele toca assim que o contexto
  // rodar. O aquecimento no primeiro pointerdown deixa o contexto rodando,
  // então o caminho comum não espera nada.
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  let buffer = getBuffer();
  if (!buffer) {
    await preloadSoundEffects();
    buffer = getBuffer();
    if (!buffer) return;
  }

  try {
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const [minJitter, jitterSpan] = jitterRange;
    source.playbackRate.value = minJitter + Math.random() * jitterSpan;

    const gainNode = ctx.createGain();
    gainNode.gain.value = gain;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);
  } catch (e) {
    console.debug(`[sound-effects] Erro ao tocar ${label}:`, e);
  }
}

/**
 * Reproduz o som de clique padrão de botão com ganho suave e microvariação de afinação (pitch jitter).
 */
export async function playButtonClickSound(): Promise<void> {
  return playBuffer(() => buttonSoundBuffer, [0.97, 0.06], 0.25, 'som de botão');
}

/**
 * Reproduz o som suave, fofo e acolchoado da sidebar ("pop macio") ao navegar entre abas.
 */
export async function playSidebarSound(): Promise<void> {
  return playBuffer(() => sidebarSoundBuffer, [0.98, 0.04], 0.25, 'som da sidebar');
}

/**
 * Registra um listener global de pointerdown para interceptar cliques em botões,
 * links e checkboxes sem poluir componentes individuais com onClick.
 */
export function initSoundEffectsListener(): () => void {
  if (typeof window === 'undefined' || isListenerInitialized) {
    return () => {};
  }

  isListenerInitialized = true;
  if (isSoundEffectsEnabled()) {
    preloadSoundEffects();
  }

  // Aquecimento do AudioContext no primeiro gesto com som ligado: contextos criados antes
  // de qualquer interação nascem suspensos, e aguardar resume() dentro do
  // play custava centenas de ms por clique no WKWebView. Só removemos o listener
  // quando o som de fato estiver ativado, evitando queimar o warmUp quando o app inicia mudo.
  const warmUp = () => {
    if (!isSoundEffectsEnabled()) return;
    window.removeEventListener('pointerdown', warmUp, { capture: true });
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    preloadSoundEffects();
  };
  window.addEventListener('pointerdown', warmUp, { capture: true });

  const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const clickable = target.closest<HTMLElement>(
      'button, [role="button"], [role="checkbox"], input[type="checkbox"], a[href], [data-sound="click"], [data-sound="sidebar"]',
    );

    if (!clickable) return;

    // Ignora elementos marcados explicitamente com data-no-sound="true"
    if (clickable.closest('[data-no-sound="true"]')) {
      return;
    }

    // Ignora elementos desativados
    if (
      clickable.hasAttribute('disabled') ||
      clickable.getAttribute('aria-disabled') === 'true' ||
      clickable.classList.contains('pointer-events-none') ||
      clickable.classList.contains('cursor-not-allowed')
    ) {
      return;
    }

    // Se estiver em container ou elemento com data-sound="sidebar", toca o som suave da sidebar
    if (clickable.closest('[data-sound="sidebar"]')) {
      playSidebarSound();
      return;
    }

    playButtonClickSound();
  };

  window.addEventListener('click', handleClick, { capture: true, passive: true });

  return () => {
    window.removeEventListener('pointerdown', warmUp, { capture: true });
    window.removeEventListener('click', handleClick, { capture: true });
    isListenerInitialized = false;
  };
}
