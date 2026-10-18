import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useContainer } from "./ContainerContext";
import { useCredentials } from "../hooks/useCredentials";
import { notifyMyCourseListeners } from "../hooks/useMyCourse";
import { notifyFeedListeners } from "../hooks/useFeed";

export type SyncStepId = "sigaa" | "aprender3" | "teams" | "myCourse" | "ghPages";

export type SyncStepStatus =
  "idle" | "syncing" | "success" | "error" | "skipped";

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
  cancelSync: () => void;
}

const INITIAL_STEPS: Record<SyncStepId, SyncStepInfo> = {
  sigaa: {
    id: "sigaa",
    label: "SIGAA",
    sublabel: "Turmas e avisos do portal discente",
    status: "idle",
    message: "Pronto para sincronizar",
  },
  aprender3: {
    id: "aprender3",
    label: "Aprender 3",
    sublabel: "Tarefas, atividades, trabalhos e prazos",
    status: "idle",
    message: "Pronto para sincronizar",
  },
  teams: {
    id: "teams",
    label: "Microsoft Teams",
    sublabel: "Equipes, turmas e avisos institucionais",
    status: "idle",
    message: "Pronto para sincronizar",
  },
  myCourse: {
    id: "myCourse",
    label: "Meu Curso",
    sublabel: "Histórico escolar e fluxo curricular",
    status: "idle",
    message: "Pronto para sincronizar",
  },
  ghPages: {
    id: "ghPages",
    label: "Catálogo UnB",
    sublabel: "Matrizes curriculares e turmas ofertadas",
    status: "idle",
    message: "Pronto para sincronizar",
  },
};

const SyncContext = createContext<SyncContextValue | null>(null);

// Ouvintes globais de fim de sync (ex.: avaliação de prazos do sino)
const syncCompleteListeners = new Set<() => void>();

/** Assina a conclusão de um ciclo completo de sincronização. */
export function subscribeToSyncComplete(listener: () => void): () => void {
  syncCompleteListeners.add(listener);
  return () => {
    syncCompleteListeners.delete(listener);
  };
}

