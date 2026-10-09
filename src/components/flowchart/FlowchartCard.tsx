import React from 'react';
import type { FlowchartDiscipline } from '@/core';
import { Check, Lock, Unlock, Clock, AlertCircle } from 'lucide-react';

export interface FlowchartCardProps {
  discipline: FlowchartDiscipline;
  onToggle: (code: string) => void;
}

// Memoizado: evita re-render de todos os cards a cada tecla da busca
export const FlowchartCard: React.FC<FlowchartCardProps> = React.memo(({
  discipline,
  onToggle,
}) => {
  const isCompleted = discipline.status === 'completed';
  const isInProgress = discipline.status === 'in_progress';
  const isLocked = discipline.status === 'locked';

  // Concluída usa Cinza Papel (riscada); bloqueada esmaece
  let paper = 'bg-white';
  if (isCompleted) paper = 'bg-neutral-100';
  if (isLocked) paper = 'bg-neutral-50';

  // Estado: cursando ganha anel azul; bloqueada esmaece o título
  let stateModifier = '';
  if (isInProgress) {
    stateModifier = 'ring-2 ring-neo-blue ring-offset-1';
  }

  // Códigos de pré-requisito que ainda faltam (missingPrerequisites vem como "COD (Nome)")
  const missingCodes = new Set(
    discipline.missingPrerequisites.map((m) => m.split(' ')[0]),
  );

  return (
    <div
      className={`group relative border-2 border-black rounded-lg p-3 flex flex-col justify-between gap-2 transition-shadow duration-150 select-none min-h-[118px] ${paper} ${stateModifier}`}
    >
      {/* Topo do Card: Código, Carga Horária e Botão de Marcação */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1 min-w-0">
          <span className="font-mono text-[11px] font-black px-1.5 py-0.5 bg-white border border-black rounded-md text-black truncate">
            {discipline.code}
          </span>
          <span className="text-[11px] font-bold px-1.5 py-0.5 bg-white/80 border border-black rounded-md text-neutral-700">
            {discipline.workloadHours}h
          </span>
        </div>

        {/* Checkbox / Botão de alternar conclusão */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(discipline.code);
          }}
          title={isCompleted ? 'Desmarcar disciplina' : 'Marcar como concluída manualmente'}
          className={`cursor-pointer w-5 h-5 rounded-md border-2 border-black flex items-center justify-center transition-all duration-150 shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
            isCompleted
              ? 'bg-neo-green text-black'
              : 'bg-white text-neutral-300 hover:text-black'
          }`}
        >
          {isCompleted ? (
            <Check className="w-3 h-3 stroke-[3]" />
          ) : (
            <div className="w-2 h-2 rounded-full border border-black" />
          )}
        </button>
      </div>

      {/* Nome da Disciplina — concluída riscada, bloqueada esmaecida */}
      <h4
        className={`text-xs font-black tracking-tight leading-snug line-clamp-2 ${
          isLocked ? 'text-neutral-500' : 'text-black'
        } ${isCompleted ? 'line-through decoration-2' : ''}`}
        title={discipline.name}
      >
        {discipline.name}
      </h4>

      {/* Rodapé: linha de status + pré-requisitos legíveis sem hover */}
      <div className="flex flex-col gap-1.5">
        {isCompleted && (
          <span className="inline-flex items-center gap-1 text-[11px] text-ink-success font-black">
            <Check className="w-3 h-3 stroke-[3]" />
            Concluída
          </span>
        )}

        {isInProgress && (
          <span className="inline-flex items-center gap-1 self-start text-[11px] font-black px-1.5 py-0.5 bg-neo-blue text-white border border-black rounded-md">
            <Clock className="w-3 h-3 stroke-[2.5]" />
            Cursando
          </span>
        )}

        {discipline.status === 'available' && (
          <span className="inline-flex items-center gap-1 self-start text-[11px] font-black px-1.5 py-0.5 bg-neo-yellow text-black border border-black rounded-md">
            <Unlock className="w-3 h-3 stroke-[2.5]" />
            Disponível
          </span>
        )}

        {isLocked && (
          <span
            className="inline-flex items-center gap-1 text-[11px] text-neutral-500 font-bold truncate"
            title={`Pré-requisitos pendentes: ${discipline.missingPrerequisites.join(', ')}`}
          >
            <Lock className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
            <span className="truncate">
              Falta: {discipline.missingPrerequisites.length > 1 ? `${discipline.missingPrerequisites.length} pré-reqs` : discipline.missingPrerequisites[0]?.split(' ')[0] || 'pré-req'}
            </span>
          </span>
        )}

        {/* Indicador de Marcação Manual */}
        {discipline.isManuallyToggled && (
          <span
            className="self-start text-[11px] font-black px-1.5 py-0.5 bg-white border border-black rounded-md text-neutral-700"
            title="Esta disciplina foi alterada manualmente"
          >
            Manual
          </span>
        )}

        {/* Cadeia de pré-requisitos: verde = cumprido, vermelho = faltando */}
        {!isCompleted && discipline.prerequisites.length > 0 && (
          <div className="flex items-center flex-wrap gap-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500">
              Pré
            </span>
            {(isLocked
              ? discipline.prerequisites.filter((p) => missingCodes.has(p))
              : discipline.prerequisites
            ).map((p) => (
              <span
                key={p}
                title={
                  missingCodes.has(p)
                    ? discipline.missingPrerequisites.find((m) => m.startsWith(p)) || p
                    : `${p} — cumprido`
                }
                className={`font-mono text-[11px] font-bold px-1 py-px border rounded ${
                  missingCodes.has(p)
                    ? 'bg-pastel-red border-black text-ink-error'
                    : 'bg-white/70 border-black/20 text-neutral-600'
                }`}
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tooltip de Pré-requisitos caso bloqueada */}
      {isLocked && discipline.missingPrerequisites.length > 0 && (
        <div className="hidden group-hover:block absolute bottom-full left-0 mb-1 z-30 w-56 bg-white border-2 border-black rounded-lg p-2 shadow-neo-sm text-[11px] text-neutral-800">
          <p className="font-extrabold text-black mb-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-neo-coral" />
            Pré-requisitos necessários:
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {discipline.missingPrerequisites.map((p, idx) => (
              <li key={idx} className="font-medium truncate">
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
