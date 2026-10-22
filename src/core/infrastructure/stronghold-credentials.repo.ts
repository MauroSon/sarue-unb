import type {
  Credential,
  SigaaCredentials,
  Aprender3Credentials,
  TeamsCredentials,
  AllPlatformCredentials,
} from '../domain/entities/credential';
import type { PlatformType } from '../domain/entities/feed-item';
import type { Stronghold, Client } from '@tauri-apps/plugin-stronghold';
import type { ICredentialsRepository } from '../domain/interfaces/credentials-repo.interface';

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

let sharedInMemoryStore: AllPlatformCredentials = {};
let sharedCachedStronghold: Stronghold | null = null;
let sharedCachedClient: Client | null = null;
let sharedStoreInitPromise: Promise<{
  store: ReturnType<Client['getStore']>;
  saveVault: () => Promise<void>;
} | null> | null = null;
let hasHydratedFromVault = false;
let sharedHydratePromise: Promise<void> | null = null;

export const VAULT_CREDENTIAL_KEYS = [
  'sigaa_matricula',
  'sigaa_senha',
  'aprender3_cpf',
  'aprender3_senha',
  'teams_connected',
  'teams_email',
  'moodlemat_matricula',
  'moodlemat_senha',
] as const;

export class StrongholdCredentialsRepository implements ICredentialsRepository {
  private vaultPassword = 'sarue-unb-internal-vault-key';
  private legacyVaultPassword = 'unb-aggregator-internal-vault-key';

  private async getStore() {
    if (!isTauriEnvironment()) return null;

    if (sharedCachedClient && sharedCachedStronghold) {
      const stronghold = sharedCachedStronghold;
      const client = sharedCachedClient;
      return {
        store: client.getStore(),
        saveVault: async () => stronghold.save(),
      };
    }

    if (sharedStoreInitPromise) {
      return sharedStoreInitPromise;
    }

    sharedStoreInitPromise = (async () => {
      try {
        const { Stronghold } = await import('@tauri-apps/plugin-stronghold');
        const { appLocalDataDir } = await import('@tauri-apps/api/path');
        const { VAULT_FILE_NAME } = await import('./db-config');
        const { commands } = await import('./bindings');

        // Recupera a chave criptográfica segura armazenada no Chaveiro do Sistema Operacional (OS Keyring)
        let securePassword = this.vaultPassword;
        try {
          const keyRes = await commands.getOrCreateVaultKey();
          if (keyRes.status === 'ok' && keyRes.data) {
            securePassword = keyRes.data;
          }
        } catch (keyErr) {
          console.warn('[Stronghold] Chave do SO indisponível, usando fallback de segurança:', keyErr);
        }

        const dataDir = await appLocalDataDir();
        const vaultPath = `${dataDir}/${VAULT_FILE_NAME}`;

        let stronghold = sharedCachedStronghold;
        let client = sharedCachedClient;

        if (!stronghold) {
          try {
            stronghold = await Stronghold.load(vaultPath, securePassword);
          } catch (loadErr) {
            console.info('[Stronghold] Não foi possível abrir o cofre com a chave principal. Tentando chave legada ou recuperação...');

            // Se falhou com a chave segura, verifica se é um cofre legado criado anteriormente com a chave fixa.
            let legacyStronghold: Stronghold | null = null;
            let legacyPasswordUsed: string | null = null;

            for (const legPass of [this.vaultPassword, this.legacyVaultPassword]) {
              if (legPass === securePassword) continue;
              try {
                legacyStronghold = await Stronghold.load(vaultPath, legPass);
                legacyPasswordUsed = legPass;
                break;
              } catch {}
            }

            if (legacyStronghold) {
              console.info(`[Stronghold] Cofre legado detectado (${legacyPasswordUsed}). Iniciando migração segura...`);
              const migratedData: Array<[string, number[]]> = [];
              try {
                const legClient = await legacyStronghold.loadClient('unb_credentials');
                const legStore = legClient.getStore();
                for (const k of VAULT_CREDENTIAL_KEYS) {
                  const val = await legStore.get(k).catch(() => null);
                  if (val && val.length > 0) migratedData.push([k, Array.from(val)]);
                }
              } catch (legClientErr) {
                console.warn('[Stronghold] Aviso ao extrair credenciais do cliente legado:', legClientErr);
              }

              try {
                await legacyStronghold.unload();
              } catch {}

              // 1. Faz backup seguro do arquivo legado antes de recriar
              let backedUp = false;
              try {
                const bakRes = await commands.backupVaultFile(VAULT_FILE_NAME);
                backedUp = bakRes.status === 'ok';
              } catch (bakErr) {
                console.warn('[Stronghold] Falha ao criar backup do cofre legado:', bakErr);
              }

              // 2. Inicializa o novo cofre com a chave segura do Chaveiro
              let migrationSuccess = false;
              try {
                stronghold = await Stronghold.load(vaultPath, securePassword);
                client = await stronghold.createClient('unb_credentials');
                const newStore = client.getStore();
                for (const [k, val] of migratedData) {
                  await newStore.insert(k, val);
                }
                await stronghold.save();
                sharedCachedClient = client;
                sharedCachedStronghold = stronghold;
                migrationSuccess = true;
                console.info('[Stronghold] Cofre migrado com sucesso para o Chaveiro do SO com', migratedData.length, 'credenciais salvas.');
              } catch (migrateErr) {
                console.error('[Stronghold] Falha ao re-criptografar cofre sob chave do SO:', migrateErr);
                // Em caso de falha, restaura o backup imediatamente
                if (backedUp) {
                  try {
                    await commands.restoreVaultFile(VAULT_FILE_NAME);
                    console.info('[Stronghold] Backup do cofre legado restaurado após falha na migração.');
                  } catch {}
                }
              }

              // 3. Remove o arquivo .bak apenas após confirmação de sucesso
              if (migrationSuccess && backedUp) {
                try {
                  await commands.deleteVaultFile(`${VAULT_FILE_NAME}.bak`);
                } catch {}
              }
            } else {
              // Nem a chave principal nem as legadas conseguiram abrir o arquivo.
              // NUNCA apagar o arquivo em disco automaticamente!
              console.warn('[Stronghold] Não foi possível descriptografar o cofre em disco com as chaves conhecidas. Mantendo sessão em memória.');
            }
          }
          sharedCachedStronghold = stronghold;
        }

        if (!client && stronghold) {
          try {
            client = await stronghold.loadClient('unb_credentials');
          } catch {
            try {
              client = await stronghold.createClient('unb_credentials');
            } catch (createErr) {
              console.error('[Stronghold] Falha ao carregar ou criar cliente no cofre:', createErr);
              client = null;
            }
          }
          sharedCachedClient = client;
        }

        if (!client || !sharedCachedStronghold) return null;

        const finalStronghold = sharedCachedStronghold;
        return {
          store: client.getStore(),
          saveVault: async () => {
            await finalStronghold.save();
          },
        };
      } catch (e) {
        sharedCachedClient = null;
        sharedCachedStronghold = null;
        console.error('Erro ao conectar com Stronghold nativo, usando isolamento em memória:', e);
        return null;
      }
    })();

    try {
      return await sharedStoreInitPromise;
    } finally {
      sharedStoreInitPromise = null;
    }
  }

