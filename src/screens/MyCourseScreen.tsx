import React, { useState, useMemo } from "react";
import { useMyCourse } from "../hooks/useMyCourse";
import { FlowchartStats } from "../components/flowchart/FlowchartStats";
import { IraCalculatorScreen } from "./IraCalculatorScreen";
import { CurriculumEditorScreen } from "./CurriculumEditorScreen";
import { FlowchartList } from "../components/flowchart/FlowchartList";
import { FlowchartDiagram } from "../components/flowchart/FlowchartDiagram";
import { CurrentlyEnrolledPanel } from "../components/flowchart/CurrentlyEnrolledPanel";
import { CurriculumSelectorDialog } from "../components/flowchart/CurriculumSelectorDialog";
import { MyCourseSkeleton } from "../components/flowchart/MyCourseSkeleton";
import { useContainer } from "../context/ContainerContext";
import { sendDisciplineToGradeAction } from "../hooks/useGrade";
import {
  PageContainer,
  PageHeader,
  Button,
  Input,
  EmptyState,
} from "@/components/ui";
import {
  GraduationCap,
  SlidersHorizontal,
  RotateCcw,
  Search,
  CheckCircle2,
  Unlock,
  Clock,
  BookOpen,
  List,
  Network,
} from "lucide-react";

type FilterType = "all" | "completed" | "available" | "in_progress";
type ViewMode = "list" | "map";

// Modo de visualização persiste durante a sessão: voltar de outra aba não reseta
let cachedViewMode: ViewMode = "list";

