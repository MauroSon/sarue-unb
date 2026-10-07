import React from "react";
import {
  Card,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { Search, X } from "lucide-react";
import type { Department } from "@/core";
import { DepartmentSelect } from "./DepartmentSelect";

export interface GradeFiltersProps {
  departments: Department[];
  selectedDeptId: string;
  onSelectDeptId: (id: string) => void;
  year: string;
  onSelectYear: (year: string) => void;
  period: string;
  onSelectPeriod: (period: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  isSearching?: boolean;
  isScraping?: boolean;
}

export const GradeFilters: React.FC<GradeFiltersProps> = ({
  departments,
  selectedDeptId,
  onSelectDeptId,
  year,
  onSelectYear,
  period,
  onSelectPeriod,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  isSearching = false,
  isScraping = false,
}) => {
  // Apenas o semestre atual e o seguinte (ex.: hoje = out/2026 -> 2026.2 e 2027.1)
  const semesterOptions = React.useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const p = now.getMonth() <= 5 ? "1" : "2";
    const current = `${y}-${p}`;
    const next = p === "1" ? `${y}-2` : `${y + 1}-1`;
    const stored = `${year}-${period}`;
    return Array.from(new Set([stored, current, next])).map((v) => {
      const [yy, pp] = v.split("-");
      return {
        value: v,
        label: `${yy} • ${pp === "1" ? "1º sem." : "2º sem."}`,
      };
    });
  }, [year, period]);

  return (
    <Card className="p-4 space-y-4">
      {/* Cabeçalho da seção de busca */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] shrink-0">
            <Search className="w-4 h-4 stroke-[2.5] text-neo-blue" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold tracking-tight text-black">
              Filtrar turmas da UnB
            </h3>
            <p className="text-[11px] font-semibold text-neutral-600">
              Busque por nome ou código, navegue por departamento, ou combine os
              dois. Deixe a busca vazia para listar as disciplinas.
            </p>
          </div>
        </div>
      </div>

      {/* Parâmetros da busca: semestre letivo (contexto) + unidade de busca (texto e escopo independentes) */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-3">
        {/* Semestre letivo: contexto dos dados, independente da busca */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600">
            Semestre
          </span>
          <Select
            value={`${year}-${period}`}
            items={semesterOptions}
            onValueChange={(val) => {
              if (!val) return;
              const [y, p] = val.split("-");
              onSelectYear(y);
              onSelectPeriod(p);
            }}
          >
            <SelectTrigger className="w-full lg:w-36">
              <SelectValue placeholder="Semestre">
                {
                  semesterOptions.find((o) => o.value === `${year}-${period}`)
                    ?.label
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-canvas">
              {semesterOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Unidade de busca: texto e departamento são independentes — texto vazio lista as disciplinas do escopo */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600">
            Disciplina
          </span>
          <div className="flex flex-col lg:flex-row gap-2.5 lg:items-stretch">
            {/* Cavidade composta: campo de texto + escopo de departamento na mesma unidade */}
            <div className="flex-1 min-w-0 flex items-stretch rounded-xl border-2 border-black bg-white focus-within:ring-2 focus-within:ring-neo-blue transition-[box-shadow]">
              <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 stroke-[2.5] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onSearch();
                    }
                  }}
                  placeholder="Ex.: Cálculo 1, APC, CIC0004…"
                  aria-label="Buscar disciplina por código ou nome"
                  className="w-full bg-transparent pl-9 pr-8 h-9 text-xs font-semibold text-black rounded-l-xl shadow-none focus:outline-hidden placeholder:text-neutral-600"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => onSearchQueryChange("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer p-0.5"
                    aria-label="Limpar campo de busca"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>

              {/* Escopo de departamento: segmento da mesma unidade, opcional por natureza (Todos = UnB inteira) */}
              <div className="shrink-0 border-l-2 border-black/15">
                <DepartmentSelect
                  departments={departments}
                  value={selectedDeptId}
                  onChange={onSelectDeptId}
                  bare
                  triggerClassName="w-40 lg:w-52 rounded-r-xl hover:bg-neutral-50"
                />
              </div>
            </div>

            {/* Ação principal: adesivo de busca ao lado da cavidade */}
            <Button
              type="button"
              variant="primary"
              size="md"
              className="rounded-xl h-10 shrink-0"
              isLoading={isSearching || isScraping}
              onClick={onSearch}
            >
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Buscar</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
