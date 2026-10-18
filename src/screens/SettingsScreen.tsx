import React, { useState } from "react";
import {
  Card,
  Button,
  PageContainer,
  PageHeader,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui";
import { PlatformAccountsAccordion } from "@/components/onboarding/PlatformAccountsAccordion";
import { useCredentials } from "../hooks/useCredentials";
import { useFeed } from "../hooks/useFeed";
import { resetMyCourseCache } from "../hooks/useMyCourse";
import { useContainer } from "../context/ContainerContext";
import { useOptionalSync } from "../context/SyncContext";
import { Settings, AlertCircle, Scale, GitBranch, Trash2, RotateCcw } from "lucide-react";

export interface SettingsScreenProps {
  onResetCredentials: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onResetCredentials,
}) => {
  const { useCases } = useContainer();
  const { clearFeedData } = useFeed();
  const { clearAll, allCredentials } = useCredentials();
  const syncContext = useOptionalSync();

  // Modo explorar: nenhuma conta conectada — o botão da zona de perigo vira
  // "Voltar para o Onboarding", mas a ação continua apagando tudo (grades,
  // feed e dados locais editados durante a exploração).
  const hasAnyAccount = Boolean(
    allCredentials.sigaa || allCredentials.aprender3 || allCredentials.teams?.isConnected,
  );

  const [isWiping, setIsWiping] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const handleConfirmWipe = async () => {
    setIsWiping(true);
    try {
      // 0. Interrompe imediatamente qualquer sincronização em andamento e fecha janelas do Teams
      syncContext?.cancelSync();
      // 1. Apaga credenciais salvas no cofre seguro (Stronghold + flags instantâneas)
      await clearAll();
      // 2. Apaga feed, turmas e associações (SQLite + memória)
      await clearFeedData();
      // 3. Apaga rascunhos de grade horária (SQLite + memória)
      await useCases.manageGrade.clear();
      // 4. Apaga perfil acadêmico e histórico escolar (Meu Curso)
      await useCases.manageAcademicProfile.clearProfile();
      resetMyCourseCache();
      // 5. Limpa preferências auxiliares e perfil do localStorage
      try {
        localStorage.removeItem("unb_grade_deptId");
        localStorage.removeItem("unb_grade_year");
        localStorage.removeItem("unb_grade_period");
        localStorage.removeItem("unb_aggregator_academic_profile_v1");
      } catch {}
      // 6. Fecha o diálogo e redireciona imediatamente para o onboarding
      setIsConfirmDialogOpen(false);
      onResetCredentials();
    } catch (err) {
      console.error("Erro ao apagar todos os dados:", err);
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <PageContainer>
      {/* Título Padronizado da Página com Ícone da Sidebar */}
      <PageHeader icon={Settings} title="Configuração de Acesso das Plataformas" />

      {/* Mesma UX do onboarding: adesivos expansíveis por plataforma */}
      <div className="max-w-2xl">
        <PlatformAccountsAccordion animated={false} initialOpenPlatform={null} allowAllClosed />
      </div>

      {/* Licença e Código Aberto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t-2 border-black/10">
        <Card className="bg-white rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Scale className="w-4 h-4 stroke-[2.5] text-neo-blue" />
            <h4 className="text-xs font-bold text-black">Licença Apache 2.0</h4>
          </div>
          <p className="text-xs text-neutral-600 font-medium leading-relaxed">
            Software livre e transparente para a comunidade acadêmica da
            Universidade de Brasília.
          </p>
        </Card>

        <Card className="bg-white rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <GitBranch className="w-4 h-4 stroke-[2.5] text-neo-blue" />
            <h4 className="text-xs font-bold text-black">
              Auditoria Pública no GitHub
            </h4>
          </div>
          <p className="text-xs text-neutral-600 font-medium leading-relaxed">
            Código-fonte disponível publicamente para colaboração e inspeção de
            segurança.
          </p>
        </Card>
      </div>

      {/* Zona de Perigo / Limpeza */}
      <Card className="border-2 border-neo-danger bg-red-50 rounded-lg p-5 shadow-[4px_4px_0px_0px_#000]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-ink-error mb-1">
              <AlertCircle className="w-5 h-5 stroke-[2.5]" />
              <h4 className="text-sm font-black uppercase tracking-tight">
                Redefinir Acessos e Dados
              </h4>
            </div>
            <p className="text-xs font-semibold text-neutral-700">
              Apaga permanentemente todas as credenciais salvas, avisos do feed,
              disciplinas e dados locais, retornando o aplicativo ao estado
              inicial.
            </p>
          </div>

          <Button
            type="button"
            variant="destructive"
            size="md"
            onClick={() => {
              // Interrompe imediatamente qualquer sincronização que esteja rodando
              syncContext?.cancelSync();
              if (hasAnyAccount) setIsConfirmDialogOpen(true);
              else void handleConfirmWipe();
            }}
            className="shrink-0"
          >
            {hasAnyAccount ? (
              <Trash2 className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>
              {hasAnyAccount ? "Apagar Dados e Credenciais" : "Voltar para o Onboarding"}
            </span>
          </Button>
        </div>
      </Card>

      {/* Mascote Saruê dormindo no final da página */}
      <div className="pt-8 pb-4 flex flex-col items-center justify-center text-center">
        <img
          src="/sarue-sleep.png"
          alt="Mascote Saruê dormindo"
          className="w-48 md:w-60 h-auto object-contain select-none pointer-events-none"
        />
        <p className="text-xs font-bold text-neutral-500 mt-2">
          Saruê UnB • Tudo configurado e seguro neste dispositivo
        </p>
      </div>

      {/* Diálogo de Confirmação */}
      <Dialog
        open={isConfirmDialogOpen}
        onOpenChange={(open) => {
          if (!open && !isWiping) {
            setIsConfirmDialogOpen(false);
          }
        }}
      >
        <DialogContent showCloseButton={!isWiping} className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-lg bg-neo-danger text-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                <Trash2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <DialogTitle>
                {hasAnyAccount
                  ? "Apagar Todos os Dados e Credenciais?"
                  : "Apagar Dados e Voltar ao Onboarding?"}
              </DialogTitle>
            </div>
            <DialogDescription>
              Esta ação é definitiva e irreversível. Todos os dados armazenados
              do Saruê UnB neste dispositivo serão permanentemente
              excluídos.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={isWiping}
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="md"
              disabled={isWiping}
              isLoading={isWiping}
              onClick={handleConfirmWipe}
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" />
              <span>Confirmar Exclusão</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};
