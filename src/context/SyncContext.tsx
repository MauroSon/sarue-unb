import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useContainer } from './ContainerContext';
import { useCredentials } from '../hooks/useCredentials';
import { notifyMyCourseListeners } from '../hooks/useMyCourse';

export type SyncStepId = 'sigaa' | 'aprender3' | 'myCourse' | 'ghPages';

export type SyncStepStatus = 'idle' | 'syncing' | 'success' | 'error' | 'skipped';

export interface SyncStepInfo {
  id: SyncStepId;
  label: string;
  sublabel: string;
  status: SyncStepStatus;
  message?: string;
  count?: number;
  lastUpdated?: string;
}

export interface SyncContextValue {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  steps: Record<SyncStepId, SyncStepInfo>;
  syncAll: () => Promise<void>;
}

const INITIAL_STEPS: Record<SyncStepId, SyncStepInfo> = {
  sigaa: {
    id: 'sigaa',
    label: 'SIGAA',
    sublabel: 'Turmas e avisos do portal discente',
    status: 'idle',
    message: 'Pronto para sincronizar',
  },
  aprender3: {
    id: 'aprender3',
    label: 'Aprender 3',
    sublabel: 'Tarefas, atividades, trabalhos e prazos',
    status: 'idle',
    message: 'Pronto para sincronizar',
  },
  myCourse: {
    id: 'myCourse',
    label: 'Meu Curso',
    sublabel: 'Histórico escolar e fluxo curricular',
    status: 'idle',
    message: 'Pronto para sincronizar',
  },
  ghPages: {
    id: 'ghPages',
    label: 'Catálogo UnB (GitHub Pages)',
    sublabel: 'Matrizes curriculares e turmas ofertadas',
    status: 'idle',
    message: 'Pronto para sincronizar',
  },
};

