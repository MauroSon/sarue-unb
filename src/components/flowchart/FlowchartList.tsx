import React from 'react';
import type { FlowchartDiscipline, FlowchartSemester } from '@/core';
import { Check, Clock, Lock, Unlock } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export interface FlowchartListProps {
  semesters: FlowchartSemester[];
  visibleCodes: Set<string>;
  onToggle: (code: string) => void;
}

// Chip de status da disciplina na linha
const StatusChip: React.FC<{ d: FlowchartDiscipline }> = ({ d }) => {
  if (d.status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-black text-ink-success shrink-0">
        <Check className="w-3.5 h-3.5 stroke-[3]" />
        Concluída
      </span>
    );
  }
  if (d.status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-black px-1.5 py-0.5 bg-neo-blue text-white border border-black rounded-md shrink-0">
        <Clock className="w-3 h-3 stroke-[2.5]" />
        Cursando
      </span>
    );
  }
  if (d.status === 'available') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-black px-1.5 py-0.5 bg-neo-yellow text-black border border-black rounded-md shrink-0">
        <Unlock className="w-3 h-3 stroke-[2.5]" />
        Disponível
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-500 shrink-0 max-w-[200px]"
      title={`Pré-requisitos pendentes: ${d.missingPrerequisites.join(', ')}`}
    >
      <Lock className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
      <span className="truncate">
        Falta: {d.missingPrerequisites.length > 1 ? `${d.missingPrerequisites.length} pré-reqs` : d.missingPrerequisites[0]?.split(' ')[0] || 'pré-req'}
      </span>
    </span>
  );
};

// Linha da disciplina: código, nome, pré-requisitos e status — lista, não card
// Memoizada: a busca muda visibleCodes a cada tecla, mas linhas fora dos semestres afetados não precisam re-render
const DisciplineRow: React.FC<{ d: FlowchartDiscipline; onToggle: (code: string) => void }> = React.memo(({ d, onToggle }) => {
  const isCompleted = d.status === 'completed';
  const missingCodes = new Set(d.missingPrerequisites.map((m) => m.split(' ')[0]));

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 transition-colors duration-150 hover:bg-neutral-50 ${
        isCompleted ? 'bg-neutral-50/70' : 'bg-white'
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(d.code)}
        title={isCompleted ? 'Desmarcar disciplina' : 'Marcar como concluída manualmente'}
        className={`cursor-pointer w-5 h-5 rounded-md border-2 border-black flex items-center justify-center transition-all duration-150 shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shrink-0 ${
          isCompleted ? 'bg-neo-green text-black' : 'bg-white text-neutral-300 hover:text-black'
        }`}
      >
        {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : <div className="w-2 h-2 rounded-full border border-black" />}
      </button>

      <span className="font-mono text-[11px] font-black px-1.5 py-0.5 bg-white border border-black rounded-md shrink-0">
        {d.code}
      </span>

      <span
        className={`flex-1 min-w-0 truncate text-xs font-bold ${
          isCompleted ? 'text-neutral-500 line-through decoration-2' : 'text-black'
        }`}
        title={d.name}
      >
        {d.name}
      </span>

      {/* Pré-requisitos: cumprido em cinza, faltando em vermelho */}
      {d.prerequisites.length > 0 && (
        <span className="hidden lg:flex items-center gap-1 text-[11px] font-bold min-w-0 max-w-[280px] shrink">
          <span className="uppercase tracking-wider text-neutral-400 shrink-0">Pré</span>
          <span className="truncate font-mono">
            {d.prerequisites.map((p, i) => (
              <React.Fragment key={p}>
                {i > 0 && <span className="text-neutral-400">, </span>}
                <span
                  title={missingCodes.has(p) ? d.missingPrerequisites.find((m) => m.startsWith(p)) || p : `${p} — cumprido`}
                  className={missingCodes.has(p) ? 'text-ink-error font-black' : 'text-neutral-500'}
                >
                  {p}
                </span>
              </React.Fragment>
            ))}
          </span>
        </span>
      )}

      <span className="text-[11px] font-bold text-neutral-400 shrink-0">{d.workloadHours}h</span>
      <StatusChip d={d} />
    </div>
  );
});

export const FlowchartList: React.FC<FlowchartListProps> = ({ semesters, visibleCodes, onToggle }) => {
  // Semestres que têm disciplina visível com o filtro/busca atuais
  const visible = semesters.filter((sem) =>
    sem.disciplines.some((d) => visibleCodes.has(d.code)),
  );

  return (
    <Accordion multiple defaultValue={visible.map((sem) => String(sem.level))}>
      {visible.map((sem) => {
        const discs = sem.disciplines.filter((d) => visibleCodes.has(d.code));

        // Badge e contagem olham o semestre inteiro, não o subconjunto filtrado
        const completedCount = sem.disciplines.filter((d) => d.status === 'completed').length;
        const allCompleted =
          sem.disciplines.length > 0 && completedCount === sem.disciplines.length;

        return (
          <AccordionItem
            key={sem.level}
            value={String(sem.level)}
            className="bg-white border-2 border-black rounded-lg shadow-neo mb-4 border-black"
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
                {completedCount}/{sem.disciplines.length} concluídas · {sem.totalHours}h
              </span>
            </AccordionTrigger>

            <AccordionContent className="p-0 bg-white border-t-2 border-black">
              <div className="divide-y divide-black/10">
                {discs.map((d) => (
                  <DisciplineRow key={d.code} d={d} onToggle={onToggle} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
