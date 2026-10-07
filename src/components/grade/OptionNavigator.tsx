import React from 'react';
import { Button } from '@/components/ui';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export interface OptionNavigatorProps {
  optionsCount: number;
  currentIndex: number;
  onApplyOption: (index: number) => void;
}

/**
 * Faixa de navegação entre combinações geradas pelo solver.
 * Fica no topo da coluna de resultado, junto da grade que ela atualiza.
 */
export const OptionNavigator: React.FC<OptionNavigatorProps> = ({
  optionsCount,
  currentIndex,
  onApplyOption,
}) => {
  return (
    <div className="bg-pastel-yellow border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_#000] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-1.5 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] shrink-0">
          <Sparkles className="w-4 h-4 stroke-[2.5] text-black" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-black tracking-tight">
            {optionsCount} opções sem conflito geradas
          </p>
          <p className="text-[11px] font-semibold text-neutral-600 mt-0.5">
            Navegue entre as opções — a grade abaixo atualiza na hora.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 bg-white border-2 border-black rounded-xl p-1 shadow-[2px_2px_0px_0px_#000]">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={currentIndex === 0}
          onClick={() => onApplyOption(currentIndex - 1)}
          title="Opção anterior"
          aria-label="Ver opção anterior"
          className="h-9 w-9 rounded-lg"
        >
          <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
        </Button>

        <span className="text-xs font-black text-neo-blue px-1 whitespace-nowrap">
          Opção {currentIndex + 1} de {optionsCount}
        </span>

        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={currentIndex === optionsCount - 1}
          onClick={() => onApplyOption(currentIndex + 1)}
          title="Próxima opção"
          aria-label="Ver próxima opção"
          className="h-9 w-9 rounded-lg"
        >
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </Button>
      </div>
    </div>
  );
};
