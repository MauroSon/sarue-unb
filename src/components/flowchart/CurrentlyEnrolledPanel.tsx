import React from 'react';
import type { FlowchartDiscipline } from '@/core';
import { Clock } from 'lucide-react';
import { FlowchartCard } from './FlowchartCard';

export interface CurrentlyEnrolledPanelProps {
  disciplines: FlowchartDiscipline[];
  onToggle: (code: string) => void;
}

// Memoizado: a busca na tela re-renderiza o pai a cada tecla, mas disciplines/onToggle são estáveis
export const CurrentlyEnrolledPanel: React.FC<CurrentlyEnrolledPanelProps> = React.memo(({
  disciplines,
  onToggle,
}) => {
  if (disciplines.length === 0) return null;

  return (
    <div className="bg-pastel-blue border-2 border-black rounded-lg p-4 shadow-neo mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-lg bg-neo-blue border-2 border-black flex items-center justify-center text-white shadow-neo-sm">
          <Clock className="w-4 h-4 stroke-[2.5]" />
        </span>
        <h3 className="font-black text-sm text-black">Cursando agora</h3>
        <span className="text-[11px] font-black px-2 py-0.5 bg-neo-blue text-white border border-black rounded-md">
          {disciplines.length}
        </span>
        <span className="text-[11px] font-bold text-neutral-700">
          disciplinas neste semestre
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {disciplines.map((d) => (
          <FlowchartCard key={d.code} discipline={d} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
});
