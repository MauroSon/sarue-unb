import React from 'react';
import type { FlowchartMetrics } from '@/core';
import { Award, BookOpen, Clock, Sparkles } from 'lucide-react';

export interface FlowchartStatsProps {
  metrics: FlowchartMetrics;
}

export const FlowchartStats: React.FC<FlowchartStatsProps> = ({ metrics }) => {
  const percentual = metrics.percentualIntegralizado ?? metrics.mandatoryProgressPercentage;
  const totalCurriculo = metrics.chTotalCurriculo ?? metrics.totalHours;
  const obrigatoriaPendente = metrics.chObrigatoriaPendente;
  const optativaPendente = metrics.chOptativaPendente;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Progresso Geral / Integralização Oficial SIGAA */}
      <div className="bg-white border-2 border-black rounded-xl p-4 shadow-neo flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase tracking-wider text-neutral-600">
            Integralização SIGAA
          </span>
          <div className="w-8 h-8 rounded-lg bg-pastel-green border-2 border-black flex items-center justify-center text-black shadow-[1px_1px_0_0_#000]">
            <Award className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black text-black">
              {percentual.toFixed(1).replace('.0', '')}%
            </span>
            <span className="text-xs font-bold text-neutral-600">
              integralizado
            </span>
          </div>

          {/* Barra de progresso neo-brutalista */}
          <div className="w-full h-3.5 bg-neutral-100 border-2 border-black rounded-full overflow-hidden p-0.5 shadow-[1px_1px_0_0_#000]">
            <div
              className="h-full bg-neo-green border border-black rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, percentual))}%` }}
            />
          </div>
        </div>

        <p className="text-[11px] font-bold text-neutral-600 mt-2">
          {metrics.completedMandatoryDisciplines} de {metrics.totalMandatoryDisciplines} obrigatórias feitas
        </p>
      </div>

      {/* 2. Carga Horária Obrigatória */}
      <div className="bg-white border-2 border-black rounded-xl p-4 shadow-neo flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase tracking-wider text-neutral-600">
            CH Obrigatória
          </span>
          <div className="w-8 h-8 rounded-lg bg-pastel-blue border-2 border-black flex items-center justify-center text-neo-blue shadow-[1px_1px_0_0_#000]">
            <Clock className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-black text-black">
            {obrigatoriaPendente != null ? `${1980 - obrigatoriaPendente}h` : `${metrics.completedHours}h`}
          </span>
          <span className="text-xs font-bold text-neutral-600">
            de 1980h
          </span>
        </div>

        <p className="text-[11px] font-bold text-neutral-600 mt-2">
          Pendente: <span className="text-black font-extrabold">{obrigatoriaPendente != null ? `${obrigatoriaPendente}h` : `${metrics.remainingHours}h`}</span> obrigatórias
        </p>
      </div>

      {/* 3. Carga Horária Total do Curso */}
      <div className="bg-white border-2 border-black rounded-xl p-4 shadow-neo flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase tracking-wider text-neutral-600">
            CH Total do Curso
          </span>
          <div className="w-8 h-8 rounded-lg bg-pastel-yellow border-2 border-black flex items-center justify-center text-black shadow-[1px_1px_0_0_#000]">
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-black text-black">
            {totalCurriculo}h
          </span>
          <span className="text-xs font-bold text-neutral-600">
            currículo
          </span>
        </div>

        <p className="text-[11px] font-bold text-neutral-600 mt-2">
          Optativas pendentes: <span className="text-black font-extrabold">{optativaPendente != null ? `${optativaPendente}h` : '---'}</span>
        </p>
      </div>

      {/* 4. Índices Acadêmicos e Situação */}
      <div className="bg-white border-2 border-black rounded-xl p-4 shadow-neo flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase tracking-wider text-neutral-600">
            Índices Acadêmicos
          </span>
          <div className="w-8 h-8 rounded-lg bg-pastel-purple border-2 border-black flex items-center justify-center text-neo-purple shadow-[1px_1px_0_0_#000]">
            <BookOpen className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <div className="flex items-baseline gap-3 mb-1">
          {metrics.ira != null && (
            <div>
              <span className="text-2xl font-black text-black">
                {metrics.ira.toFixed(2)}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 ml-1">
                IRA
              </span>
            </div>
          )}
          {metrics.mp != null && (
            <div>
              <span className="text-2xl font-black text-black">
                {metrics.mp.toFixed(2)}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 ml-1">
                MP
              </span>
            </div>
          )}
        </div>

        <p className="text-[11px] font-bold text-neutral-600 mt-2">
          {metrics.availableCount} liberadas para cursar agora
        </p>
      </div>
    </div>
  );
};
