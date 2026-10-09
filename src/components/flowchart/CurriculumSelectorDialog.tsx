import React, { useMemo } from "react";
import type { CurriculumStructure } from "@/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
} from "@/components/ui";
import { BookOpen, Check } from "lucide-react";

export interface CurriculumSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  curricula: CurriculumStructure[];
  currentCurriculumId?: string;
  currentCurriculumCode?: string;
  initialCourseName?: string;
  onSelect: (curriculum: CurriculumStructure) => void;
}

export const CurriculumSelectorDialog: React.FC<
  CurriculumSelectorDialogProps
> = ({
  isOpen,
  onClose,
  curricula,
  currentCurriculumId,
  currentCurriculumCode,
  onSelect,
}) => {
  // Ordena: matriz atual primeiro, depois ativas, depois mais recentes
  const sorted = useMemo(() => {
    return [...curricula].sort((a, b) => {
      const aCurrent =
        a.code === currentCurriculumCode || a.id === currentCurriculumId;
      const bCurrent =
        b.code === currentCurriculumCode || b.id === currentCurriculumId;
      if (aCurrent !== bCurrent) return aCurrent ? -1 : 1;
      if ((a.status === "Ativa") !== (b.status === "Ativa"))
        return a.status === "Ativa" ? -1 : 1;
      return (b.createdYear || "").localeCompare(a.createdYear || "");
    });
  }, [curricula, currentCurriculumId, currentCurriculumCode]);

  const handleSelectStructure = (structure: CurriculumStructure) => {
    onSelect(structure);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={true}
        className="sm:max-w-xl max-h-[85vh] flex flex-col"
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-pastel-yellow border-2 border-black flex items-center justify-center shadow-neo-sm">
              <BookOpen className="w-4 h-4 stroke-[2.5] text-black" />
            </div>
            <DialogTitle>Trocar Matriz Curricular</DialogTitle>
          </div>
          <DialogDescription>
            Estruturas curriculares do seu curso, ativas e inativas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 pb-1 pr-1 max-h-[420px]">
          {sorted.map((curr) => {
            const isSelected =
              curr.id === currentCurriculumId ||
              curr.code === currentCurriculumCode;
            const isActive = curr.status === "Ativa";

            return (
              <div
                key={curr.id}
                onClick={() => handleSelectStructure(curr)}
                className={`cursor-pointer border-2 border-black rounded-lg p-3 flex items-center justify-between gap-2 transition-all duration-150 select-none shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                  isSelected
                    ? "bg-pastel-green"
                    : "bg-white hover:bg-neutral-50"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono font-black text-sm text-black px-2 py-0.5 bg-white border border-black rounded-md">
                      {curr.code}
                    </span>
                    <Badge
                      className={`text-[11px] font-black border border-black ${
                        isActive
                          ? "bg-neo-green text-black"
                          : "bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {curr.status}
                    </Badge>
                    {curr.createdYear && (
                      <span className="text-[11px] font-bold text-neutral-600 bg-white border border-neutral-300 px-1.5 py-0.5 rounded">
                        Criada em {curr.createdYear}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold text-neutral-700">
                    {curr.shift && <span>Turno: {curr.shift}</span>}
                    {curr.totalHours && (
                      <span>· {curr.totalHours}h totais</span>
                    )}
                    <span>
                      · {curr.mandatoryDisciplines.length} obrigatórias
                    </span>
                    {curr.electiveDisciplines?.length > 0 && (
                      <span>· {curr.electiveDisciplines.length} optativas</span>
                    )}
                  </div>
                </div>

                {isSelected ? (
                  <div className="shrink-0 flex items-center gap-1 px-2 py-1 bg-neo-green border border-black rounded-md text-[11px] font-black">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    Atual
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-bold shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectStructure(curr);
                    }}
                  >
                    Selecionar
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
