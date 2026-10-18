import React from 'react';
import { Info, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui';
import type { IraCalculation } from '@/core';

export interface IraResultPanelProps {
  calculation: IraCalculation;
  /** IRA oficial vindo do SIGAA/histórico (pode não existir). */
  sigaaIra?: number;
  /** Cenário editado — o SIGAA continua refletindo o histórico real. */
  isSimulation: boolean;
  /** Existe cenário salvo que difere do histórico real (habilita restaurar). */
  canRestore: boolean;
  onRestore: () => void;
}

function formatIra(value: number): string {
  return value.toFixed(2);
}

/**
 * Painel de resultado da calculadora: o IRA calculado em destaque, o IRA
 * oficial do SIGAA ao lado e a diferença entre os dois — a "taxa de erro"
 * concreta da calculadora. Fica colado no topo ao rolar os semestres.
 */
export const IraResultPanel: React.FC<IraResultPanelProps> = ({
  calculation,
  sigaaIra,
  isSimulation,
  canRestore,
  onRestore,
}) => {
  const [confirmingRestore, setConfirmingRestore] = React.useState(false);
  React.useEffect(() => {
    if (!confirmingRestore) return;
    const t = setTimeout(() => setConfirmingRestore(false), 4000);
    return () => clearTimeout(t);
  }, [confirmingRestore]);

  const hasResult = calculation.ira != null;
  const hasComparison = !isSimulation && sigaaIra != null && calculation.ira != null;
  const delta = !isSimulation && sigaaIra != null && calculation.ira != null ? calculation.ira - sigaaIra : null;
  const deltaAbs = delta != null ? Math.abs(delta) : null;
  const matchesSigaa = deltaAbs != null && deltaAbs < 0.05;

  return (
    <div>
      <div className="bg-white border-2 border-black rounded-lg shadow-neo p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5">
          {/* IRA calculado */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-neutral-600">
              IRA calculado
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-black tracking-tight">
                {hasResult ? formatIra(calculation.ira as number) : '—'}
              </span>
              <span className="text-xs font-bold text-neutral-600">escala 0–5</span>
            </div>
          </div>

          {/* IRA oficial do SIGAA + diferença */}
          <div className="lg:border-l-2 lg:border-black/10 lg:pl-6">
            <p className="text-[11px] font-black uppercase tracking-wider text-neutral-600">
              IRA no SIGAA
            </p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-black text-neutral-600">
                {sigaaIra != null ? formatIra(sigaaIra) : '—'}
              </span>
              {hasComparison && (
                <span
                  className={`inline-flex items-center rounded-full border-2 border-black px-2 py-0.5 text-[11px] font-black shadow-neo-xs ${
                    matchesSigaa ? 'bg-pastel-green text-success-ink' : 'bg-pastel-yellow text-black'
                  }`}
                  title="Diferença entre o cálculo e o IRA oficial do SIGAA"
                >
                  {matchesSigaa
                    ? 'confere com o SIGAA'
                    : `diferença de ${formatIra(deltaAbs as number)}`}
                </span>
              )}
              {isSimulation && (
                <span className="inline-flex items-center rounded-full border-2 border-black px-2 py-0.5 text-[11px] font-black bg-highlighter-yellow text-black shadow-neo-xs">
                  Simulação
                </span>
              )}
            </div>
          </div>

          {/* Contadores */}
          <div className="lg:ml-auto text-xs font-bold text-neutral-600 space-y-0.5">
            <p>
              <span className="text-black font-extrabold">{calculation.mentionCount}</span> disciplina
              {calculation.mentionCount === 1 ? '' : 's'} com menção
            </p>
            <p>
              <span className="text-black font-extrabold">{formatCredits(calculation.creditsSum)}</span> créditos somados
            </p>
            <p>
              <span className="text-black font-extrabold">
                {calculation.trancadasObrigatorias + calculation.trancadasOptativas}
              </span>{' '}
              trancadas
            </p>
          </div>

          {/* Restaurar */}
          {canRestore && (
            <div className="flex flex-col items-start lg:items-end gap-1">
              {confirmingRestore ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onRestore}
                >
                  Confirmar restauração
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmingRestore(true)}
                >
                  <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                  Restaurar histórico real
                </Button>
              )}
              <span className="text-[11px] font-bold text-neutral-600">
                cenário salvo neste dispositivo
              </span>
            </div>
          )}
        </div>

        {/* Margem de erro / estado de simulação */}
        <div className="mt-4">
          {isSimulation ? (
            <div className="flex items-start gap-2.5 bg-pastel-yellow border-2 border-black rounded-lg px-3 py-2">
              <Info className="w-4 h-4 stroke-[2.5] shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-black">
                Você está simulando — o IRA do SIGAA continua mostrando seu histórico real.
                Restaure o cenário real para comparar com o oficial.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 bg-pastel-yellow border-2 border-black rounded-lg px-3 py-2">
              <Info className="w-4 h-4 stroke-[2.5] shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-black">
                O cálculo pode divergir do SIGAA (reaproveitamentos, recontagens e reprovações
                antigas). A diferença indicada acima é a margem de erro esperada quando você
                prever semestres futuros.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function formatCredits(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',');
}
