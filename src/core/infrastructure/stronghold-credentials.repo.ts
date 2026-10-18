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

export class StrongholdCredentialsRepository implements ICredentialsRepository {
  private vaultPassword = 'unb-aggregator-internal-vault-key';

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

        const dataDir = await appLocalDataDir();
        const vaultPath = `${dataDir}/unb_vault.hold`;

        let stronghold = sharedCachedStronghold;
        if (!stronghold) {
          stronghold = await Stronghold.load(vaultPath, this.vaultPassword);
          sharedCachedStronghold = stronghold;
        }

        let client = sharedCachedClient;
        if (!client) {
          try {
            client = await stronghold.loadClient('unb_credentials');
          } catch {
            try {
              client = await stronghold.createClient('unb_credentials');
            } catch (createErr) {
              try {
                console.error('Recriando cofre Stronghold após falha:', createErr);
                sharedCachedStronghold = await Stronghold.load(vaultPath, this.vaultPassword);
                sharedCachedClient = null;
                client = await sharedCachedStronghold.createClient('unb_credentials');
              } catch (healErr) {
                console.error('Stronghold indisponível mesmo após recuperação:', healErr);
                client = null;
              }
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
      if (isTauriEnvironment()) {
        throw new Error(
          'Cofre seguro indisponível: as credenciais não serão mantidas após reiniciar o app.'
        );
      }
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
      if (isTauriEnvironment()) {
        throw new Error(
          'Cofre seguro indisponível: as credenciais não serão mantidas após reiniciar o app.'
        );
      }
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
      if (isTauriEnvironment()) {
        throw new Error(
          'Cofre seguro indisponível: as credenciais não serão mantidas após reiniciar o app.'
        );
      }
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
        await vault.store.remove('sigaa_matricula').catch(() => {});
        await vault.store.remove('sigaa_senha').catch(() => {});
        await vault.store.remove('aprender3_cpf').catch(() => {});
        await vault.store.remove('aprender3_senha').catch(() => {});
        await vault.store.remove('moodlemat_matricula').catch(() => {});
        await vault.store.remove('moodlemat_senha').catch(() => {});
        await vault.store.remove('teams_connected').catch(() => {});
        await vault.store.remove('teams_email').catch(() => {});
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
