import React, { useState } from "react";
import { FeedList } from "../components/feed/FeedList";
import { FeedListSkeleton } from "../components/feed/FeedListSkeleton";
import { ArchivedToggleButton } from "../components/feed/ArchivedToggleButton";
import { useFeed } from "../hooks/useFeed";
import {
  Card,
  Pagination,
  Tabs,
  PageContainer,
  PageHeader,
  toast,
  EmptyState,
} from "@/components/ui";
import { Search, Inbox, Home } from "lucide-react";
import type { PlatformType, FeedItemType } from "@/core";

export const DashboardScreen: React.FC = () => {
  const {
    items,
    disciplines,
    isLoading,
    hasLoadedOnce,
    selectedPlatform,
    setSelectedPlatform,
    selectedType,
    setSelectedType,
    searchQuery,
    setSearchQuery,
    showArchived,
    setShowArchived,
    toggleTaskCompleted,
    archiveFeedItem,
  } = useFeed();

  const PAGE_SIZE = 25;
  const filterKey = `${selectedPlatform}|${selectedType}|${searchQuery}|${showArchived}`;
  const [page, setPage] = useState(1);
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = items.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const isInitialLoad = isLoading && !hasLoadedOnce;

  const platformTabs = [
    { id: "all", label: "Todas" },
    { id: "sigaa", label: "Sigaa" },
    { id: "aprender3", label: "Aprender 3" },
    { id: "teams", label: "Teams" },
  ];

  const typeTabs = [
    { id: "all", label: "Tudo" },
    { id: "assignment", label: "Tarefas" },
    { id: "post", label: "Avisos" },
  ];

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
      description: "O item retornou ao seu feed ativo.",
      type: "success",
      timeout: 4000,
    });
  };

  return (
    <PageContainer>
      {/* Título Padronizado da Página com Ícone da Sidebar */}
      <PageHeader icon={Home} title="Início" />

      {/* Barra de Filtros e Busca */}
      <div className="bg-white border-2 border-black rounded-lg p-5 shadow-[4px_4px_0px_0px_#000] space-y-4">
        {/* Campo de Busca Textual */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 stroke-[2.5]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por disciplina, título da tarefa, aviso ou professor..."
            aria-label="Buscar no feed"
            className="w-full bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-black border-2 border-black rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neo-blue transition-[transform,box-shadow,background-color,border-color] placeholder:text-neutral-400 shadow-none"
          />
        </div>

        {/* Linha de Filtros por Plataforma, Tipo e Arquivados */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-1">
          {/* Filtro por Plataforma */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-neutral-700 block">
              Plataformas:
            </span>
            <Tabs
              items={platformTabs}
              activeId={selectedPlatform}
              onChange={(id) => setSelectedPlatform(id as PlatformType | "all")}
            />
          </div>

          {/* Filtro por Tipo e Botão de Arquivados */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-neutral-700 block">
                Categoria:
              </span>
              <Tabs
                items={typeTabs}
                activeId={selectedType}
                onChange={(id) => setSelectedType(id as FeedItemType | "all")}
              />
            </div>

            <ArchivedToggleButton
              showArchived={showArchived}
              onToggle={() => setShowArchived(!showArchived)}
            />
          </div>
        </div>
      </div>

      {/* Lista do Feed Cronológico */}
      {isInitialLoad ? (
        <Card
          className="p-0 overflow-hidden"
          role="status"
          aria-busy="true"
          aria-live="polite"
        >
          <span className="sr-only">Carregando feed acadêmico...</span>
          <FeedListSkeleton />
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          iconClassName="bg-canvas text-neo-blue"
          title={
            showArchived
              ? "Nenhum item arquivado encontrado"
              : "Nenhum item encontrado"
          }
          description={
            showArchived
              ? "Você ainda não arquivou nenhum aviso ou tarefa."
              : 'Não há avisos ou tarefas correspondentes aos filtros selecionados. Clique em "Sincronizar" na barra lateral para atualizar os portais.'
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-600 px-1">
            <span>
              {showArchived ? "Arquivados" : "Feed Unificado"} ({items.length}{" "}
              {items.length === 1 ? "item" : "itens"})
            </span>
            <span>Ordenado cronologicamente</span>
          </div>

          <Card className="p-0 overflow-hidden">
            <FeedList
              items={pageItems}
              disciplines={disciplines}
              onToggleComplete={toggleTaskCompleted}
              onArchive={handleArchive}
              onRestore={handleRestore}
            />
          </Card>

          <Pagination
            page={safePage}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </div>
      )}
    </PageContainer>
  );
};