export const MyCourseScreen: React.FC = () => {
  const container = useContainer();
  const {
    profile,
    curriculum,
    allCurricula,
    flowchartData,
    disciplineNames,
    isLoading,
    toggleDiscipline,
    resetOverrides,
    selectCurriculum,
  } = useMyCourse();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [isCurriculumDialogOpen, setIsCurriculumDialogOpen] = useState(false);
  const [view, setView] = useState<"overview" | "ira-calculator" | "curriculum-editor">("overview");
  const [viewMode, setViewMode] = useState<ViewMode>(cachedViewMode);

  const switchViewMode = (mode: ViewMode) => {
    cachedViewMode = mode;
    setViewMode(mode);
  };

  // Filtra as disciplinas para o modo lista
  const filteredDisciplinesForList = useMemo(() => {
    if (!flowchartData) return [];
    const all: (typeof flowchartData.semesters)[0]["disciplines"] = [];
    for (const sem of flowchartData.semesters) {
      all.push(...sem.disciplines);
    }

    // Busca normalizada: sem acento e sem diferença de caixa
    const norm = (v: string) =>
      v
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    const query = norm(searchQuery);

    return all.filter((d) => {
      const matchSearch =
        query === "" ||
        norm(d.code).includes(query) ||
        norm(d.name).includes(query);

      const matchFilter = activeFilter === "all" || d.status === activeFilter;

      return matchSearch && matchFilter;
    });
  }, [flowchartData, searchQuery, activeFilter]);

  const filteredCodesSet = useMemo(() => {
    return new Set(filteredDisciplinesForList.map((d) => d.code));
  }, [filteredDisciplinesForList]);

  // Disciplinas matriculadas (MATRICULADA no SIGAA): a resposta direta a "o que estou fazendo agora?"
  const inProgressDisciplines = useMemo(() => {
    if (!flowchartData) return [];
    if (
      flowchartData.inProgressDisciplines &&
      flowchartData.inProgressDisciplines.length > 0
    ) {
      return flowchartData.inProgressDisciplines;
    }
    return flowchartData.semesters.flatMap((s) =>
      s.disciplines.filter((d) => d.status === "in_progress"),
    );
  }, [flowchartData]);

  // Trocar Matriz só oferece estruturas do próprio curso — o curso vem do histórico SIGAA
  const courseCurricula = useMemo(() => {
    const norm = (v: string) =>
      v
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    const course = norm(profile?.courseName || "");
    if (!course) return allCurricula;
    // Direção única: o nome da matriz precisa conter o nome completo do curso do
    // histórico — o inverso deixava passar cursos como "Engenharia" e "Computação"
    const matched = allCurricula.filter((c) =>
      norm(c.courseName || "").includes(course),
    );
    // Nunca deixa o diálogo vazio se o casamento por nome falhar
    return matched.length > 0 ? matched : allCurricula;
  }, [allCurricula, profile?.courseName]);

  if (view === "ira-calculator") {
    return <IraCalculatorScreen onBack={() => setView("overview")} />;
  }

  if (view === "curriculum-editor") {
    return <CurriculumEditorScreen onBack={() => setView("overview")} />;
  }

  if (isLoading && !profile) {
    return (
      <PageContainer>
        <MyCourseSkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Cabeçalho da Página com Ações Rápidas */}
      <PageHeader
        title="Meu Curso"
        icon={GraduationCap}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {((profile?.manualCompletedCodes?.length || 0) > 0 ||
              (profile?.manualUncompletedCodes?.length || 0) > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetOverrides}
                className="text-xs shrink-0"
                title="Restaurar o estado original vindo do histórico"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Resetar (
                {(profile?.manualCompletedCodes?.length || 0) +
                  (profile?.manualUncompletedCodes?.length || 0)}{" "}
                alterações)
              </Button>
            )}

            {profile && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setView("curriculum-editor")}
                  title="Editar disciplinas, inserir optativas ou customizar o currículo"
                >
                  <BookOpen className="w-4 h-4 stroke-[2.5]" />
                  Gerenciar Currículo
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCurriculumDialogOpen(true)}
                  title="Trocar ou explorar outra matriz curricular da UnB"
                >
                  <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
                  Trocar Matriz
                </Button>
              </>
            )}
          </div>
        }
      />

      {!profile ? (
        <EmptyState
          icon={GraduationCap}
          title="Nenhum Perfil Acadêmico Carregado"
          description={
            <>
              Sincronize com o SIGAA na aba <strong>Configurações</strong> para
              carregar seu curso, disciplinas cursadas, IRA e acompanhar seu
              progresso no fluxograma.
            </>
          }
          className="mb-6"
        />
      ) : (
        <>
          {/* Banner de Identificação do Discente (@DESIGN.md) */}
          <div className="bg-white border-2 border-black rounded-lg p-5 mb-6 shadow-neo">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center flex-wrap">
                <span className="text-lg font-black text-black tracking-tight">
                  {profile.courseName ||
                    curriculum?.courseName ||
                    "Curso de Graduação"}
                </span>
              </div>
            </div>
          </div>

          {/* Painel de Métricas e Integralização */}
          {flowchartData && (
            <FlowchartStats
              metrics={flowchartData.metrics}
              onOpenIraCalculator={() => setView("ira-calculator")}
            />
          )}

          {/* Painel "Cursando agora" — resposta direta a "o que estou fazendo neste semestre?" */}
          <CurrentlyEnrolledPanel
            disciplines={inProgressDisciplines}
            searchQuery={searchQuery}
          />

          {/* Lista de disciplinas: busca embutida no cabeçalho do card */}
          {flowchartData && (
            <section
              className="bg-white border-2 border-black rounded-lg shadow-neo"
              aria-label={
                viewMode === "list"
                  ? "Fluxograma de disciplinas por semestre"
                  : "Mapa de cadeias de pré-requisitos"
              }
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 border-b-2 border-black">
                <div className="relative flex-1 min-w-0 lg:max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por código ou nome (ex: APC, Cálculo, CIC0004)..."
                    aria-label="Buscar disciplina por código ou nome"
                    className="pl-9 h-9 text-xs bg-white"
                  />
                </div>

                {/* Filtros de Estado */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold lg:ml-auto">
                  {/* Estado ativo usa o variant do Button; inativo sobrescreve o bg pastel via className (twMerge resolve conflito) */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveFilter("all")}
                    aria-pressed={activeFilter === "all"}
                    className={
                      activeFilter === "all"
                        ? "bg-black text-white hover:bg-black"
                        : "hover:bg-white"
                    }
                  >
                    Todas (
                    {flowchartData?.metrics.totalMandatoryDisciplines || 0})
                  </Button>

                  <Button
                    type="button"
                    variant={activeFilter === "completed" ? "accent" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter("completed")}
                    aria-pressed={activeFilter === "completed"}
                    className={
                      activeFilter === "completed"
                        ? "gap-1"
                        : "gap-1 bg-pastel-green text-black hover:bg-pastel-green"
                    }
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    ({flowchartData?.metrics.completedMandatoryDisciplines || 0})
                  </Button>

                  <Button
                    type="button"
                    variant={activeFilter === "in_progress" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter("in_progress")}
                    aria-pressed={activeFilter === "in_progress"}
                    className={
                      activeFilter === "in_progress"
                        ? "gap-1"
                        : "gap-1 bg-pastel-blue text-black hover:bg-pastel-blue"
                    }
                  >
                    <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                    ({flowchartData?.metrics.inProgressCount || 0})
                  </Button>

                  <Button
                    type="button"
                    variant={activeFilter === "available" ? "yellow" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter("available")}
                    aria-pressed={activeFilter === "available"}
                    className={
                      activeFilter === "available"
                        ? "gap-1"
                        : "gap-1 bg-pastel-yellow text-black hover:bg-neo-yellow/40"
                    }
                  >
                    <Unlock className="w-3.5 h-3.5 stroke-[2.5]" />
                    ({flowchartData?.metrics.availableCount || 0})
                  </Button>
                </div>

                {/* Alternador Lista | Mapa */}
                <div
                  role="group"
                  aria-label="Modo de visualização do fluxograma"
                  className="flex items-center gap-0.5 p-0.5 bg-white border-2 border-black rounded-xl shadow-neo-sm shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => switchViewMode("list")}
                    aria-pressed={viewMode === "list"}
                    title="Visualização em lista por semestre"
                    className={`cursor-pointer flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-black transition-colors duration-150 active:translate-y-px ${
                      viewMode === "list"
                        ? "bg-neo-blue text-white"
                        : "bg-white text-black hover:bg-neutral-100"
                    }`}
                  >
                    <List className="w-3.5 h-3.5 stroke-[2.5]" />
                    Lista
                  </button>
                  <button
                    type="button"
                    onClick={() => switchViewMode("map")}
                    aria-pressed={viewMode === "map"}
                    title="Visualização em mapa de cadeias de pré-requisitos"
                    className={`cursor-pointer flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-black transition-colors duration-150 active:translate-y-px ${
                      viewMode === "map"
                        ? "bg-neo-blue text-white"
                        : "bg-white text-black hover:bg-neutral-100"
                    }`}
                  >
                    <Network className="w-3.5 h-3.5 stroke-[2.5]" />
                    Mapa
                  </button>
                </div>
              </div>
              {viewMode === "list" ? (
                <FlowchartList
                  semesters={flowchartData.semesters}
                  visibleCodes={filteredCodesSet}
                  disciplineNames={disciplineNames}
                  onToggle={toggleDiscipline}
                  onSendToGrade={(code, name) =>
                    sendDisciplineToGradeAction(container, code, name)
                  }
                />
              ) : (
                <FlowchartDiagram
                  flowchartData={flowchartData}
                  visibleCodes={filteredCodesSet}
                  onToggle={toggleDiscipline}
                  onSendToGrade={(code, name) =>
                    sendDisciplineToGradeAction(container, code, name)
                  }
                />
              )}
            </section>
          )}

          {/* Seção de Optativas Cursadas pelo Discente */}
          {(flowchartData?.electiveCompletedDisciplines?.length || 0) > 0 && (
            <div className="mt-8 bg-white border-2 border-black rounded-xl p-5 shadow-neo">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-black stroke-[2.5]" />
                <h3 className="font-black text-sm text-black">
                  Optativas & Componentes Fora da Grade Obrigatória (
                  {flowchartData?.electiveCompletedDisciplines.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {flowchartData?.electiveCompletedDisciplines.map((d) => (
                  <div
                    key={d.code}
                    className="bg-neutral-50 border-2 border-black rounded-lg p-2.5 shadow-neo-sm flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-mono text-[11px] font-black bg-white px-1.5 py-0.5 border border-black rounded">
                          {d.code}
                        </span>
                        {d.workloadHours && (
                          <span className="text-[11px] font-bold text-neutral-600">
                            {d.workloadHours}h
                          </span>
                        )}
                      </div>
                      <p
                        className="text-xs font-black truncate text-black"
                        title={d.name}
                      >
                        {d.name}
                      </p>
                    </div>

                    <span className="text-[11px] font-black px-1.5 py-0.5 bg-neo-green border border-black rounded-md shrink-0">
                      {d.grade || "AP"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Diálogos modais */}
      <CurriculumSelectorDialog
        isOpen={isCurriculumDialogOpen}
        onClose={() => setIsCurriculumDialogOpen(false)}
        curricula={courseCurricula}
        currentCurriculumId={curriculum?.id}
        currentCurriculumCode={curriculum?.code || profile?.curriculumCode}
        initialCourseName={profile?.courseName}
        onSelect={selectCurriculum}
      />
    </PageContainer>
  );
};
