import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import type {
  IraMention,
  IraScenarioSemester,
} from '@/core';
import { IRA_MENTIONS, MAX_DISCIPLINES_PER_SEMESTER } from '@/core';

export interface IraSemesterCardProps {
  semester: IraScenarioSemester;
  semesterIra: number | null;
  onMentionChange: (disciplineId: string, mention: IraMention) => void;
  onRemoveDiscipline: (disciplineId: string) => void;
  onUpdateCredits: (disciplineId: string, credits: number) => void;
  onAddDiscipline: () => void;
}

const SEMESTER_STYLES: Record<IraScenarioSemester['kind'], string> = {
  history: 'bg-pastel-blue',
  unknown: 'bg-pastel-yellow',
  current: 'bg-pastel-green',
  future: 'bg-neutral-50',
};

/**
 * Célula de semestre na grade da calculadora: cabeçalho com rótulo, período
 * e IRA do semestre; linhas anônimas de créditos + menção (sem nome, a
 * simulação é numérica); rodapé que adiciona disciplina em qualquer semestre.
 */
export const IraSemesterCard: React.FC<IraSemesterCardProps> = ({
  semester,
  semesterIra,
  onMentionChange,
  onRemoveDiscipline,
  onUpdateCredits,
  onAddDiscipline,
}) => {
  const hasDisciplines = semester.disciplines.length > 0;
  const isFuture = semester.kind === 'future';

  return (
    <section
      aria-label={semester.label}
      className={
        isFuture && !hasDisciplines
          ? 'flex flex-col bg-neutral-50 border-2 border-dashed border-ink/15 rounded-lg'
          : 'flex flex-col bg-paper border-2 border-ink rounded-lg shadow-neo'
      }
    >
      <div className={`px-3 py-2.5 border-b-2 border-ink ${SEMESTER_STYLES[semester.kind]} rounded-t-[6px]`}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-black text-black tracking-tight truncate" title={semester.label}>
            {semester.label}
          </h3>
          {semesterIra != null && Number.isFinite(semesterIra) && (
            <span className="text-[11px] font-black text-black tabular-nums shrink-0" title="IRA deste semestre (sem penalidade de trancamento)">
              {semesterIra.toFixed(2)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1 min-h-5">
          {semester.period && (
            <span className="inline-flex items-center rounded-full border-2 border-ink bg-paper dark:bg-neutral-300 dark:text-slate-50 px-1.5 py-0 text-[11px] font-black leading-4">
              {semester.period}
            </span>
          )}
          {semester.kind === 'current' && (
            <span className="text-[11px] font-bold text-neutral-600 leading-4">menções previstas</span>
          )}
          {semester.kind === 'unknown' && (
            <span className="text-[11px] font-bold text-neutral-600 leading-4">sem período</span>
          )}
        </div>
      </div>

      {hasDisciplines ? (
        <>
          <div className="px-3 pb-1 pt-1.5 flex items-center gap-2" aria-hidden="true">
            <span className="w-14 shrink-0 text-center text-[11px] font-black uppercase tracking-wider text-neutral-600">Cr</span>
            <span className="flex-1 min-w-0 text-[11px] font-black uppercase tracking-wider text-neutral-600">Menção</span>
            <span className="w-7 shrink-0" />
          </div>
          <ul className="divide-y divide-black/10">
          {semester.disciplines.map((d, index) => (
            <li key={d.id} className="px-3 py-2 flex items-center gap-2">
              <div className="w-14 shrink-0">
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={d.credits}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const n = raw === '' ? 0 : Number(raw);
                    if (!Number.isNaN(n)) onUpdateCredits(d.id, Math.max(0, n));
                  }}
                  aria-label={`Créditos da disciplina ${index + 1} em ${semester.label}`}
                  className="h-7 w-full px-1 text-[11px] font-extrabold tabular-nums text-center"
                />
              </div>
              <Select
                value={d.mention ?? undefined}
                onValueChange={(value) => onMentionChange(d.id, value as IraMention)}
              >
                <SelectTrigger
                  className="h-7 flex-1 min-w-[4.5rem] text-[11px] px-1.5"
                  aria-label={`Menção da disciplina ${index + 1} em ${semester.label}`}
                >
                  <SelectValue>
                    {d.mention ? (
                      <span className="font-black">{d.mention}</span>
                    ) : (
                      <span className="font-bold text-neutral-600">
                        {semester.kind === 'current' ? 'Prev.' : '—'}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {IRA_MENTIONS.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs font-black">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => onRemoveDiscipline(d.id)}
                aria-label={`Remover disciplina ${index + 1} de ${semester.label}`}
                title="Remover do cenário"
                className="inline-flex items-center justify-center w-7 h-7 rounded-lg border-2 border-transparent text-neutral-600 cursor-pointer hover:bg-pastel-red hover:border-ink/10 active:translate-y-px transition-[background-color,border-color,transform] shrink-0"
              >
                <Trash2 className="w-3 h-3 stroke-[2.5]" />
              </button>
            </li>
          ))}
          </ul>
        </>
      ) : (
        <p className="px-3 py-4 text-[11px] font-bold text-neutral-600 text-center">
          {isFuture ? 'Semestre vazio' : 'Sem disciplinas'}
        </p>
      )}

      <div className="px-2 py-2 border-t-2 border-ink/10 mt-auto">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-full text-[11px] font-black text-neutral-600 hover:text-black"
          onClick={onAddDiscipline}
          disabled={semester.disciplines.length >= MAX_DISCIPLINES_PER_SEMESTER}
          aria-label={`Adicionar disciplina em ${semester.label}`}
        >
          <Plus className="w-3 h-3 stroke-[2.5]" />
          Adicionar disciplina
        </Button>
      </div>
    </section>
  );
};