function notifySyncComplete() {
  syncCompleteListeners.forEach((fn) => fn());
}

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { useCases } = useContainer();
  const { allCredentials } = useCredentials();

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [steps, setSteps] =
    useState<Record<SyncStepId, SyncStepInfo>>(INITIAL_STEPS);
  const syncInFlightRef = useRef<boolean>(false);
  const syncGenerationRef = useRef<number>(0);

  const updateStep = useCallback(
    (id: SyncStepId, patch: Partial<SyncStepInfo>) => {
      setSteps((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          ...patch,
        },
      }));
    },
    [],
  );

  const cancelSync = useCallback(() => {
    syncGenerationRef.current += 1;
    syncInFlightRef.current = false;
    setIsSyncing(false);
    setLastSyncedAt(null);
    setSteps(INITIAL_STEPS);

    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      void (async () => {
        try {
          const { commands } = await import("@/core/infrastructure/bindings");
          await commands.disconnectTeams();
        } catch {}
      })();
    }
  }, []);

  const syncAll = useCallback(async () => {
    if (syncInFlightRef.current) {
      return;
    }
    const myGen = ++syncGenerationRef.current;
    const isCancelled = () => syncGenerationRef.current !== myGen;

    syncInFlightRef.current = true;
    setIsSyncing(true);

    try {
      // 1. Sincronização do Catálogo UnB (GitHub Pages / CDN)
      updateStep("ghPages", {
        status: "syncing",
        message: "Consultando catálogo de matrizes e turmas da UnB...",
      });

      const ghPagesPromise = (async () => {
        try {
          const curricula =
            await useCases.manageAcademicProfile.getAllCurricula();
          if (isCancelled()) return;
          updateStep("ghPages", {
            status: "success",
            count: curricula.length,
            message: `${curricula.length} matrizes curriculares disponíveis`,
            lastUpdated: new Date().toISOString(),
          });
        } catch (err: unknown) {
          if (isCancelled()) return;
          updateStep("ghPages", {
            status: "error",
            message:
              err instanceof Error
                ? err.message
                : "Falha ao acessar CDN do GitHub Pages",
          });
        }
      })();

      // 2. Sincronização do SIGAA
      const sigaaCreds = allCredentials.sigaa;
      const hasSigaa = Boolean(
        sigaaCreds?.matricula?.trim() && sigaaCreds?.senha,
      );

      let sigaaSuccess = false;

      const sigaaPromise = (async () => {
        if (!hasSigaa) {
          updateStep("sigaa", {
            status: "skipped",
            message: "Conta não configurada",
          });
          return;
        }

        updateStep("sigaa", {
          status: "syncing",
          message: "Conectando ao SIGAA e extraindo turmas e avisos...",
        });

        try {
          const res = await useCases.syncPlatforms.execute(["sigaa"]);
          if (isCancelled()) return;
          if (res.errors?.sigaa) {
            updateStep("sigaa", {
              status: "error",
              message: res.errors.sigaa,
            });
          } else {
            sigaaSuccess = true;
            const sigaaCourses = res.courses.filter(
              (c) => c.platform === "sigaa",
            );
            const sigaaItems = res.items.filter((i) => i.platform === "sigaa");
            updateStep("sigaa", {
              status: "success",
              count: sigaaCourses.length,
              message: `${sigaaCourses.length} turmas • ${sigaaItems.length} avisos`,
              lastUpdated: new Date().toISOString(),
            });
            notifyFeedListeners();
            notifySyncComplete();
          }
        } catch (err: unknown) {
          if (isCancelled()) return;
          updateStep("sigaa", {
            status: "error",
            message:
              err instanceof Error ? err.message : "Falha na conexão com o SIGAA",
          });
        }
      })();

      // 3. Sincronização do Aprender 3
      const aprenderCreds = allCredentials.aprender3;
      const hasAprender = Boolean(
        aprenderCreds?.cpf?.trim() && aprenderCreds?.senha,
      );

      const aprenderPromise = (async () => {
        if (!hasAprender) {
          updateStep("aprender3", {
            status: "skipped",
            message: "Conta não configurada",
          });
          return;
        }

        updateStep("aprender3", {
          status: "syncing",
          message: "Buscando tarefas, atividades e prazos no Aprender 3...",
        });

        try {
          const res = await useCases.syncPlatforms.execute(["aprender3"]);
          if (isCancelled()) return;
          if (res.errors?.aprender3) {
            updateStep("aprender3", {
              status: "error",
              message: res.errors.aprender3,
            });
          } else {
            const a3Courses = res.courses.filter(
              (c) => c.platform === "aprender3",
            );
            const a3Items = res.items.filter((i) => i.platform === "aprender3");
            updateStep("aprender3", {
              status: "success",
              count: a3Items.length,
              message: `${a3Courses.length} turmas • ${a3Items.length} tarefas/prazos`,
              lastUpdated: new Date().toISOString(),
            });
            notifyFeedListeners();
            notifySyncComplete();
          }
        } catch (err: unknown) {
          if (isCancelled()) return;
          updateStep("aprender3", {
            status: "error",
            message:
              err instanceof Error
                ? err.message
                : "Falha na conexão com o Aprender 3",
          });
        }
      })();

      // Marca estado inicial do Teams antes de aguardar os canais HTTP rápidos
      const teamsCreds = allCredentials.teams;
      const hasTeams = Boolean(teamsCreds?.isConnected);
      if (!hasTeams) {
        updateStep("teams", {
          status: "skipped",
          message: "Conta não configurada",
        });
      } else {
        updateStep("teams", {
          status: "syncing",
          message: "Aguardando canais rápidos para sincronizar Teams...",
        });
      }

      // Aguarda os canais rápidos executando em paralelo (sem competir com o webview do Teams)
      await Promise.all([ghPagesPromise, sigaaPromise, aprenderPromise]);
      if (isCancelled()) return;

      // 4. Sincronização de Meu Curso (depende das credenciais do SIGAA)
      if (!hasSigaa) {
        updateStep("myCourse", {
          status: "skipped",
          message: "Requer conta do SIGAA configurada",
        });
      } else if (!sigaaSuccess) {
        updateStep("myCourse", {
          status: "error",
          message: "Aguardando autenticação correta no SIGAA",
        });
      } else {
        updateStep("myCourse", {
          status: "syncing",
          message: "Baixando histórico escolar oficial e calculando fluxo...",
        });

        try {
          const result = await useCases.manageAcademicProfile.syncWithSigaa(
            sigaaCreds!,
          );
          if (isCancelled()) return;
          notifyMyCourseListeners();

          const student = result.profile;
          const iraStr = student.ira
            ? `IRA ${student.ira.toFixed(2)}`
            : "Perfil discente ativo";
          const pctStr = student.percentualIntegralizado
            ? `${student.percentualIntegralizado.toFixed(0)}% integralizado`
            : "Fluxo atualizado";

          updateStep("myCourse", {
            status: "success",
            message: `${iraStr} • ${pctStr}`,
            lastUpdated: new Date().toISOString(),
          });
        } catch (err: unknown) {
          if (isCancelled()) return;
          updateStep("myCourse", {
            status: "error",
            message:
              err instanceof Error
                ? err.message
                : "Falha ao sincronizar histórico escolar",
          });
        }
      }

      if (isCancelled()) return;

      const now = new Date().toISOString();
      setLastSyncedAt(now);
      setIsSyncing(false);
      notifyFeedListeners();
      notifySyncComplete();

      // 5. Sincronização do Teams (100% não-bloqueante em segundo plano após liberar a UI)
      if (hasTeams && !isCancelled()) {
        void (async () => {
          updateStep("teams", {
            status: "syncing",
            message: "Sincronizando equipes do Teams em segundo plano...",
          });

          try {
            const res = await useCases.syncPlatforms.execute(["teams"]);
            if (isCancelled()) return;
            if (res.errors?.teams) {
              updateStep("teams", {
                status: "error",
                message: res.errors.teams,
              });
            } else {
              const teamsCourses = res.courses.filter(
                (c) => c.platform === "teams",
              );
              const teamsItems = res.items.filter(
                (i) => i.platform === "teams",
              );
              updateStep("teams", {
                status: "success",
                count: teamsCourses.length,
                message: `${teamsCourses.length} turmas • ${teamsItems.length} avisos`,
                lastUpdated: new Date().toISOString(),
              });
              setLastSyncedAt(new Date().toISOString());
              notifyFeedListeners();
              notifySyncComplete();
            }
          } catch (err: unknown) {
            if (isCancelled()) return;
            updateStep("teams", {
              status: "error",
              message:
                err instanceof Error
                  ? err.message
                  : "Falha na sincronização do Teams",
            });
          } finally {
            if (!isCancelled()) {
              syncInFlightRef.current = false;
            }
          }
        })();
      } else {
        syncInFlightRef.current = false;
      }
    } catch {
      if (!isCancelled()) {
        setIsSyncing(false);
        syncInFlightRef.current = false;
      }
    }
  }, [allCredentials, updateStep, useCases]);

  const value = useMemo(
    () => ({
      isSyncing,
      lastSyncedAt,
      steps,
      syncAll,
      cancelSync,
    }),
    [isSyncing, lastSyncedAt, steps, syncAll, cancelSync],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync deve ser utilizado dentro de um SyncProvider");
  }
  return context;
}

export function useOptionalSync(): SyncContextValue | null {
  return useContext(SyncContext);
}
