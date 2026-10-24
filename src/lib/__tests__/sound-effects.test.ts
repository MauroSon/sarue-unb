import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isSoundEffectsEnabled,
  setSoundEffectsEnabled,
  preloadSoundEffects,
  playButtonClickSound,
  playSidebarSound,
  initSoundEffectsListener,
} from '../sound-effects';

describe('Módulo de Efeitos Sonoros (sound-effects.ts)', () => {
  const STORAGE_KEY = 'sarue_sound_effects_enabled';
  let storageMap: Record<string, string> = {};

  beforeEach(() => {
    storageMap = {};
    const mockLocalStorage = {
      getItem: vi.fn((key: string) => storageMap[key] ?? null),
      setItem: vi.fn((key: string, val: string) => {
        storageMap[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete storageMap[key];
      }),
      clear: vi.fn(() => {
        storageMap = {};
      }),
    };

    if (typeof globalThis.window === 'undefined') {
      // @ts-expect-error Mock window
      globalThis.window = {};
    }
    Object.defineProperty(globalThis.window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Preferências de áudio no localStorage', () => {
    it('retorna false por padrão se o localStorage estiver vazio', () => {
      expect(isSoundEffectsEnabled()).toBe(false);
    });

    it('retorna true quando ativado via setSoundEffectsEnabled', () => {
      setSoundEffectsEnabled(true);
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true');
      expect(isSoundEffectsEnabled()).toBe(true);
    });

    it('retorna false quando desativado via setSoundEffectsEnabled', () => {
      setSoundEffectsEnabled(true);
      expect(isSoundEffectsEnabled()).toBe(true);

      setSoundEffectsEnabled(false);
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('false');
      expect(isSoundEffectsEnabled()).toBe(false);
    });
  });

  describe('Reprodução e Listener Global', () => {
    it('não toca som nem lança erro quando efeitos estão desativados', async () => {
      setSoundEffectsEnabled(false);
      await expect(playButtonClickSound()).resolves.toBeUndefined();
      await expect(playSidebarSound()).resolves.toBeUndefined();
      await expect(preloadSoundEffects()).resolves.toBeUndefined();
    });

    it('registra e remove o listener de clique global sem falhas', () => {
      const addEventListenerSpy = vi.fn();
      const removeEventListenerSpy = vi.fn();
      globalThis.window.addEventListener = addEventListenerSpy as unknown as typeof window.addEventListener;
      globalThis.window.removeEventListener = removeEventListenerSpy as unknown as typeof window.removeEventListener;

      const cleanup = initSoundEffectsListener();
      expect(typeof cleanup).toBe('function');
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), {
        capture: true,
        passive: true,
      });

      cleanup();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), {
        capture: true,
      });
    });

    it('ignora cliques em elementos com data-no-sound="true" (ex: aba já ativa)', () => {
      let registeredHandler: ((e: MouseEvent) => void) | null = null;
      globalThis.window.addEventListener = vi.fn((event, handler) => {
        if (event === 'click') registeredHandler = handler as (e: MouseEvent) => void;
      }) as unknown as typeof window.addEventListener;
      globalThis.window.removeEventListener = vi.fn() as unknown as typeof window.removeEventListener;

      const cleanup = initSoundEffectsListener();
      expect(registeredHandler).not.toBeNull();

      // Simula clique em aba ativa com data-no-sound="true"
      const activeBtn = {
        closest: (selector: string) => {
          if (selector.includes('data-no-sound="true"')) return activeBtn;
          if (selector.includes('button')) return activeBtn;
          return null;
        },
        hasAttribute: () => false,
        getAttribute: () => null,
        classList: { contains: () => false },
      };

      const mockEvent = {
        target: activeBtn,
      } as unknown as MouseEvent;

      // Executa o handler e garante que não joga exceção e retorna silenciosamente
      expect(() => registeredHandler!(mockEvent)).not.toThrow();
      cleanup();
    });
  });
});
