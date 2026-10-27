import React from "react";
import { Card, Button, Badge, Tabs } from "@/components/ui";
import { BookMarked, Trash2, Sparkles, Save, BookOpen } from "lucide-react";
import type { ScrapedClass } from "@/core";
import { SHIFT_TABS, DISCIPLINE_COLORS, type DisciplineColor } from "./types";

export interface SelectedClassesCardProps {
  selectedClasses: ScrapedClass[];
  disciplineColorMap: Map<string, DisciplineColor>;
  onClearGrade: () => void;
  onRemoveClass: (id: string) => void;
  shiftFilter: "ALL" | "M" | "T" | "N";
  onShiftFilterChange: (shift: "ALL" | "M" | "T" | "N") => void;
  onGenerateCombinations: () => void;
  onSaveGrade: () => void;
  isSolving: boolean;
  isSaving: boolean;
}

export const SelectedClassesCard: React.FC<SelectedClassesCardProps> = ({
  selectedClasses,
  disciplineColorMap,
  onClearGrade,
  onRemoveClass,
  shiftFilter,
  onShiftFilterChange,
  onGenerateCombinations,
  onSaveGrade,
  isSolving,
  isSaving,
}) => {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-paper border-2 border-ink rounded-lg shadow-[2px_2px_0px_0px_var(--neo-shadow)] shrink-0">
            <BookMarked className="w-4 h-4 stroke-[2.5] text-blue-ink" />
          </div>
          <h3 className="text-sm font-extrabold tracking-tight text-black">
            Minha grade
          </h3>
          {selectedClasses.length > 0 ? (
            <Badge variant="neutral" size="sm">
              {selectedClasses.length}
            </Badge>
          ) : null}
        </div>
        {selectedClasses.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearGrade}
            className="text-neo-danger hover:text-neo-dangerHover hover:bg-pastel-red text-[11px] h-7 px-2 rounded-lg shadow-none hover:shadow-none"
          >
            <Trash2 className="w-3 h-3 stroke-[2.5]" />
            Limpar grade
          </Button>
        ) : null}
      </div>

      {/* Ações do Gerador Automático de Horários */}
      <div className="pb-4 border-b-2 border-neutral-400 space-y-3">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600 block mb-1.5">
            Preferência de turno
          </span>
          <Tabs
            items={SHIFT_TABS}
            activeId={shiftFilter}
            onChange={(id) =>
              onShiftFilterChange(id as "ALL" | "M" | "T" | "N")
            }
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            variant="accent"
            size="sm"
            onClick={onGenerateCombinations}
            disabled={selectedClasses.length === 0 || isSolving}
            isLoading={isSolving}
            className="flex-1"
            title="Troca as turmas de cada disciplina até achar horários sem conflito"
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Gerar combinações</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSaveGrade}
            disabled={isSaving}
            isLoading={isSaving}
            title="Salva a grade no seu computador"
          >
            <Save className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Salvar grade</span>
          </Button>
        </div>
      </div>

      {selectedClasses.length === 0 ? (
        <div className="py-5 px-4 text-center bg-pastel-blue/60 border-2 border-dashed border-ink/25 rounded-lg space-y-1.5">
          <BookOpen className="w-5 h-5 stroke-[2.5] text-blue-ink mx-auto" />
          <p className="text-xs font-extrabold text-black">
            Sua grade está vazia
          </p>
          <p className="text-[11px] font-semibold text-neutral-600">
            Expanda uma disciplina no catálogo abaixo e adicione a turma que
            quer cursar.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {selectedClasses.map((cls) => {
            const color =
              disciplineColorMap.get(cls.disciplineCode) ||
              DISCIPLINE_COLORS[0];
            return (
              <div
                key={cls.id}
                className={`p-2.5 rounded-lg border-2 ${color.border} ${color.bg} flex items-center justify-between gap-2`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-xs text-black">
                      {cls.disciplineCode}
                    </span>
                    <span className="font-black text-xs text-black">
                      (T{cls.classCode} - {cls.scheduleCode})
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-neutral-800 truncate mt-0.5">
                    {cls.disciplineName}
                  </p>
                  <p className="text-[11px] font-semibold text-neutral-600 truncate">
                    {cls.classroom}
                    {cls.scheduleDescription
                      ? ` • ${cls.scheduleDescription}`
                      : ""}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveClass(cls.id)}
                  title="Remover da grade"
                  className="h-9 w-9 text-neo-danger hover:text-neo-dangerHover hover:bg-pastel-red shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
