import React, { useState, useRef, useMemo } from "react";
import { useGrade } from "../hooks/useGrade";
import { PageContainer, PageHeader, toast } from "@/components/ui";
import { CalendarDays } from "lucide-react";
import { toPng } from "html-to-image";
import type { ScrapedClass } from "@/core";
import { GradeFilters } from "../components/grade/GradeFilters";
import { SelectedClassesCard } from "../components/grade/SelectedClassesCard";
import { DisciplineCatalog } from "../components/grade/DisciplineCatalog";
import { ScheduleTimetable } from "../components/grade/ScheduleTimetable";
import { OptionNavigator } from "../components/grade/OptionNavigator";
import { DISCIPLINE_COLORS } from "../components/grade/types";

export const GradeBuilderScreen: React.FC = () => {
  const {
    departments,
    departmentsMap,
    semesters,
    selectedDeptId,
    setSelectedDeptId,
    year,
    setYear,
    period,
    setPeriod,
    filteredDisciplines,
    disciplines,
    allDisciplines,
    searchQuery,
    setSearchQuery,
    hasSearched,
    activeSearchQuery,
    activeDeptId,
    isFallbackSearch,
    isSearching,
    executeSearch,
    resetSearch,
    selectedClasses,
    conflicts,
    scheduleOptions,
    currentOptionIndex,
    isScraping,
    isSolving,
    isSaving,
    feedbackMessage,
    toggleClass,
    removeClass,
    clearGrade,
    generateCombinations,
    applyOption,
    saveGrade,
  } = useGrade();

  const [expandedDisciplines, setExpandedDisciplines] = useState<
    Record<string, boolean>
  >({});
  const [shiftFilter, setShiftFilter] = useState<"ALL" | "M" | "T" | "N">(
    "ALL",
  );
  const [isExportingPng, setIsExportingPng] = useState(false);
  const scheduleGridRef = useRef<HTMLDivElement>(null);

  const toggleExpand = React.useCallback((code: string) => {
    setExpandedDisciplines((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  }, []);

  // Mapeia disciplinas para cores distintas no grid
  const disciplineColorMap = useMemo(() => {
    const map = new Map<string, (typeof DISCIPLINE_COLORS)[0]>();
    const uniqueCodes = Array.from(
      new Set(selectedClasses.map((c) => c.disciplineCode)),
    );
    uniqueCodes.forEach((code, index) => {
      map.set(code, DISCIPLINE_COLORS[index % DISCIPLINE_COLORS.length]);
    });
    return map;
  }, [selectedClasses]);

  // Monta mapa de ocupação por slot: `dia-globalIndex` -> ScrapedClass[]
  const slotOccupancy = useMemo(() => {
    const map = new Map<string, ScrapedClass[]>();
    for (const c of selectedClasses) {
      for (const slot of c.scheduleSlots) {
        const key = `${slot.day}-${slot.globalSlotIndex}`;
        const existing = map.get(key) || [];
        existing.push(c);
        map.set(key, existing);
      }
    }
    return map;
  }, [selectedClasses]);

  // Feedback da tela vira toast no canto da tela (sucesso, aviso ou erro)
  const lastToastRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!feedbackMessage) return;
    if (lastToastRef.current === feedbackMessage) return;
    lastToastRef.current = feedbackMessage;

    const msg = feedbackMessage.replace(/^Aviso:\s*/i, "");
    if (/^(exibindo|coleta|busca)/i.test(msg)) return; // busca silenciosa de turmas
    if (/^erro/i.test(msg)) {
      toast.add({ title: 'Algo deu errado', description: msg, type: 'error', timeout: 7000 });
    } else if (/^(aviso|nenhuma|n\u00e3o|selecione)/i.test(msg)) {
      toast.add({ title: 'Aten\u00e7\u00e3o', description: msg, type: 'warning', timeout: 6000 });
    } else {
      toast.add({ description: msg, type: 'success', timeout: 4000 });
    }
  }, [feedbackMessage]);

  // Exportar grade horária para imagem PNG em alta resolução (2x retina)
  const handleDownloadPng = async () => {
    if (!scheduleGridRef.current) return;
    try {
      setIsExportingPng(true);
      const dataUrl = await toPng(scheduleGridRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#FFFFFF",
        filter: (node) => {
          if (
            node instanceof HTMLElement &&
            node.classList.contains("no-export")
          ) {
            return false;
          }
          return true;
        },
      });

      const link = document.createElement("a");
      link.download = `grade-unb-${year}-${period}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.add({
        title: 'Exportação da grade',
        description: 'Não foi possível gerar a imagem. Tente novamente.',
        type: 'error',
      });
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <PageContainer>
      {/* Título Padronizado da Página com Ícone da Sidebar */}
      <div className="space-y-1.5">
        <PageHeader icon={CalendarDays} title="Montar Grade Horária" />
      </div>

      {/* Seção de busca: parâmetros e busca de turmas */}
      <GradeFilters
        departments={departments}
        semesters={semesters}
        selectedDeptId={selectedDeptId}
        onSelectDeptId={setSelectedDeptId}
        year={year}
        onSelectYear={setYear}
        period={period}
        onSelectPeriod={setPeriod}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={() => executeSearch()}
        isSearching={isSearching}
        isScraping={isScraping}
      />

      {/* Grid Principal: filtros acima; catálogo à esquerda (5/12) e resultado à direita (7/12) a partir de lg */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: montar a grade (5 colunas) */}
        <div className="lg:col-span-5 space-y-4">
          <SelectedClassesCard
            selectedClasses={selectedClasses}
            disciplineColorMap={disciplineColorMap}
            onClearGrade={clearGrade}
            onRemoveClass={removeClass}
            shiftFilter={shiftFilter}
            onShiftFilterChange={setShiftFilter}
            onGenerateCombinations={() =>
              generateCombinations(
                shiftFilter === "ALL" ? undefined : shiftFilter,
              )
            }
            onSaveGrade={saveGrade}
            isSolving={isSolving}
            isSaving={isSaving}
          />

          <DisciplineCatalog
            filteredDisciplines={filteredDisciplines}
            selectedClasses={selectedClasses}
            expandedDisciplines={expandedDisciplines}
            onToggleExpand={toggleExpand}
            onToggleClass={toggleClass}
            hasSearched={hasSearched}
            activeSearchQuery={activeSearchQuery}
            activeDeptId={activeDeptId}
            isFallbackSearch={isFallbackSearch}
            isCatalogLoaded={allDisciplines.length > 0 || disciplines.length > 0}
            departmentsMap={departmentsMap}
            onResetSearch={resetSearch}
            onQuickSearch={(query) => executeSearch(query)}
            onSearchAllUnb={() => executeSearch(activeSearchQuery, 'ALL')}
          />
        </div>

        {/* Coluna Direita: resultado (7 colunas) */}
        <div className="lg:col-span-7 space-y-4">
          {scheduleOptions.length > 1 ? (
            <OptionNavigator
              optionsCount={scheduleOptions.length}
              currentIndex={currentOptionIndex}
              onApplyOption={applyOption}
            />
          ) : null}

          <ScheduleTimetable
            ref={scheduleGridRef}
            selectedClasses={selectedClasses}
            slotOccupancy={slotOccupancy}
            disciplineColorMap={disciplineColorMap}
            year={year}
            period={period}
            conflicts={conflicts}
            onDownloadPng={handleDownloadPng}
            isExportingPng={isExportingPng}
          />
        </div>
      </div>
    </PageContainer>
  );
};
