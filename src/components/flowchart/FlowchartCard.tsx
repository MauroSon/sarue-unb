import React from "react";
import type { FlowchartDiscipline } from "@/core";

export interface FlowchartCardProps {
  discipline: FlowchartDiscipline;
}

// Card somente leitura do painel "Cursando agora": código, carga e nome.
// Concluir disciplina acontece na lista (FlowchartList); o painel já declara o estado.
export const FlowchartCard: React.FC<FlowchartCardProps> = React.memo(
  ({ discipline }) => {
    return (
      <div className="border-2 border-ink rounded-lg p-3 flex flex-col gap-2 bg-paper select-none min-h-28">
        <div className="flex items-center gap-1 min-w-0">
          <span className="font-mono text-[11px] font-black px-1.5 py-0.5 bg-paper border border-ink rounded-md text-black truncate">
            {discipline.code}
          </span>
          <span className="text-[11px] font-bold px-1.5 py-0.5 bg-paper/80 border border-ink rounded-md text-neutral-700">
            {discipline.workloadHours}h
          </span>
        </div>

        <h4
          className="text-xs font-black tracking-tight leading-snug line-clamp-2 text-black"
          title={discipline.name}
        >
          {discipline.name}
        </h4>
      </div>
    );
  },
);
