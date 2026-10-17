import React, { useState, useMemo } from "react";
import { useMyCourse } from "../hooks/useMyCourse";
import { FlowchartStats } from "../components/flowchart/FlowchartStats";
import { FlowchartList } from "../components/flowchart/FlowchartList";
import { CurrentlyEnrolledPanel } from "../components/flowchart/CurrentlyEnrolledPanel";
import { CurriculumSelectorDialog } from "../components/flowchart/CurriculumSelectorDialog";
import { MyCourseSkeleton } from "../components/flowchart/MyCourseSkeleton";
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
} from "lucide-react";

type FilterType = "all" | "completed" | "available" | "in_progress";

export const MyCourseScreen: React.FC = () => {
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCurriculumDialogOpen(true)}
                title="Trocar ou explorar outra matriz curricular da UnB"
              >
                <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
                Trocar Matriz
              </Button>
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
          {flowchartData && <FlowchartStats metrics={flowchartData.metrics} />}

          {/* Painel "Cursando agora" — resposta direta a "o que estou fazendo neste semestre?" */}
          <CurrentlyEnrolledPanel
            disciplines={inProgressDisciplines}
            searchQuery={searchQuery}
          />

          {/* Lista de disciplinas: busca embutida no cabeçalho do card */}
          {flowchartData && (
            <section
              className="bg-white border-2 border-black rounded-lg shadow-neo"
              aria-label="Fluxograma de disciplinas por semestre"
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
                  <button
                    type="button"
                    onClick={() => setActiveFilter("all")}
                    aria-pressed={activeFilter === "all"}
                    className={`cursor-pointer px-2.5 py-1 rounded-lg border-2 transition-all shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-neo-xs active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                      activeFilter === "all"
                        ? "bg-black text-white border-black shadow-neo-sm"
                        : "bg-white text-black border-black hover:bg-neutral-100"
                    }`}
                  >
                    Todas (
                    {flowchartData?.metrics.totalMandatoryDisciplines || 0})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilter("completed")}
                    aria-pressed={activeFilter === "completed"}
                    className={`cursor-pointer px-2.5 py-1 rounded-lg border-2 transition-all flex items-center gap-1 shadow-neo-sm hover:shadow-neo-xs hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                      activeFilter === "completed"
                        ? "bg-neo-green text-black border-black shadow-neo-sm"
                        : "bg-pastel-green text-black border-black hover:bg-neutral-100"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    Feitas (
                    {flowchartData?.metrics.completedMandatoryDisciplines || 0})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilter("in_progress")}
                    aria-pressed={activeFilter === "in_progress"}
                    className={`cursor-pointer px-2.5 py-1 rounded-lg border-2 transition-all flex items-center gap-1 shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-neo-xs active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                      activeFilter === "in_progress"
                        ? "bg-neo-blue text-white border-black shadow-neo-sm"
                        : "bg-pastel-blue text-black border-black hover:bg-neutral-100"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                    Cursando ({flowchartData?.metrics.inProgressCount || 0})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilter("available")}
                    aria-pressed={activeFilter === "available"}
                    className={`cursor-pointer px-2.5 py-1 rounded-lg border-2 transition-all flex items-center gap-1 shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-neo-xs active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                      activeFilter === "available"
                        ? "bg-neo-yellow text-black border-black shadow-neo-sm"
                        : "bg-pastel-yellow text-black border-black hover:bg-neo-yellow/40"
                    }`}
                  >
                    <Unlock className="w-3.5 h-3.5 stroke-[2.5]" />
                    Prontas ({flowchartData?.metrics.availableCount || 0})
                  </button>
                </div>
              </div>
              <FlowchartList
                semesters={flowchartData.semesters}
                visibleCodes={filteredCodesSet}
                disciplineNames={disciplineNames}
                onToggle={toggleDiscipline}
              />
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