const SyncContext = createContext<SyncContextValue | null>(null);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { useCases } = useContainer();
  const { allCredentials } = useCredentials();

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [steps, setSteps] = useState<Record<SyncStepId, SyncStepInfo>>(INITIAL_STEPS);

  const updateStep = useCallback((id: SyncStepId, patch: Partial<SyncStepInfo>) => {
    setSteps((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...patch,
      },
    }));
  }, []);

  const syncAll = useCallback(async () => {
    setIsSyncing(true);

    // 1. Sincronização do Catálogo UnB (GitHub Pages / CDN)
    updateStep('ghPages', {
      status: 'syncing',
      message: 'Consultando catálogo de matrizes e turmas da UnB...',
    });

    const ghPagesPromise = (async () => {
      try {
        const curricula = await useCases.manageAcademicProfile.getAllCurricula();
        updateStep('ghPages', {
          status: 'success',
          count: curricula.length,
          message: `${curricula.length} matrizes curriculares disponíveis`,
          lastUpdated: new Date().toISOString(),
        });
      } catch (err: unknown) {
        updateStep('ghPages', {
          status: 'error',
          message: err instanceof Error ? err.message : 'Falha ao acessar CDN do GitHub Pages',
        });
      }
    })();

    // 2. Sincronização do SIGAA
    const sigaaCreds = allCredentials.sigaa;
    const hasSigaa = Boolean(sigaaCreds?.matricula?.trim() && sigaaCreds?.senha);

    let sigaaSuccess = false;

    const sigaaPromise = (async () => {
      if (!hasSigaa) {
        updateStep('sigaa', {
          status: 'skipped',
          message: 'Conta não configurada',
        });
        return;
      }

      updateStep('sigaa', {
        status: 'syncing',
        message: 'Conectando ao SIGAA e extraindo turmas e avisos...',
      });

      try {
        const res = await useCases.syncPlatforms.execute(['sigaa']);
        if (res.errors?.sigaa) {
          updateStep('sigaa', {
            status: 'error',
            message: res.errors.sigaa,
          });
        } else {
          sigaaSuccess = true;
          const sigaaCourses = res.courses.filter((c) => c.platform === 'sigaa');
          const sigaaItems = res.items.filter((i) => i.platform === 'sigaa');
          updateStep('sigaa', {
            status: 'success',
            count: sigaaCourses.length,
            message: `${sigaaCourses.length} turmas • ${sigaaItems.length} avisos`,
            lastUpdated: new Date().toISOString(),
          });
        }
      } catch (err: unknown) {
        updateStep('sigaa', {
          status: 'error',
          message: err instanceof Error ? err.message : 'Falha na conexão com o SIGAA',
        });
      }
    })();

    // 3. Sincronização do Aprender 3
    const aprenderCreds = allCredentials.aprender3;
    const hasAprender = Boolean(aprenderCreds?.cpf?.trim() && aprenderCreds?.senha);

    const aprenderPromise = (async () => {
      if (!hasAprender) {
        updateStep('aprender3', {
          status: 'skipped',
          message: 'Conta não configurada',
        });
        return;
      }

      updateStep('aprender3', {
        status: 'syncing',
        message: 'Buscando tarefas, atividades e prazos no Aprender 3...',
      });

      try {
        const res = await useCases.syncPlatforms.execute(['aprender3']);
        if (res.errors?.aprender3) {
          updateStep('aprender3', {
            status: 'error',
            message: res.errors.aprender3,
          });
        } else {
          const a3Courses = res.courses.filter((c) => c.platform === 'aprender3');
          const a3Items = res.items.filter((i) => i.platform === 'aprender3');
          updateStep('aprender3', {
            status: 'success',
            count: a3Items.length,
            message: `${a3Courses.length} turmas • ${a3Items.length} tarefas/prazos`,
            lastUpdated: new Date().toISOString(),
          });
        }
      } catch (err: unknown) {
        updateStep('aprender3', {
          status: 'error',
          message: err instanceof Error ? err.message : 'Falha na conexão com o Aprender 3',
        });
      }
    })();

    // Aguarda os 3 canais principais executando em paralelo
    await Promise.all([ghPagesPromise, sigaaPromise, aprenderPromise]);

    // 4. Sincronização de Meu Curso (depende das credenciais do SIGAA)
    if (!hasSigaa) {
      updateStep('myCourse', {
        status: 'skipped',
        message: 'Requer conta do SIGAA configurada',
      });
    } else if (!sigaaSuccess) {
      updateStep('myCourse', {
        status: 'error',
        message: 'Aguardando autenticação correta no SIGAA',
      });
    } else {
      updateStep('myCourse', {
        status: 'syncing',
        message: 'Baixando histórico escolar oficial e calculando fluxo...',
      });

      try {
        const result = await useCases.manageAcademicProfile.syncWithSigaa(sigaaCreds!);
        notifyMyCourseListeners();

        const student = result.profile;
        const iraStr = student.ira ? `IRA ${student.ira.toFixed(2)}` : 'Perfil discente ativo';
        const pctStr = student.percentualIntegralizado
          ? `${student.percentualIntegralizado.toFixed(0)}% integralizado`
          : 'Fluxo atualizado';

        updateStep('myCourse', {
          status: 'success',
          message: `${iraStr} • ${pctStr}`,
          lastUpdated: new Date().toISOString(),
        });
      } catch (err: unknown) {
        updateStep('myCourse', {
          status: 'error',
          message: err instanceof Error ? err.message : 'Falha ao sincronizar histórico escolar',
        });
      }
    }

    const now = new Date().toISOString();
    setLastSyncedAt(now);
    setIsSyncing(false);
  }, [allCredentials, updateStep, useCases]);

  const value = useMemo(
    () => ({
      isSyncing,
      lastSyncedAt,
      steps,
      syncAll,
    }),
    [isSyncing, lastSyncedAt, steps, syncAll]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync deve ser utilizado dentro de um SyncProvider');
  }
  return context;
}
