import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  StrongholdCredentialsRepository,
  __resetVaultCacheForTesting,
} from '../infrastructure/stronghold-credentials.repo';
import { VAULT_FILE_NAME } from '../infrastructure/db-config';

describe('StrongholdCredentialsRepository & Vault Persistence', () => {
  const store = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  };

  beforeEach(() => {
    store.clear();
    __resetVaultCacheForTesting();
    globalThis.window = {
      localStorage: mockLocalStorage,
    } as unknown as Window & typeof globalThis;
    // @ts-expect-error - mock de ambiente
    delete globalThis.window.__TAURI_INTERNALS__;
    vi.restoreAllMocks();
  });

  it('salva e recupera credenciais do SIGAA em memória quando fora do Tauri', async () => {
    const repo = new StrongholdCredentialsRepository();
    await repo.saveSigaa({ matricula: '221020904', senha: 'segredo-sigaa' });

    const sigaa = await repo.getSigaa();
    expect(sigaa).toEqual({ matricula: '221020904', senha: 'segredo-sigaa' });

    const has = await repo.hasAnyCredentials();
    expect(has).toBe(true);
  });

  it('salva e recupera credenciais do Aprender 3 em memória quando fora do Tauri', async () => {
    const repo = new StrongholdCredentialsRepository();
    await repo.saveAprender3({ cpf: '12345678900', senha: 'segredo-aprender' });

    const a3 = await repo.getAprender3();
    expect(a3).toEqual({ cpf: '12345678900', senha: 'segredo-aprender' });
  });

  it('limpa plataforma individualmente sem afetar as demais', async () => {
    const repo = new StrongholdCredentialsRepository();
    await repo.saveSigaa({ matricula: '221020904', senha: 'segredo-sigaa' });
    await repo.saveAprender3({ cpf: '12345678900', senha: 'segredo-aprender' });

    await repo.clearPlatform('sigaa');
    expect(await repo.getSigaa()).toBeNull();
    expect(await repo.getAprender3()).toEqual({ cpf: '12345678900', senha: 'segredo-aprender' });
  });

  it('clearAll limpa todas as credenciais', async () => {
    const repo = new StrongholdCredentialsRepository();
    await repo.saveSigaa({ matricula: '221020904', senha: 'segredo-sigaa' });
    await repo.saveAprender3({ cpf: '12345678900', senha: 'segredo-aprender' });

    await repo.clearAll();
    expect(await repo.getSigaa()).toBeNull();
    expect(await repo.getAprender3()).toBeNull();
    expect(await repo.hasAnyCredentials()).toBe(false);
  });

  it('aciona auto-healing com backup quando o cofre em disco está corrompido ou indecifrável', async () => {
    // Simula ambiente nativo Tauri
    (globalThis.window as unknown as { __TAURI_INTERNALS__: Record<string, unknown> }).__TAURI_INTERNALS__ = {};

    const mockStoreData = new Map<string, number[]>();
    const mockStore = {
      get: vi.fn(async (k: string) => mockStoreData.get(k) ?? null),
      insert: vi.fn(async (k: string, v: number[]) => {
        mockStoreData.set(k, v);
      }),
      remove: vi.fn(async (k: string) => {
        mockStoreData.delete(k);
      }),
    };

    const mockClient = {
      getStore: vi.fn(() => mockStore),
    };

    let loadCount = 0;
    const mockStronghold = {
      save: vi.fn(async () => {}),
      createClient: vi.fn(async () => mockClient),
      loadClient: vi.fn(async () => mockClient),
    };

    vi.doMock('@tauri-apps/plugin-stronghold', () => ({
      Stronghold: {
        load: vi.fn(async () => {
          loadCount++;
          // Primeiras 3 tentativas falham (chave do SO + 2 chaves legadas)
          if (loadCount <= 3) {
            throw new Error('Stronghold decryption failure');
          }
          // 4ª tentativa: cofre novo após backup de auto-healing
          return mockStronghold;
        }),
      },
    }));

    vi.doMock('@tauri-apps/api/path', () => ({
      appLocalDataDir: vi.fn(async () => '/mock/local/data'),
    }));

    const mockBackupVaultFile = vi.fn(async () => ({
      status: 'ok',
      data: 'unb_vault.hold.1730987654.bak',
    }));

    vi.doMock('../infrastructure/bindings', () => ({
      commands: {
        getOrCreateVaultKey: vi.fn(async () => ({
          status: 'ok',
          data: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        })),
        backupVaultFile: mockBackupVaultFile,
        deleteVaultFile: vi.fn(async () => ({ status: 'ok', data: null })),
      },
    }));

    const repo = new StrongholdCredentialsRepository();
    // Ao salvar, deve disparar auto-healing porque o cofre inicial é indecifrável
    await repo.saveSigaa({ matricula: '221020904', senha: 'nova-senha-recuperada' });

    expect(mockBackupVaultFile).toHaveBeenCalledWith(VAULT_FILE_NAME);
    expect(mockStronghold.save).toHaveBeenCalled();
    expect(mockStore.insert).toHaveBeenCalledWith('sigaa_matricula', expect.any(Array));

    const sigaa = await repo.getSigaa();
    expect(sigaa?.matricula).toBe('221020904');
  });
});