  private isPlatformCleared(platform: PlatformType): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      return (
        window.localStorage.getItem('unb_vault_cleared_v1') === 'true' ||
        window.localStorage.getItem(`unb_cleared_${platform}_v1`) === 'true'
      );
    } catch {
      return false;
    }
  }

  private markPlatformSaved(platform: PlatformType) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.removeItem('unb_vault_cleared_v1');
      window.localStorage.removeItem(`unb_cleared_${platform}_v1`);
    } catch {}
  }

  private markPlatformCleared(platform: PlatformType) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(`unb_cleared_${platform}_v1`, 'true');
    } catch {}
  }

  private markAllCleared() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem('unb_vault_cleared_v1', 'true');
      window.localStorage.setItem('unb_cleared_sigaa_v1', 'true');
      window.localStorage.setItem('unb_cleared_aprender3_v1', 'true');
      window.localStorage.setItem('unb_cleared_teams_v1', 'true');
    } catch {}
  }

  private async hydrateFromVaultOnce(): Promise<void> {
    if (hasHydratedFromVault || !isTauriEnvironment()) return;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        if (window.localStorage.getItem('unb_vault_cleared_v1') === 'true') {
          sharedInMemoryStore = {};
          hasHydratedFromVault = true;
          return;
        }
      } catch {}
    }

    if (sharedHydratePromise) {
      await sharedHydratePromise;
      return;
    }

    sharedHydratePromise = (async () => {
      const vault = await this.getStore();
      if (!vault) return;

      const decoder = new TextDecoder();

      if (!this.isPlatformCleared('sigaa')) {
        try {
          const [matBytes, sigaaPassBytes] = await Promise.all([
            vault.store.get('sigaa_matricula').catch(() => null),
            vault.store.get('sigaa_senha').catch(() => null),
          ]);
          if (matBytes && sigaaPassBytes && matBytes.length > 0 && sigaaPassBytes.length > 0) {
            const matricula = decoder.decode(new Uint8Array(matBytes)).trim();
            const senha = decoder.decode(new Uint8Array(sigaaPassBytes));
            if (matricula && senha) {
              sharedInMemoryStore.sigaa = { matricula, senha };
            }
          }
        } catch {}
      }

      if (!this.isPlatformCleared('aprender3')) {
        try {
          const [cpfBytes, a3PassBytes] = await Promise.all([
            vault.store.get('aprender3_cpf').catch(() => null),
            vault.store.get('aprender3_senha').catch(() => null),
          ]);
          if (cpfBytes && a3PassBytes && cpfBytes.length > 0 && a3PassBytes.length > 0) {
            const cpf = decoder.decode(new Uint8Array(cpfBytes)).trim();
            const senha = decoder.decode(new Uint8Array(a3PassBytes));
            if (cpf && senha) {
              sharedInMemoryStore.aprender3 = { cpf, senha };
            }
          }
        } catch {}
      }

      if (!this.isPlatformCleared('teams')) {
        try {
          const connBytes = await vault.store.get('teams_connected').catch(() => null);
          if (connBytes && connBytes.length > 0) {
            const isConn = decoder.decode(new Uint8Array(connBytes)) === 'true';
            if (isConn) {
              let email: string | undefined = undefined;
              try {
                const emailBytes = await vault.store.get('teams_email').catch(() => null);
                if (emailBytes && emailBytes.length > 0) {
                  email = decoder.decode(new Uint8Array(emailBytes));
                }
              } catch {}
              sharedInMemoryStore.teams = { isConnected: true, email };
            }
          }
        } catch {}
      }

      hasHydratedFromVault = true;
    })();

    try {
      await sharedHydratePromise;
    } finally {
      sharedHydratePromise = null;
    }
  }

  private cleanLocalStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('senha');
      window.localStorage.removeItem('credentials');
      window.localStorage.removeItem('sigaa_senha');
      window.localStorage.removeItem('aprender3_senha');
      window.localStorage.removeItem('moodlemat_senha');
    }
  }

  // --- SIGAA (Matrícula e Senha) ---
  async saveSigaa(credentials: SigaaCredentials): Promise<void> {
    this.cleanLocalStorage();
    this.markPlatformSaved('sigaa');
    sharedInMemoryStore.sigaa = { ...credentials };

    const vault = await this.getStore();
    if (!vault) {
      console.warn(
        '[Stronghold] Cofre seguro indisponível no momento. Credenciais mantidas em memória para esta sessão.'
      );
      return;
    }
    const encoder = new TextEncoder();
    await vault.store.insert('sigaa_matricula', Array.from(encoder.encode(credentials.matricula)));
    await vault.store.insert('sigaa_senha', Array.from(encoder.encode(credentials.senha)));
    await vault.saveVault();
  }

  async getSigaa(): Promise<SigaaCredentials | null> {
    if (this.isPlatformCleared('sigaa')) {
      delete sharedInMemoryStore.sigaa;
      return null;
    }
    if (!sharedInMemoryStore.sigaa) {
      await this.hydrateFromVaultOnce();
    }
    return sharedInMemoryStore.sigaa ? { ...sharedInMemoryStore.sigaa } : null;
  }

  // --- APRENDER 3 (CPF e Senha) ---
  async saveAprender3(credentials: Aprender3Credentials): Promise<void> {
    this.cleanLocalStorage();
    this.markPlatformSaved('aprender3');
    sharedInMemoryStore.aprender3 = { ...credentials };

    const vault = await this.getStore();
    if (!vault) {
      console.warn(
        '[Stronghold] Cofre seguro indisponível no momento. Credenciais mantidas em memória para esta sessão.'
      );
      return;
    }
    const encoder = new TextEncoder();
    await vault.store.insert('aprender3_cpf', Array.from(encoder.encode(credentials.cpf)));
    await vault.store.insert('aprender3_senha', Array.from(encoder.encode(credentials.senha)));
    await vault.saveVault();
  }

  async getAprender3(): Promise<Aprender3Credentials | null> {
    if (this.isPlatformCleared('aprender3')) {
      delete sharedInMemoryStore.aprender3;
      return null;
    }
    if (!sharedInMemoryStore.aprender3) {
      await this.hydrateFromVaultOnce();
    }
    return sharedInMemoryStore.aprender3 ? { ...sharedInMemoryStore.aprender3 } : null;
  }

  // --- TEAMS (Autenticação Manual / Sessão Conectada) ---
  async saveTeams(credentials: TeamsCredentials): Promise<void> {
    this.cleanLocalStorage();
    if (credentials.isConnected) {
      this.markPlatformSaved('teams');
    } else {
      this.markPlatformCleared('teams');
    }
    sharedInMemoryStore.teams = { ...credentials };

    const vault = await this.getStore();
    if (!vault) {
      console.warn(
        '[Stronghold] Cofre seguro indisponível no momento. Credenciais mantidas em memória para esta sessão.'
      );
      return;
    }
    const encoder = new TextEncoder();
    await vault.store.insert('teams_connected', Array.from(encoder.encode(credentials.isConnected ? 'true' : 'false')));
    if (credentials.email) {
      await vault.store.insert('teams_email', Array.from(encoder.encode(credentials.email)));
    }
    await vault.saveVault();
  }

  async getTeams(): Promise<TeamsCredentials | null> {
    if (this.isPlatformCleared('teams')) {
      delete sharedInMemoryStore.teams;
      return null;
    }
    if (!sharedInMemoryStore.teams) {
      await this.hydrateFromVaultOnce();
    }
    return sharedInMemoryStore.teams ? { ...sharedInMemoryStore.teams } : null;
  }

  async getAll(): Promise<AllPlatformCredentials> {
    await this.hydrateFromVaultOnce();
    return {
      sigaa: !this.isPlatformCleared('sigaa') && sharedInMemoryStore.sigaa ? { ...sharedInMemoryStore.sigaa } : undefined,
      aprender3: !this.isPlatformCleared('aprender3') && sharedInMemoryStore.aprender3 ? { ...sharedInMemoryStore.aprender3 } : undefined,
      teams: !this.isPlatformCleared('teams') && sharedInMemoryStore.teams ? { ...sharedInMemoryStore.teams } : undefined,
    };
  }

  async hasAnyCredentials(): Promise<boolean> {
    const all = await this.getAll();
    return Boolean(
      (all.sigaa && all.sigaa.matricula && all.sigaa.senha) ||
      (all.aprender3 && all.aprender3.cpf && all.aprender3.senha) ||
      (all.teams && all.teams.isConnected)
    );
  }

  async hasPlatformCredentials(platform: PlatformType): Promise<boolean> {
    switch (platform) {
      case 'sigaa': {
        const s = await this.getSigaa();
        return Boolean(s && s.matricula && s.senha);
      }
      case 'aprender3': {
        const a = await this.getAprender3();
        return Boolean(a && a.cpf && a.senha);
      }
      case 'teams': {
        const t = await this.getTeams();
        return Boolean(t && t.isConnected);
      }
    }
  }

  async clearPlatform(platform: PlatformType): Promise<void> {
    this.markPlatformCleared(platform);
    delete sharedInMemoryStore[platform];

    if (platform === 'teams' && isTauriEnvironment()) {
      void (async () => {
        try {
          const { commands } = await import('@/core/infrastructure/bindings');
          await commands.disconnectTeams();
        } catch {}
      })();
    }

    // Persiste a remoção no Stronghold em segundo plano sem travar a UI
    void (async () => {
      const vault = await this.getStore();
      if (!vault) return;
      try {
        switch (platform) {
          case 'sigaa':
            await vault.store.remove('sigaa_matricula').catch(() => {});
            await vault.store.remove('sigaa_senha').catch(() => {});
            break;
          case 'aprender3':
            await vault.store.remove('aprender3_cpf').catch(() => {});
            await vault.store.remove('aprender3_senha').catch(() => {});
            break;
          case 'teams':
            await vault.store.remove('teams_connected').catch(() => {});
            await vault.store.remove('teams_email').catch(() => {});
            break;
        }
        await vault.saveVault().catch(() => {});
      } catch {}
    })();
  }

  async clearAll(): Promise<void> {
    this.markAllCleared();
    sharedInMemoryStore = {};
    hasHydratedFromVault = true;

    if (isTauriEnvironment()) {
      void (async () => {
        try {
          const { commands } = await import('@/core/infrastructure/bindings');
          await commands.disconnectTeams();
        } catch {}
      })();
    }

    // Persiste a limpeza completa do Stronghold em segundo plano sem bloquear o reset
    void (async () => {
      const vault = await this.getStore();
      if (!vault) return;
      try {
        for (const k of VAULT_CREDENTIAL_KEYS) {
          await vault.store.remove(k).catch(() => {});
        }
        await vault.saveVault().catch(() => {});
      } catch {}
    })();
  }

  // --- Métodos de compatibilidade ---
  async save(credentials: Credential): Promise<void> {
    await this.saveSigaa(credentials);
  }

  async get(): Promise<Credential | null> {
    return this.getSigaa();
  }

  async hasCredentials(): Promise<boolean> {
    return this.hasAnyCredentials();
  }

  async clear(): Promise<void> {
    await this.clearAll();
  }
}
