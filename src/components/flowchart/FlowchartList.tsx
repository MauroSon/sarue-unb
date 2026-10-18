import React, { useState } from "react";
import type { FlowchartDiscipline, FlowchartSemester } from "@/core";
import { Check, CircleDotDashed, Lock, Unlock } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface FlowchartListProps {
  semesters: FlowchartSemester[];
  visibleCodes: Set<string>;
  onToggle: (code: string, isEffectivelyCompleted: boolean) => void;
  /** Mapa código → nome para exibir nomes reais dos pré-requisitos no tooltip */
  disciplineNames?: Map<string, string>;
}

// Ícone de estado da disciplina: só o ícone (concluída não tem), tooltip explica
const StatusIcon: React.FC<{ d: FlowchartDiscipline }> = ({ d }) => {
  if (d.status === "in_progress") {
    return (
      <Tooltip>
        <TooltipTrigger aria-label="Cursando" className="shrink-0 cursor-help">
          <CircleDotDashed className="w-3.5 h-3.5 stroke-[2.5] text-neo-blue" />
        </TooltipTrigger>
        <TooltipContent>Cursando neste semestre</TooltipContent>
      </Tooltip>
    );
  }
  if (d.status === "available") {
    return (
      <Tooltip>
        <TooltipTrigger aria-label="Disponível" className="shrink-0 cursor-help">
          <Unlock className="w-3.5 h-3.5 stroke-[2.5] text-neutral-700" />
        </TooltipTrigger>
        <TooltipContent>Disponível: pré-requisitos concluídos</TooltipContent>
      </Tooltip>
    );
  }
  if (d.status === "locked") {
    return (
      <Tooltip>
        <TooltipTrigger aria-label="Bloqueada" className="shrink-0 cursor-help">
          <Lock className="w-3.5 h-3.5 stroke-[2.5] text-neutral-400" />
        </TooltipTrigger>
        <TooltipContent>
          Bloqueada — falta:{" "}
          {d.missingPrerequisites.length > 1
            ? `${d.missingPrerequisites.length} pré-requisitos`
            : d.missingPrerequisites[0]?.split(" ")[0] || "pré-requisito"}
        </TooltipContent>
      </Tooltip>
    );
  }
  return null;
};

