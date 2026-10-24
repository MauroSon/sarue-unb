import React from "react";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import {
  Archive,
  ArchiveRestore,
  CheckCircle,
  ListChecks,
  Search,
  X,
} from "lucide-react";
import { ArchivedToggleButton } from "./ArchivedToggleButton";
import type { FeedItemType, PlatformType } from "@/core";

export interface FeedToolbarProps {
  /** Busca textual do feed. */
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchAriaLabel: string;
  /** Filtro de plataforma: só existe no feed geral (Início). */
  showPlatformFilter?: boolean;
  platformValue?: PlatformType | "all";
  onPlatformChange?: (value: PlatformType | "all") => void;
  /** Opções de plataforma (drill-down passa só as plataformas da disciplina). */
  platformOptions?: { value: PlatformType | "all"; label: string }[];
  categoryValue: FeedItemType | "all";
  onCategoryChange: (value: FeedItemType | "all") => void;
  /** Ação "Limpar filtros" (drill-down da disciplina). */
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  showArchived: boolean;
  onToggleArchived: () => void;
  /** Modo Selecionar: a seção expande para baixo com as ações em lote. */
  selectionMode: boolean;
  selectedCount: number;
  selectedTaskCount: number;
  allSelected: boolean;
  /** Esconde o botão Selecionar quando não há o que selecionar. */
  canSelect?: boolean;
  onEnterSelection: () => void;
  onExitSelection: () => void;
  onToggleAllSelection: () => void;
  onBatchComplete: () => void;
  onBatchArchive: () => void;
  onBatchRestore: () => void;
}

const PLATFORM_OPTIONS: { value: PlatformType | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "sigaa", label: "Sigaa" },
  { value: "aprender3", label: "Aprender 3" },
  { value: "teams", label: "Teams" },
];

const CATEGORY_OPTIONS: { value: FeedItemType | "all"; label: string }[] = [
  { value: "all", label: "Tudo" },
  { value: "assignment", label: "Tarefas" },
  { value: "post", label: "Avisos" },
];

interface FilterSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  /** Filtro engajado (valor diferente do padrão): trigger vira azul cheio. */
  active?: boolean;
}

/**
 * Select compacto do mural: trigger na altura dos botões sm do feed (34px),
 * rótulo em cima — mesma linguagem dos filtros da Grade. Com filtro ativo,
 * segue o padrão dos filtros de estado de Disciplinas: cor cheia da família.
 */
const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  value,
  options,
  onChange,
  active = false,
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xs font-bold text-neutral-700">{label}</span>
    <Select
      value={value}
      items={options}
      onValueChange={(next) => {
        if (!next) return;
        onChange(next);
      }}
    >
      <SelectTrigger
        className={`h-[34px] w-auto px-3 ${
          active
            ? "bg-neo-blue text-white hover:bg-neo-blueHover"
            : "bg-white"
        }`}
      >
        <SelectValue>
          {options.find((option) => option.value === value)?.label ?? value}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

/**
 * Barra de filtros e busca do feed, em card próprio (Início e drill-down da
 * Disciplina). O botão Selecionar não troca a seção: ao entrar no modo, a
 * barra de ações em lote surge ABAIXO dos filtros, expandindo o card.
 */
