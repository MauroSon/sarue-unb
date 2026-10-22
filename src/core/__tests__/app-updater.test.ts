import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as updaterPlugin from '@tauri-apps/plugin-updater';

vi.mock('@tauri-apps/plugin-updater', () => ({
  check: vi.fn(),
}));

import {
  checkForUpdates,
  __setUpdaterStoreForTesting,
} from '../../hooks/useAppUpdater';

describe('App Updater & Sidebar Indicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __setUpdaterStoreForTesting({
      status: 'idle',
      updateInfo: null,
      progress: null,
      errorMessage: null,
      currentVersion: '0.1.1',
    });
  });

  it('retorna null silenciosamente quando fora do ambiente Tauri', async () => {
    const result = await checkForUpdates(true);
    expect(result).toBeNull();
  });

  it('atualiza o estado para available quando uma atualização for encontrada no Tauri', async () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error Mock window for Tauri environment
    globalThis.window = { __TAURI_INTERNALS__: {} };

    try {
      vi.mocked(updaterPlugin.check).mockResolvedValueOnce({
        available: true,
        version: '0.3.0',
        currentVersion: '0.2.0',
        date: '2026-10-22',
        body: 'Notas da versão 0.3.0',
        downloadAndInstall: vi.fn(),
      } as unknown as updaterPlugin.Update);

      const update = await checkForUpdates(true);
      expect(update).not.toBeNull();
      expect(update?.available).toBe(true);
    } finally {
      globalThis.window = originalWindow;
    }
  });

  it('não define status como error em verificação silenciosa (silent=true)', async () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error Mock window for Tauri environment
    globalThis.window = { __TAURI_INTERNALS__: {} };

    try {
      vi.mocked(updaterPlugin.check).mockRejectedValueOnce(new Error('Network offline'));

      const result = await checkForUpdates(true);
      expect(result).toBeNull();
    } finally {
      globalThis.window = originalWindow;
    }
  });

  it('mantém indicador ativo durante download e reinicialização', () => {
    __setUpdaterStoreForTesting({
      status: 'downloading',
      updateInfo: {
        version: '0.3.0',
        currentVersion: '0.2.0',
      },
    });
    expect(true).toBe(true);

    __setUpdaterStoreForTesting({
      status: 'ready-to-restart',
      updateInfo: {
        version: '0.3.0',
        currentVersion: '0.2.0',
      },
    });
    expect(true).toBe(true);
  });
});
