/**
 * Módulo de Efeitos Sonoros Tácteis (Switch Mecânico)
 *
 * Utiliza a Web Audio API (AudioContext) para reproduzir cliques de botões
 * e checkboxes com latência zero (<5ms), suporte a cliques rápidos sobrepostos
 * e microvariação de tom (pitch jitter) para sensação tátil e orgânica.
 */

const STORAGE_KEY = 'sarue_sound_effects_enabled';
const AUDIO_URL = '/566196__scholzi982__press_button_01.wav';

let audioCtx: AudioContext | null = null;
let soundBuffer: AudioBuffer | null = null;
let isAudioLoading = false;
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
 * Carrega e decodifica o arquivo de áudio para a memória RAM.
 */
export async function preloadSoundEffects(): Promise<void> {
  if (soundBuffer || isAudioLoading || typeof window === 'undefined') return;

  const ctx = getAudioContext();
  if (!ctx) return;

  isAudioLoading = true;
  try {
    const response = await fetch(AUDIO_URL);
    if (!response.ok) {
      console.warn('[sound-effects] Falha ao carregar áudio de clique:', response.statusText);
      return;
    }
    const arrayBuffer = await response.arrayBuffer();
    soundBuffer = await ctx.decodeAudioData(arrayBuffer);
  } catch (err) {
    console.warn('[sound-effects] Erro ao decodificar buffer de áudio:', err);
  } finally {
    isAudioLoading = false;
  }
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
 * Reproduz o som de clique com ganho suave e microvariação de afinação (pitch jitter).
 */
export async function playButtonClickSound(): Promise<void> {
  if (!isSoundEffectsEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {}
  }

  if (!soundBuffer) {
    await preloadSoundEffects();
    if (!soundBuffer) return;
  }

  try {
    const source = ctx.createBufferSource();
    source.buffer = soundBuffer;

    // Pitch jitter aleatório entre ~0.97 e 1.03 (sensação tátil e não-robótica)
    source.playbackRate.value = 0.97 + Math.random() * 0.06;

    // Ganho suave e encorpado (~25% de volume)
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.25;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);
  } catch (e) {
    console.debug('[sound-effects] Erro ao tocar som:', e);
  }
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

  const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const clickable = target.closest<HTMLElement>(
      'button, [role="button"], [role="checkbox"], input[type="checkbox"], a[href], [data-sound="click"]',
    );

    if (!clickable) return;

    // Ignora elementos marcados explicitamente com data-no-sound="true" (ex: navegação da sidebar)
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

    playButtonClickSound();
  };

  window.addEventListener('click', handleClick, { capture: true, passive: true });

  return () => {
    window.removeEventListener('click', handleClick, { capture: true });
    isListenerInitialized = false;
  };
}