export const FeedToolbar: React.FC<FeedToolbarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  showPlatformFilter = false,
  platformValue,
  onPlatformChange,
  platformOptions,
  categoryValue,
  onCategoryChange,
  hasActiveFilters = false,
  onClearFilters,
  showArchived,
  onToggleArchived,
  selectionMode,
  selectedCount,
  selectedTaskCount,
  allSelected,
  canSelect = true,
  onEnterSelection,
  onExitSelection,
  onToggleAllSelection,
  onBatchComplete,
  onBatchArchive,
  onBatchRestore,
}) => {
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_#000]">
      <div className="space-y-3 p-4">
        {/* Busca textual */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 stroke-[2.5]" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchAriaLabel}
            className={`w-full pl-10 py-2.5 text-sm font-medium text-black border-2 border-black rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neo-blue transition-[transform,box-shadow,background-color,border-color] placeholder:text-neutral-400 shadow-none ${
              searchQuery.trim() ? "bg-pastel-blue pr-10" : "bg-white pr-4"
            }`}
          />

          {/* Limpar busca: só existe com busca engajada; devolve o foco ao campo */}
          {searchQuery.trim() ? (
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                searchInputRef.current?.focus();
              }}
              title="Limpar busca"
              aria-label="Limpar busca"
              className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-neutral-500 hover:text-black hover:bg-black/5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue transition-colors duration-150"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : null}
        </div>

        {/* Filtros e Arquivados à esquerda; modo Selecionar à direita */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            {showPlatformFilter && onPlatformChange ? (
              <FilterSelect
                label="Plataformas:"
                value={platformValue ?? "all"}
                options={platformOptions ?? PLATFORM_OPTIONS}
                active={(platformValue ?? "all") !== "all"}
                onChange={(value) =>
                  onPlatformChange(value as PlatformType | "all")
                }
              />
            ) : null}

            <FilterSelect
              label="Categoria:"
              value={categoryValue}
              options={CATEGORY_OPTIONS}
              active={categoryValue !== "all"}
              onChange={(value) => onCategoryChange(value as FeedItemType | "all")}
            />

            {hasActiveFilters && onClearFilters ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="cursor-pointer rounded-xs pb-2 text-xs font-bold text-neutral-500 hover:text-black underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2"
              >
                Limpar filtros
              </button>
            ) : null}
          </div>

          {/* Arquivados ao lado esquerdo do modo Selecionar */}
          <div className="flex flex-wrap items-end gap-3">
            <ArchivedToggleButton
              showArchived={showArchived}
              onToggle={onToggleArchived}
            />
            {canSelect ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-[34px]"
                aria-pressed={selectionMode}
                onClick={selectionMode ? onExitSelection : onEnterSelection}
                title={
                  selectionMode
                    ? "Sai do modo de seleção (Esc)"
                    : "Selecionar vários itens para concluir ou arquivar em lote"
                }
              >
                <ListChecks className="w-3.5 h-3.5 stroke-[2.5]" />
                Selecionar
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Modo Selecionar: expansão de altura animada (0fr→1fr), sem esconder
          filtros nem busca; inerte ao foco quando recolhida */}
      <div
        className={`grid transition-[grid-template-rows] duration-150 ease-out ${
          selectionMode ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
        aria-hidden={!selectionMode}
        inert={!selectionMode}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t-2 border-black/10 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Estado da seleção: contagem + alternar todos */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-neutral-600">
                  <span className="text-neo-blue">{selectedCount}</span>{" "}
                  {selectedCount === 1
                    ? "item selecionado"
                    : "itens selecionados"}
                </span>
                <button
                  type="button"
                  onClick={onToggleAllSelection}
                  className="cursor-pointer rounded-xs text-xs font-bold text-neutral-500 hover:text-black underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2"
                >
                  {allSelected ? "Limpar tudo" : "Selecionar tudo"}
                </button>
              </div>

              {/* Ações em lote: principal, secundária, sair — contagem já está à esquerda */}
              <div className="flex flex-wrap items-center gap-2">
                {!showArchived ? (
                  <Button
                    type="button"
                    variant="accent"
                    size="sm"
                    disabled={selectedTaskCount === 0}
                    onClick={onBatchComplete}
                    title="Marca as tarefas selecionadas como concluídas (avisos não se concluem)"
                  >
                    <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                    Concluir
                  </Button>
                ) : null}

                {showArchived ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={selectedCount === 0}
                    onClick={onBatchRestore}
                    title="Devolve os itens selecionados ao feed ativo"
                  >
                    <ArchiveRestore className="w-3.5 h-3.5 stroke-[2.5]" />
                    Desarquivar
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={selectedCount === 0}
                    onClick={onBatchArchive}
                    title="Move os itens selecionados para os Arquivados"
                  >
                    <Archive className="w-3.5 h-3.5 stroke-[2.5]" />
                    Arquivar
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onExitSelection}
                  title="Sai do modo de seleção e limpa a escolha (Esc)"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
