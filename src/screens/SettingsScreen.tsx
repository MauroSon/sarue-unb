import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Button,
  Input,
  Badge,
  PageContainer,
  PageHeader,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui";
import { useCredentials } from "../hooks/useCredentials";
import { useFeed } from "../hooks/useFeed";
import { notifyMyCourseListeners } from "../hooks/useMyCourse";
import { useContainer } from "../context/ContainerContext";
import {
  Settings,
  School,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Scale,
  GitBranch,
  Trash2,
  Save,
} from "lucide-react";

export interface SettingsScreenProps {
  onResetCredentials: () => void;
}

type FeedbackState = { type: "success" | "error"; message: string } | null;

const FEEDBACK_TIMEOUT_MS = 3000;

const FeedbackMessage: React.FC<{ feedback: FeedbackState }> = ({
  feedback,
}) => (
  <div
    role="status"
    aria-live="polite"
    className={`${feedback ? "mt-2" : ""} text-xs font-bold flex items-center gap-1 ${
      feedback?.type === "error" ? "text-ink-error" : "text-ink-success"
    }`}
  >
    {feedback ? (
      <>
        {feedback.type === "success" ? (
          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
        )}
        <span>{feedback.message}</span>
      </>
    ) : null}
  </div>
);

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onResetCredentials,
}) => {
  const { useCases } = useContainer();
  const { clearFeedData } = useFeed();
  const {
    allCredentials,
    saveSigaa,
    saveAprender3,
    saveTeams,
    clearPlatform,
    clearAll,
    refresh,
  } = useCredentials();

  // Estados locais dos formulários
  const [sigaaMat, setSigaaMat] = useState("");
  const [sigaaPass, setSigaaPass] = useState("");
  const [sigaaFeedback, setSigaaFeedback] = useState<FeedbackState>(null);

  const [aprenderCpf, setAprenderCpf] = useState("");
  const [aprenderPass, setAprenderPass] = useState("");
  const [aprenderFeedback, setAprenderFeedback] = useState<FeedbackState>(null);

  const [teamsEmail, setTeamsEmail] = useState("");
  const [teamsFeedback, setTeamsFeedback] = useState<FeedbackState>(null);

  const [isWiping, setIsWiping] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Efeito de contagem regressiva de 3 segundos para liberação do botão de confirmação
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (isConfirmDialogOpen) {
      setCountdown(3);
      intervalId = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (intervalId) clearInterval(intervalId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(3);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isConfirmDialogOpen]);

  // Senhas salvas ficam apenas em refs — nunca são reexibidas nos inputs
  const sigaaPassRef = useRef("");
  const aprenderPassRef = useRef("");

  // Timers de feedback (limpos no unmount para evitar setState após desmontar)
  const feedbackTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const timers = feedbackTimersRef.current;
    return () => {
      timers.forEach((id) => clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    if (allCredentials.sigaa) {
      setSigaaMat(allCredentials.sigaa.matricula || "");
      sigaaPassRef.current = allCredentials.sigaa.senha || "";
    }
    if (allCredentials.aprender3) {
      setAprenderCpf(allCredentials.aprender3.cpf || "");
      aprenderPassRef.current = allCredentials.aprender3.senha || "";
    }
    if (allCredentials.teams) {
      setTeamsEmail(allCredentials.teams.email || "");
    }
  }, [allCredentials]);

  const setTimedFeedback = (
    setter: React.Dispatch<React.SetStateAction<FeedbackState>>,
    next: NonNullable<FeedbackState>,
  ) => {
    setter(next);
    feedbackTimersRef.current.push(
      setTimeout(() => setter(null), FEEDBACK_TIMEOUT_MS),
    );
  };

  const handleSaveSigaa = async () => {
    setSigaaFeedback(null);
    const senha = sigaaPass || sigaaPassRef.current;
    const ok = await saveSigaa({ matricula: sigaaMat, senha });
    if (ok) sigaaPassRef.current = senha;
    setTimedFeedback(
      setSigaaFeedback,
      ok
        ? {
            type: "success",
            message: "Credenciais do SIGAA atualizadas com sucesso!",
          }
        : { type: "error", message: "Falha ao salvar SIGAA" },
    );
  };

  const handleSaveAprender3 = async () => {
    setAprenderFeedback(null);
    const senha = aprenderPass || aprenderPassRef.current;
    const ok = await saveAprender3({ cpf: aprenderCpf, senha });
    if (ok) aprenderPassRef.current = senha;
    setTimedFeedback(
      setAprenderFeedback,
      ok
        ? {
            type: "success",
            message: "Credenciais do Aprender 3 atualizadas com sucesso!",
          }
        : { type: "error", message: "Falha ao salvar Aprender 3" },
    );
  };

  const handleToggleTeams = async () => {
    setTeamsFeedback(null);
    const isCurrentlyConnected = Boolean(allCredentials.teams?.isConnected);
    if (isCurrentlyConnected) {
      await clearPlatform("teams");
      setTimedFeedback(setTeamsFeedback, {
        type: "success",
        message: "Microsoft Teams desconectado.",
      });
    } else {
      const ok = await saveTeams({
        isConnected: true,
        email: teamsEmail || "aluno@aluno.unb.br",
      });
      setTimedFeedback(
        setTeamsFeedback,
        ok
          ? {
              type: "success",
              message: "Microsoft Teams conectado com sucesso!",
            }
          : { type: "error", message: "Falha ao conectar Microsoft Teams" },
      );
    }
  };

  const handleConfirmWipe = async () => {
    setIsWiping(true);
    try {
      // 1. Apaga credenciais salvas no cofre seguro (Stronghold)
      await clearAll();
      // 2. Apaga feed, turmas e associações (SQLite + memória)
      await clearFeedData();
      // 3. Apaga rascunhos de grade horária (SQLite + memória)
      await useCases.manageGrade.clear();
      // 4. Apaga perfil acadêmico e histórico escolar (Meu Curso)
      await useCases.manageAcademicProfile.clearProfile();
      notifyMyCourseListeners();
      // 5. Limpa preferências auxiliares e perfil do localStorage
      try {
        localStorage.removeItem("unb_grade_deptId");
        localStorage.removeItem("unb_grade_year");
        localStorage.removeItem("unb_grade_period");
        localStorage.removeItem("unb_aggregator_academic_profile_v1");
      } catch {}
      // 6. Fecha o diálogo e redireciona
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
      <PageHeader
        icon={Settings}
        title="Configuração de Acesso das Plataformas"
      />

      {/* Grid de Configuração por Plataforma */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card SIGAA */}
        <Card className="bg-white rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-platform-sigaa text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000]">
                  <School className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="font-bold text-base text-black">SIGAA</h3>
              </div>
              <Badge
                variant={allCredentials.sigaa?.matricula ? "sigaa" : "neutral"}
              >
                {allCredentials.sigaa?.matricula ? "Configurado" : "Pendente"}
              </Badge>
            </div>

            <p className="text-xs font-medium text-neutral-600 mb-3">
              Requer matrícula institucional e senha do portal do discente.
            </p>

            <div className="space-y-2">
              <Input
                label="Matrícula"
                placeholder="Ex: 202012345"
                value={sigaaMat}
                onChange={(e) => setSigaaMat(e.target.value)}
              />
              <Input
                type="password"
                label="Senha"
                placeholder={
                  allCredentials.sigaa?.senha
                    ? "•••••• (senha salva — digite para trocar)"
                    : "Senha do SIGAA"
                }
                value={sigaaPass}
                onChange={(e) => setSigaaPass(e.target.value)}
              />
            </div>

            <FeedbackMessage feedback={sigaaFeedback} />
          </div>

          <div className="pt-4 border-t-2 border-black/10 mt-4 flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSaveSigaa}
            >
              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Salvar SIGAA</span>
            </Button>
          </div>
        </Card>

        {/* Card Aprender 3 */}
        <Card className="bg-white rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-platform-aprender3 text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000]">
                  <BookOpen className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="font-bold text-base text-black">Aprender 3</h3>
              </div>
              <Badge
                variant={
                  allCredentials.aprender3?.cpf ? "aprender3" : "neutral"
                }
              >
                {allCredentials.aprender3?.cpf ? "Configurado" : "Pendente"}
              </Badge>
            </div>

            <p className="text-xs font-medium text-neutral-600 mb-3">
              Requer CPF (11 dígitos) e senha cadastrada no ambiente Moodle
              institucional.
            </p>

            <div className="space-y-2">
              <Input
                label="CPF"
                placeholder="Ex: 000.000.000-00"
                value={aprenderCpf}
                onChange={(e) => setAprenderCpf(e.target.value)}
              />
              <Input
                type="password"
                label="Senha"
                placeholder={
                  allCredentials.aprender3?.senha
                    ? "•••••• (senha salva — digite para trocar)"
                    : "Senha do Aprender 3"
                }
                value={aprenderPass}
                onChange={(e) => setAprenderPass(e.target.value)}
              />
            </div>

            <FeedbackMessage feedback={aprenderFeedback} />
          </div>

          <div className="pt-4 border-t-2 border-black/10 mt-4 flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSaveAprender3}
            >
              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Salvar Aprender 3</span>
            </Button>
          </div>
        </Card>

        {/* Card Microsoft Teams */}
        <Card className="bg-white rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-platform-teams text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000]">
                  <MessageSquare className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="font-bold text-base text-black">Teams</h3>
              </div>
              <Badge
                variant={
                  allCredentials.teams?.isConnected ? "teams" : "neutral"
                }
              >
                {allCredentials.teams?.isConnected
                  ? "Conectado"
                  : "Não Conectado"}
              </Badge>
            </div>

            <p className="text-xs font-medium text-neutral-600 mb-3">
              Autenticação interativa manual requerida devido ao SSO Microsoft
              365 da UnB.
            </p>

            <div className="space-y-2">
              <Input
                label="E-mail Institucional UnB"
                placeholder="Ex: aluno@aluno.unb.br"
                value={teamsEmail}
                onChange={(e) => setTeamsEmail(e.target.value)}
              />
            </div>

            <FeedbackMessage feedback={teamsFeedback} />
          </div>

          <div className="pt-4 border-t-2 border-black/10 mt-4 flex justify-end">
            <Button
              type="button"
              variant={
                allCredentials.teams?.isConnected ? "destructive" : "primary"
              }
              size="md"
              onClick={handleToggleTeams}
            >
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>
                {allCredentials.teams?.isConnected
                  ? "Desconectar Teams"
                  : "Conectar Teams"}
              </span>
            </Button>
          </div>
        </Card>
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
            onClick={() => setIsConfirmDialogOpen(true)}
            className="shrink-0"
          >
            <Trash2 className="w-4 h-4 stroke-[2.5]" />
            <span>Apagar Dados e Credenciais</span>
          </Button>
        </div>
      </Card>

      {/* Diálogo de Confirmação com Contagem Regressiva de 3 segundos */}
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
              <DialogTitle>Apagar Todos os Dados e Credenciais?</DialogTitle>
            </div>
            <DialogDescription>
              Esta ação é definitiva e irreversível. Todos os dados armazenados
              do UnB Aggregator neste dispositivo serão permanentemente
              excluídos
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
              disabled={countdown > 0 || isWiping}
              isLoading={isWiping}
              onClick={handleConfirmWipe}
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" />
              <span>
                {countdown > 0
                  ? `Confirmar (${countdown}s)`
                  : "Confirmar Exclusão"}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};
