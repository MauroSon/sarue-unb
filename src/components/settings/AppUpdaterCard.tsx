import React from "react";
import { Download, RefreshCw, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { useAppUpdater } from "@/hooks/useAppUpdater";

type UpdaterState = ReturnType<typeof useAppUpdater>;

/** Mensagem de status por estado do updater — braços disjuntos por `status`. */
const statusMessage = (updater: UpdaterState): string => {
  switch (updater.status) {
    case "checking":
      return "Consultando GitHub Releases em busca de novas versões...";
    case "downloading":
      return `Baixando atualização (${updater.progress?.percent ?? 0}%)...`;
    case "ready-to-restart":
      return "Atualização baixada com sucesso! Reinicie o aplicativo para concluir.";
    case "available":
      return `Nova versão ${updater.updateInfo?.version} disponível para instalação!`;
    case "up-to-date":
      return "Você está utilizando a versão mais recente do Saruê UnB.";
    case "error":
      return `Não foi possível verificar atualizações: ${updater.errorMessage}`;
    case "idle":
      return "Mantenha o Saruê UnB sempre atualizado com as últimas correções e novidades.";
  }
};

export const AppUpdaterCard: React.FC = () => {
  // O hook mora aqui de propósito: cada tick de progresso re-renderiza só
  // este card, não a tela de Settings inteira.
  const updater = useAppUpdater();
  const downloadPct = updater.progress?.percent ?? 0;
  const isDownloading = updater.status === "downloading";
  const isChecking = updater.status === "checking";

  return (
    // Mesma seção padrão das demais (ícone w-4 + rótulo gritado): a tela
    // inteira compartilha uma anatomia só de cabeçalho.
    <SettingsSection icon={Sparkles} label="Atualizações do aplicativo">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs font-semibold text-neutral-600">
          {statusMessage(updater)}
        </p>

        <div className="flex items-center gap-2 shrink-0">
          {updater.status === "ready-to-restart" ? (
            <Button
              type="button"
              variant="accent"
              size="md"
              onClick={() => updater.relaunchApp()}
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              <span>Reiniciar e Aplicar</span>
            </Button>
          ) : updater.status === "available" ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={isDownloading}
              onClick={() => updater.downloadAndInstall()}
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>
                {isDownloading ? `Baixando ${downloadPct}%` : "Baixar e Atualizar"}
              </span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="md"
              isLoading={isChecking}
              onClick={() => updater.checkForUpdates()}
            >
              <RefreshCw className="w-4 h-4 stroke-[2.5]" />
              <span>{isChecking ? "Verificando..." : "Verificar Atualizações"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Barra de progresso durante o download */}
      {isDownloading && updater.progress && (
        <div className="mt-4 pt-3 border-t-2 border-ink/10">
          <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden border-2 border-ink">
            <div
              className="h-full bg-neo-blue transition-[width] duration-300"
              style={{ width: `${downloadPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-bold text-neutral-600 mt-1.5">
            <span>
              Baixando arquivos da versão {updater.updateInfo?.version}...
            </span>
            <span>{downloadPct}%</span>
          </div>
        </div>
      )}
    </SettingsSection>
  );
};