// Pill de pré-requisitos: rótulo claro na linha, detalhe (código + nome) no tooltip
const PrereqPill: React.FC<{
  d: FlowchartDiscipline;
  disciplineNames?: Map<string, string>;
}> = ({ d, disciplineNames }) => {
  if (d.prerequisites.length === 0) return null;

  // Nome real: mapa da matriz/histórico primeiro; fallback para o formato "COD (Nome)" dos pendentes
  const nameFor = (code: string) =>
    disciplineNames?.get(code) ||
    d.missingPrerequisites
      .find((m) => m.startsWith(code))
      ?.replace(/^[^(]*\((.*)\)$/, "$1");

  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={`Pré-requisitos de ${d.name}: ${d.prerequisites.length} disciplina(s)`}
        className="hidden md:inline-flex cursor-help items-center gap-1 text-[11px] font-black px-2.5 py-0.5 border-2 border-black rounded-full bg-white text-neutral-700 shrink-0 transition-colors duration-150 hover:bg-pastel-yellow"
      >
        Pré-requisitos
      </TooltipTrigger>
      <TooltipContent className="text-left max-w-[260px]">
        <p className="font-black mb-1">Pré-requisitos de {d.name}:</p>
        <ul className="space-y-0.5">
          {d.prerequisites.map((p) => {
            const name = nameFor(p);
            return (
              <li key={p} className="flex items-baseline gap-1.5">
                <span className="font-mono font-medium shrink-0">{p}</span>
                {name && (
                  <span className="font-medium text-neutral-600">{name}</span>
                )}
              </li>
            );
          })}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
};

// Linha da disciplina: código, nome, pré-requisitos e status — lista, não card
// Memoizada: a busca muda visibleCodes a cada tecla, mas linhas fora dos semestres afetados não precisam re-render
const DisciplineRow: React.FC<{
  d: FlowchartDiscipline;
  onToggle: (code: string, isEffectivelyCompleted: boolean) => void;
  disciplineNames?: Map<string, string>;
}> = React.memo(({ d, onToggle, disciplineNames }) => {
  const isCompleted = d.status === "completed";

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 transition-colors duration-150 hover:bg-neutral-50 ${
        isCompleted ? "bg-neutral-50/70" : "bg-white"
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={isCompleted}
        aria-label={
          isCompleted
            ? `Desmarcar ${d.name} como concluída`
            : `Marcar ${d.name} como concluída`
        }
        onClick={() => onToggle(d.code, isCompleted)}
        title={
          isCompleted
            ? "Desmarcar disciplina"
            : "Marcar como concluída manualmente"
        }
        className={`cursor-pointer w-6 h-6 rounded-md border-2 border-black flex items-center justify-center transition-all duration-150 shadow-neo-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-neo-xs active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shrink-0 ${
          isCompleted
            ? "bg-neo-green text-black"
            : "bg-white text-neutral-300 hover:text-black"
        }`}
      >
        {isCompleted ? (
          <Check className="w-3 h-3 stroke-[3]" />
        ) : (
          <div className="w-2 h-2 rounded-full border border-black" />
        )}
      </button>

      <span className="font-mono text-[11px] font-black px-1.5 py-0.5 bg-white border border-black rounded-md shrink-0">
        {d.code}
      </span>

      <span
        className={`flex-1 min-w-0 truncate text-xs font-bold ${
          isCompleted
            ? "text-neutral-500 line-through decoration-2"
            : "text-black"
        }`}
        title={d.name}
      >
        {d.name}
      </span>

      {/* Estado (só ícone) à esquerda da pill de pré-requisitos */}
      <StatusIcon d={d} />

      {/* Pré-requisitos: uma pill com tooltip, em vez de códigos soltos */}
      <PrereqPill d={d} disciplineNames={disciplineNames} />

      <span className="text-[11px] font-bold text-neutral-600 shrink-0">
        {d.workloadHours}h
      </span>
    </div>
  );
});

// Última escolha do usuário de quais semestres ficam abertos no accordion
const OPEN_SEMESTERS_STORAGE_KEY = "unb_flowchart_open_semesters";

const isSemesterFullyCompleted = (sem: FlowchartSemester): boolean =>
  sem.disciplines.length > 0 &&
  sem.disciplines.every((d) => d.status === "completed");

export const FlowchartList: React.FC<FlowchartListProps> = ({
  semesters,
  visibleCodes,
  onToggle,
  disciplineNames,
}) => {
  // Semestres que têm disciplina visível com o filtro/busca atuais
  const visible = semesters.filter((sem) =>
    sem.disciplines.some((d) => visibleCodes.has(d.code)),
  );

  // Semestres abertos: preferência salva no localStorage vence; sem preferência,
  // semestres totalmente concluídos nascem minimizados e os demais abertos.
  const [openValues, setOpenValues] = useState<string[] | null>(() => {
    try {
      const raw = window.localStorage.getItem(OPEN_SEMESTERS_STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(String);
      }
    } catch {}
    return null;
  });

  const handleOpenChange = (next: unknown) => {
    const list = Array.isArray(next) ? next.map(String) : [];
    setOpenValues(list);
    try {
      window.localStorage.setItem(
        OPEN_SEMESTERS_STORAGE_KEY,
        JSON.stringify(list),
      );
    } catch {}
  };

  const defaultOpenValues = visible
    .filter((sem) => !isSemesterFullyCompleted(sem))
    .map((sem) => String(sem.level));

  return (
    <Accordion
      multiple
      value={openValues ?? defaultOpenValues}
      onValueChange={handleOpenChange}
    >
      {visible.map((sem) => {
        const discs = sem.disciplines.filter((d) => visibleCodes.has(d.code));

        // Badge e contagem olham o semestre inteiro, não o subconjunto filtrado
        const completedCount = sem.disciplines.filter(
          (d) => d.status === "completed",
        ).length;
        const allCompleted = isSemesterFullyCompleted(sem);

        return (
          <AccordionItem
            key={sem.level}
            value={String(sem.level)}
            className="border-0 border-t-2 border-black first:border-t-0"
          >
            <AccordionTrigger className="px-4 py-2.5 bg-white hover:bg-neutral-50 rounded-none font-black text-[11px] uppercase tracking-wider text-black">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span>{sem.level}º Semestre</span>
                {allCompleted && (
                  <span className="text-[11px] font-black px-1.5 py-0.5 bg-neo-green text-black border border-black rounded-md normal-case tracking-normal">
                    Concluído
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold text-neutral-600 normal-case tracking-normal shrink-0 mr-2">
                {completedCount}/{sem.disciplines.length} concluídas ·{" "}
                {sem.totalHours}h
              </span>
            </AccordionTrigger>

            <AccordionContent className="p-0 bg-white border-t-2 border-black">
              <div className="divide-y divide-black/10">
                {discs.map((d) => (
                  <DisciplineRow
                    key={d.code}
                    d={d}
                    onToggle={onToggle}
                    disciplineNames={disciplineNames}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
