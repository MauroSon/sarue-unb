import React, { useState, useEffect } from "react";
import type { Course, Discipline } from "@/core";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link2, EyeOff, BookOpen, AlertCircle } from "lucide-react";

export interface UnmatchedCourseDialogProps {
  course: Course | null;
  disciplines: Discipline[];
  isOpen: boolean;
  onAssociate: (aprenderCourseId: string, sigaaCourseId: string) => void;
  onIgnore: (aprenderCourseId: string) => void;
  onClose: () => void;
}

export const UnmatchedCourseDialog: React.FC<UnmatchedCourseDialogProps> = ({
  course,
  disciplines,
  isOpen,
  onAssociate,
  onIgnore,
  onClose,
}) => {
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>("");

  useEffect(() => {
    if (disciplines.length > 0 && !selectedDisciplineId) {
      setSelectedDisciplineId(disciplines[0].id);
    }
  }, [disciplines, selectedDisciplineId]);

  if (!course) return null;

  const handleAssociate = () => {
    if (!selectedDisciplineId) return;
    onAssociate(course.id, selectedDisciplineId);
  };

  const handleIgnore = () => {
    onIgnore(course.id);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent showCloseButton={true} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-neo-yellow border-2 border-ink flex items-center justify-center shadow-[2px_2px_0px_0px_var(--neo-shadow)]">
              <AlertCircle className="w-4 h-4 stroke-[2.5] text-ink" />
            </div>
            <DialogTitle>
              Associar Turma (
              {course.platform === "teams" ? "Microsoft Teams" : "Aprender 3"})
            </DialogTitle>
          </div>
          <DialogDescription>
            Esta turma do{" "}
            {course.platform === "teams" ? "Microsoft Teams" : "Aprender 3"} não
            pôde ser associada automaticamente a nenhuma disciplina do seu
            semestre no SIGAA.
          </DialogDescription>
        </DialogHeader>

        {/* Card de Destaque da Turma */}
        <div className="bg-canvas border-2 border-ink rounded-lg p-3.5 space-y-2 shadow-(--neo-card-shadow)">
          <div className="flex items-center justify-between gap-2">
            <Badge variant={course.platform}>
              {course.platform === "teams" ? "Teams" : "Aprender 3"}
            </Badge>
            {course.code ? (
              <span className="text-[11px] font-bold bg-paper px-2 py-0.5 border border-ink rounded-md">
                {course.code}
              </span>
            ) : null}
          </div>
          <p className="text-xs font-bold text-black leading-snug">
            {course.name}
          </p>
        </div>

        {/* Seleção de Disciplina Destino ou Outros */}
        <div className="space-y-1.5 pt-1">
          <label
            htmlFor="discipline-select"
            className="text-xs font-bold text-black flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 stroke-[2.5] text-blue-ink" />
            <span>Associar a:</span>
          </label>
          <Select
            value={selectedDisciplineId}
            onValueChange={(value) => setSelectedDisciplineId(String(value))}
          >
            <SelectTrigger
              id="discipline-select"
              className="bg-canvas shadow-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {disciplines.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  Disciplina: {d.name}{" "}
                  {d.code && d.code !== d.name ? `(${d.code})` : ""}
                </SelectItem>
              ))}
              <SelectItem value="__others__">Outros</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] font-medium text-neutral-500">
            {selectedDisciplineId === "__others__"
              ? "Esta turma será exibida na seção Outros (ideal para monitorias e projetos)."
              : "Os avisos e tarefas desta turma aparecerão no feed exclusivo desta disciplina."}
          </p>
        </div>

        {/* Ações do Rodapé */}
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleIgnore}
            className="cursor-pointer flex items-center gap-1.5 text-xs text-neutral-700 hover:text-black"
          >
            <EyeOff className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Ignorar Turma</span>
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleAssociate}
            disabled={!selectedDisciplineId}
            className="cursor-pointer flex items-center gap-1.5 text-xs bg-neo-blue text-white hover:bg-neo-blueHover"
          >
            <Link2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Associar Agora</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
