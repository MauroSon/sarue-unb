import React, { useState, useEffect } from "react";
import { useFeed } from "../hooks/useFeed";
import {
  Card,
  Badge,
  PageContainer,
  PageHeader,
  Button,
  Tabs,
  Pagination,
  toast,
  EmptyState,
  Skeleton,
} from "@/components/ui";
import {
  GraduationCap,
  User,
  MapPin,
  Clock,
  CheckSquare,
  MessageSquare,
  ExternalLink,
  ArrowLeft,
  Inbox,
  AlertCircle,
  Link2,
  Search,
  BookOpen,
  Folder,
} from "lucide-react";
import { openExternalUrl } from "../lib/utils";
import { UnmatchedCourseDialog } from "../components/UnmatchedCourseDialog";
import { FeedList } from "../components/feed/FeedList";
import { ArchivedToggleButton } from "../components/feed/ArchivedToggleButton";
import type { Course, Discipline, FeedItemType } from "@/core";

export const CoursesScreen: React.FC = () => {
  const {
    disciplines,
    unmatchedCourses,
    otherCourses,
    items,
    isLoading,
    hasLoadedOnce,
    toggleTaskCompleted,
    archiveFeedItem,
    showArchived,
    setShowArchived,
    associateCourse,
  } = useFeed();

  const [selectedDiscipline, setSelectedDiscipline] =
    useState<Discipline | null>(null);
  const [resolvingCourse, setResolvingCourse] = useState<Course | null>(null);
  const [drillSearchQuery, setDrillSearchQuery] = useState<string>("");
  const [drillCategory, setDrillCategory] = useState<FeedItemType | "all">(
    "all",
  );

  // Paginação client-side do feed da disciplina: 25 por página, reset ao trocar de vista/filtro
  const DRILL_PAGE_SIZE = 25;
  const [drillPage, setDrillPage] = useState(1);
  useEffect(() => {
    setDrillPage(1);
  }, [selectedDiscipline, drillSearchQuery, drillCategory, showArchived]);

  const handleArchive = async (id: string) => {
    await archiveFeedItem(id, true);
    toast.add({
      title: "Item arquivado",
      description: "O item foi movido para os Arquivados.",
      type: "info",
      timeout: 5000,
    });
  };

  const handleRestore = async (id: string) => {
    await archiveFeedItem(id, false);
    toast.add({
      title: "Item desarquivado",
      description: "O item retornou ao feed ativo da disciplina.",
      type: "success",
      timeout: 4000,
    });
  };

  const typeTabs = [
    { id: "all", label: "Tudo" },
    { id: "assignment", label: "Tarefas" },
    { id: "post", label: "Avisos" },
  ];

  // Exibe a modal automaticamente se houver turma não associada do Aprender 3
  useEffect(() => {
    if (unmatchedCourses.length > 0 && !resolvingCourse) {
      setResolvingCourse(unmatchedCourses[0]);
    }
  }, [unmatchedCourses, resolvingCourse]);

  if (isLoading && !hasLoadedOnce && !selectedDiscipline) {
    return (
      <PageContainer>
        <PageHeader icon={GraduationCap} title="Disciplinas do Semestre" />
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          role="status"
          aria-busy="true"
        >
          <span className="sr-only">Carregando disciplinas...</span>
          {[1, 2, 3, 4].map((i) => (
            <Card
              key={i}
              className="bg-white rounded-lg p-5 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-5 w-20 rounded-md" />
                </div>
                <Skeleton className="h-6 w-3/4 rounded-md" />
                <div className="flex gap-3 pt-1">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
              </div>
              <div className="pt-3 border-t-2 border-black/10 flex justify-between items-center">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  // Se o usuário selecionou uma disciplina para ver o feed exclusivo (Drill-Down)
  if (selectedDiscipline) {
    // Filtra os itens do feed pertencentes a esta disciplina (SIGAA + Aprender 3 associados) com busca e categoria
    const disciplineFeedItems = items.filter((item) => {
      const belongsToDiscipline =
        item.courseName === selectedDiscipline.name ||
        (selectedDiscipline.code &&
          item.courseCode === selectedDiscipline.code) ||
        selectedDiscipline.aprenderCourses.some(
          (ac) =>
            ac.name === item.courseName ||
            (ac.code && item.courseCode === ac.code),
        ) ||
        (selectedDiscipline.teamsCourses &&
          selectedDiscipline.teamsCourses.some(
            (tc) =>
              tc.name === item.courseName ||
              (tc.code && item.courseCode === tc.code),
          ));

      if (!belongsToDiscipline) return false;

      // Filtro por Categoria
      if (drillCategory !== "all" && item.itemType !== drillCategory) {
        return false;
      }

      // Filtro por Busca Textual
      if (drillSearchQuery.trim().length > 0) {
        const q = drillSearchQuery.trim().toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchContent = item.content.toLowerCase().includes(q);
        const matchAuthor = item.author?.toLowerCase().includes(q) ?? false;
        if (!matchTitle && !matchContent && !matchAuthor) {
          return false;
        }
      }

      return true;
    });
    const drillPageCount = Math.max(
      1,
      Math.ceil(disciplineFeedItems.length / DRILL_PAGE_SIZE),
    );
    const safeDrillPage = Math.min(drillPage, drillPageCount);
    const drillPageItems = disciplineFeedItems.slice(
      (safeDrillPage - 1) * DRILL_PAGE_SIZE,
      safeDrillPage * DRILL_PAGE_SIZE,
    );

    return (
      <PageContainer>
        {/* Título Padronizado da Página com Nome da Disciplina e Ação de Voltar */}
        <PageHeader
          icon={GraduationCap}
          title={selectedDiscipline.name}
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDiscipline(null);
                setDrillSearchQuery("");
                setDrillCategory("all");
                setShowArchived(false);
              }}
              className="cursor-pointer flex items-center gap-1.5 font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Voltar</span>
            </Button>
          }
        />

        {/* Detalhes e Acessos da Disciplina */}
        <div className="bg-white border-2 border-black rounded-lg p-6 shadow-[4px_4px_0px_0px_#000] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {selectedDiscipline.sigaaCourse ? (
                <Badge variant="sigaa">SIGAA</Badge>
              ) : null}
              {selectedDiscipline.aprenderCourses.map((ac) => (
                <Badge key={ac.id} variant="aprender3">
                  Aprender 3
                </Badge>
              ))}
              {selectedDiscipline.teamsCourses?.map((tc) => (
                <Badge key={tc.id} variant="teams">
                  Teams: {tc.name}
                </Badge>
              ))}
            </div>

            <span className="text-xs font-bold text-neutral-500">
              Semestre {selectedDiscipline.semester}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-semibold text-neutral-700 pt-1 border-t-2 border-black/10">
            {selectedDiscipline.professor ? (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 stroke-[2.5] text-neutral-500" />
                <span>{selectedDiscipline.professor}</span>
              </div>
            ) : null}

            {selectedDiscipline.classroom ? (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 stroke-[2.5] text-neutral-500" />
                <span>{selectedDiscipline.classroom}</span>
              </div>
            ) : null}

            {selectedDiscipline.schedule ? (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 stroke-[2.5] text-neutral-500" />
                <span>{selectedDiscipline.schedule}</span>
              </div>
            ) : null}
          </div>

          {/* Links diretos das plataformas vinculadas */}
          <div className="flex flex-wrap gap-2 pt-2">
            {selectedDiscipline.url ? (
              <Button
                type="button"
                size="sm"
                onClick={() => openExternalUrl(selectedDiscipline.url!)}
                className="bg-platform-sigaa hover:bg-neo-greenHover text-black"
              >
                <span>Acessar no SIGAA</span>
                <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
              </Button>
            ) : null}

            {selectedDiscipline.aprenderCourses.map((ac) =>
              ac.url ? (
                <Button
                  key={ac.id}
                  type="button"
                  size="sm"
                  onClick={() => openExternalUrl(ac.url!)}
                  className="bg-platform-aprender3 hover:bg-orange-400 text-black"
                >
                  <span>Acessar Turma no Aprender 3</span>
                  <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                </Button>
              ) : null,
            )}

            {selectedDiscipline.teamsCourses?.map((tc) =>
              tc.url ? (
                <Button
                  key={tc.id}
                  type="button"
                  size="sm"
                  onClick={() => openExternalUrl(tc.url!)}
                  className="bg-platform-teams hover:bg-violet-400 text-white"
                >
                  <span>Acessar Equipe no Teams</span>
                  <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                </Button>
              ) : null,
            )}
          </div>
        </div>

        {/* Barra de Filtros e Busca da Disciplina */}
        <div className="bg-white border-2 border-black rounded-lg p-5 shadow-[4px_4px_0px_0px_#000] space-y-4">
          {/* Campo de Busca Textual */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 stroke-[2.5]" />
            <input
              type="text"
              value={drillSearchQuery}
              onChange={(e) => setDrillSearchQuery(e.target.value)}
              placeholder="Buscar por título da tarefa, aviso ou conteúdo..."
              aria-label="Buscar no feed da disciplina"
              className="w-full bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-black border-2 border-black rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neo-blue transition-[transform,box-shadow,background-color,border-color] placeholder:text-neutral-400 shadow-none"
            />
          </div>

          {/* Linha de Filtro por Categoria */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-neutral-700 block">
                Categoria:
              </span>
              <Tabs
                items={typeTabs}
                activeId={drillCategory}
                onChange={(id) => setDrillCategory(id as FeedItemType | "all")}
              />
            </div>

            <div className="flex flex-wrap items-end gap-3">
              {drillSearchQuery || drillCategory !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setDrillSearchQuery("");
                    setDrillCategory("all");
                  }}
                  className="cursor-pointer rounded-xs text-xs font-bold text-neutral-500 hover:text-black underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2"
                >
                  Limpar filtros
                </button>
              ) : null}

              <ArchivedToggleButton
                showArchived={showArchived}
                onToggle={() => setShowArchived(!showArchived)}
              />
            </div>
          </div>
        </div>

        {/* Feed Filtrado desta Disciplina */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-600 px-1">
            <span>
              {showArchived ? "Arquivados da Matéria" : "Feed da Matéria"} (
              {disciplineFeedItems.length}{" "}
              {disciplineFeedItems.length === 1 ? "publicação" : "publicações"})
            </span>
            <span>Avisos e Tarefas</span>
          </div>

          {disciplineFeedItems.length === 0 ? (
            <EmptyState
              icon={Inbox}
              iconClassName="bg-canvas text-neo-blue"
              title={
                showArchived
                  ? "Nenhum item arquivado nesta matéria"
                  : "Nenhuma publicação encontrada"
              }
              description={
                showArchived && !drillSearchQuery && drillCategory === "all"
                  ? "Você ainda não arquivou nenhum aviso ou tarefa desta disciplina."
                  : drillSearchQuery || drillCategory !== "all"
                    ? "Nenhum aviso ou tarefa encontrado para os filtros selecionados nesta matéria."
                    : "Não há avisos ou tarefas registradas para esta disciplina até o momento."
              }
            />
          ) : (
            <>
              <Card className="p-0 overflow-hidden">
                <FeedList
                  items={drillPageItems}
                  disciplines={disciplines}
                  showDiscipline={false}
                  onToggleComplete={toggleTaskCompleted}
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                />
              </Card>
              <Pagination
                page={safeDrillPage}
                pageCount={drillPageCount}
                onPageChange={setDrillPage}
              />
            </>
          )}
        </div>
      </PageContainer>
    );
  }

  // View Principal: Lista de Disciplinas
  return (
    <PageContainer>
      {/* Título Padronizado da Página com Ícone da Sidebar */}
      <PageHeader icon={GraduationCap} title="Disciplinas do Semestre" />

      {/* Alerta caso haja turmas do Aprender 3 ou Teams não associadas */}
      {unmatchedCourses.length > 0 ? (
        <div className="bg-neo-yellow/20 border-2 border-black rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[4px_4px_0px_0px_#000]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neo-yellow border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#000]">
              <AlertCircle className="w-4 h-4 stroke-[2.5] text-black" />
            </div>
            <div>
              <p className="text-xs font-black text-black">
                {unmatchedCourses.length}{" "}
                {unmatchedCourses.length === 1
                  ? "turma externa aguarda associação"
                  : "turmas externas aguardam associação"}
              </p>
              <p className="text-[11px] font-medium text-neutral-700">
                Associe para exibir os comunicados e tarefas na matéria
                oficial do SIGAA ou direcione para a seção Outros.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setResolvingCourse(unmatchedCourses[0])}
            className="cursor-pointer shrink-0 flex items-center gap-1.5 text-xs bg-neo-blue text-white hover:bg-neo-blueHover"
          >
            <Link2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Associar Turma</span>
          </Button>
        </div>
      ) : null}

      {disciplines.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nenhuma disciplina no semestre"
          description='Clique em "Sincronizar" na barra lateral para carregar suas disciplinas do SIGAA e do Aprender 3.'
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {disciplines.map((discipline) => (
          <Card
            key={discipline.id}
            onClick={() => setSelectedDiscipline(discipline)}
            role="button"
            tabIndex={0}
            aria-label={`Ver feed da disciplina ${discipline.name}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedDiscipline(discipline);
              }
            }}
            className="cursor-pointer bg-white rounded-lg p-5 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow,background-color,border-color] duration-150 ease-out flex flex-col justify-between group"
          >
            <div>
              {/* Topo do card com plataformas integradas alinhadas à esquerda */}
              <div className="flex items-center gap-1.5 mb-2.5">
                {discipline.sigaaCourse ? (
                  <Badge variant="sigaa">SIGAA</Badge>
                ) : null}
                {discipline.aprenderCourses.length > 0 ? (
                  <Badge variant="aprender3">
                    Aprender 3
                    {discipline.aprenderCourses.length > 1
                      ? ` (${discipline.aprenderCourses.length})`
                      : ""}
                  </Badge>
                ) : null}
                {discipline.teamsCourses && discipline.teamsCourses.length > 0 ? (
                  <Badge variant="teams">
                    Teams
                    {discipline.teamsCourses.length > 1
                      ? ` (${discipline.teamsCourses.length})`
                      : ""}
                  </Badge>
                ) : null}
              </div>

              {/* Nome da disciplina */}
              <h3 className="text-base md:text-lg font-black text-black leading-snug mb-3 group-hover:text-neo-blue transition-colors">
                {discipline.name}
              </h3>

              {/* Informações detalhadas */}
              <div className="space-y-1.5 text-xs font-medium text-neutral-700">
                {discipline.professor ? (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-neutral-500 stroke-[2.5]" />
                    <span className="truncate">{discipline.professor}</span>
                  </div>
                ) : null}

                {discipline.classroom ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500 stroke-[2.5]" />
                    <span className="truncate">{discipline.classroom}</span>
                  </div>
                ) : null}

                {discipline.schedule ? (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-neutral-500 stroke-[2.5]" />
                    <span className="truncate">{discipline.schedule}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Rodapé com indicadores e atalho */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t-2 border-black/10 mt-4 text-xs font-bold">
              <span className="text-neutral-500">{discipline.semester}</span>

              <div className="flex items-center gap-2">
                {discipline.pendingAssignmentsCount !== undefined &&
                discipline.pendingAssignmentsCount > 0 ? (
                  <div className="flex items-center gap-1 text-ink-success bg-green-50 px-2 py-0.5 border border-black/20 rounded-md">
                    <CheckSquare className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{discipline.pendingAssignmentsCount} entregas</span>
                  </div>
                ) : null}

                {discipline.unreadCount !== undefined &&
                discipline.unreadCount > 0 ? (
                  <div className="flex items-center gap-1 text-neo-blue bg-blue-50 px-2 py-0.5 border border-black/20 rounded-md">
                    <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{discipline.unreadCount} novos</span>
                  </div>
                ) : null}

                <span className="text-neutral-800 text-[11px] underline decoration-2 group-hover:text-neo-blue font-extrabold ml-1">
                  Ver feed →
                </span>
              </div>
            </div>
          </Card>
          ))}
        </div>
      )}

      {/* Seção Outros: Equipes do Teams, Monitorias e Projetos */}
      {otherCourses.length > 0 ? (
        <div className="space-y-4 pt-6 border-t-2 border-black/10">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-600 px-1">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 stroke-[2.5] text-neo-blue" />
              <span className="text-sm font-black text-black">
                Outras Equipes, Monitorias e Projetos ({otherCourses.length})
              </span>
            </div>
            <span className="text-neutral-500 font-semibold">Teams & Aprender 3</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherCourses.map((oc) => (
              <Card
                key={oc.id}
                onClick={() => {
                  setSelectedDiscipline({
                    id: oc.id,
                    code: oc.code,
                    name: oc.name,
                    semester: oc.semester || "2026.1",
                    professor: oc.professor,
                    classroom: oc.classroom,
                    teamsCourses: oc.platform === "teams" ? [oc] : [],
                    aprenderCourses: oc.platform === "aprender3" ? [oc] : [],
                    url: oc.url,
                    unreadCount: oc.unreadCount,
                    pendingAssignmentsCount: oc.pendingAssignmentsCount,
                  });
                }}
                role="button"
                tabIndex={0}
                aria-label={`Ver feed de ${oc.name}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedDiscipline({
                      id: oc.id,
                      code: oc.code,
                      name: oc.name,
                      semester: oc.semester || "2026.1",
                      professor: oc.professor,
                      classroom: oc.classroom,
                      teamsCourses: oc.platform === "teams" ? [oc] : [],
                      aprenderCourses: oc.platform === "aprender3" ? [oc] : [],
                      url: oc.url,
                      unreadCount: oc.unreadCount,
                      pendingAssignmentsCount: oc.pendingAssignmentsCount,
                    });
                  }
                }}
                className="cursor-pointer bg-white rounded-lg p-5 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-[transform,box-shadow,background-color,border-color] duration-150 ease-out flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Badge variant={oc.platform}>
                      {oc.platform === "teams" ? "Teams" : "Aprender 3"}
                    </Badge>
                    {oc.code && oc.code !== oc.name ? (
                      <span className="text-[11px] font-bold bg-neutral-100 px-2 py-0.5 border border-black/20 rounded-md">
                        {oc.code}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="text-base md:text-lg font-black text-black leading-snug mb-3 group-hover:text-neo-blue transition-colors">
                    {oc.name}
                  </h3>

                  {oc.classroom || oc.professor ? (
                    <div className="space-y-1.5 text-xs font-medium text-neutral-700">
                      {oc.professor ? (
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-neutral-500 stroke-[2.5]" />
                          <span className="truncate">{oc.professor}</span>
                        </div>
                      ) : null}
                      {oc.classroom ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-neutral-500 stroke-[2.5]" />
                          <span className="truncate">{oc.classroom}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t-2 border-black/10 mt-4 text-xs font-bold">
                  <span className="text-neutral-500">{oc.semester || "2026.1"}</span>
                  <span className="text-neutral-800 text-[11px] underline decoration-2 group-hover:text-neo-blue font-extrabold">
                    Ver publicações →
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {/* Modal Neobrutalista para turmas do Aprender 3 sem correspondência */}
      <UnmatchedCourseDialog
        course={resolvingCourse}
        disciplines={disciplines}
        isOpen={Boolean(resolvingCourse)}
        onAssociate={async (aprenderId, sigaaId) => {
          await associateCourse(aprenderId, sigaaId, false);
          setResolvingCourse(null);
        }}
        onIgnore={async (aprenderId) => {
          await associateCourse(aprenderId, null, true);
          setResolvingCourse(null);
        }}
        onClose={() => setResolvingCourse(null)}
      />
    </PageContainer>
  );
};
