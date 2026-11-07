import React, { useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ListFilter,
  GraduationCap,
  CheckSquare,
  BookOpen,
} from 'lucide-react';
import {
  Button,
  SegmentedControl,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  type SegmentedOption,
} from '@/components/ui';
import type { CalendarViewMode } from '@/hooks/useCalendar';
import type { Course } from '@/core';

interface CalendarToolbarProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  showAcademic: boolean;
  onToggleAcademic: () => void;
  showManual: boolean;
  onToggleManual: () => void;
  showFeedTasks: boolean;
  onToggleFeedTasks: () => void;
  courses: Course[];
  selectedCourse: string;
  onCourseChange: (course: string) => void;
  onOpenCreateDialog?: () => void;
}

const VIEW_OPTIONS: ReadonlyArray<SegmentedOption<CalendarViewMode>> = [
  { value: 'month', label: 'Mês & Agenda', title: 'Grade mensal e agenda do dia' },
  { value: 'agenda', label: 'Agenda Completa', title: 'Linha do tempo contínua de eventos' },
];

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
  viewMode,
  onViewModeChange,
  showAcademic,
  onToggleAcademic,
  showManual,
  onToggleManual,
  showFeedTasks,
  onToggleFeedTasks,
  courses,
  selectedCourse,
  onCourseChange,
  onOpenCreateDialog,
}) => {
  const monthName = MONTH_NAMES[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  const courseOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>();
    courses.forEach((c) => {
      const key = (c.code || c.name).trim();
      if (!key) return;
      const upper = key.toUpperCase();
      if (!map.has(upper)) {
        const label = c.code && c.code !== c.name ? `${c.code} - ${c.name}` : c.name;
        map.set(upper, {
          value: upper,
          label,
        });
      }
    });

    return [
      { value: 'all', label: 'Todas as matérias' },
      ...Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [courses]);

  return (
    <div className="bg-paper border-2 border-ink rounded-xl p-4 shadow-[4px_4px_0px_0px_var(--neo-shadow)] space-y-4">
      {/* Linha superior: Navegação de Mês/Ano + Alternador de Visão + Botão Novo Evento */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Navegador de Mês */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border-2 border-ink rounded-xl bg-canvas overflow-hidden shadow-[2px_2px_0px_0px_var(--neo-shadow)]">
            <button
              type="button"
              onClick={onPrevMonth}
              title="Mês anterior"
              aria-label="Mês anterior"
              className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-300 transition-colors text-black active:translate-y-[1px]"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <div className="px-4 py-1.5 border-x-2 border-ink min-w-[170px] text-center bg-paper">
              <span className="font-black text-base tracking-tight text-black block capitalize">
                {monthName} <span className="text-neo-blue">{year}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={onNextMonth}
              title="Próximo mês"
              aria-label="Próximo mês"
              className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-300 transition-colors text-black active:translate-y-[1px]"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGoToToday}
            className="font-bold text-xs"
            title="Voltar para o dia de hoje"
          >
            Hoje
          </Button>
        </div>

        {/* Lado Direito: Alternador Mês/Agenda */}
        <div className="flex items-center gap-3">
          <SegmentedControl<CalendarViewMode>
            options={VIEW_OPTIONS}
            value={viewMode}
            onValueChange={onViewModeChange}
            ariaLabel="Modo de visualização do calendário"
            size="sm"
            className="w-56"
          />
        </div>
      </div>

      {/* Linha inferior: Filtros de Tipo e Barra de Busca */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t-2 border-ink/10 dark:border-white/10">
        {/* Chips de filtro com visual de adesivos */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black uppercase tracking-wider text-neutral-500 mr-1 flex items-center gap-1">
            <ListFilter className="w-3.5 h-3.5 stroke-[2.5]" />
            Filtros:
          </span>

          <button
            type="button"
            onClick={onToggleAcademic}
            aria-pressed={showAcademic}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              showAcademic
                ? 'bg-pastel-blue text-[#1e40af] dark:text-[#BFDBFE] border-2 border-[#468AFB] shadow-[2px_2px_0px_0px_var(--neo-shadow)]'
                : 'bg-paper text-neutral-600 border-2 border-dashed border-ink/30 hover:border-solid hover:text-black'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 stroke-[2.5] text-[#468AFB]" />
            <span>Calendário Acadêmico (UnB)</span>
          </button>

          <button
            type="button"
            onClick={onToggleManual}
            aria-pressed={showManual}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              showManual
                ? 'bg-pastel-green text-[#15803d] dark:text-[#BBF7D0] border-2 border-[#16A34A] shadow-[2px_2px_0px_0px_var(--neo-shadow)]'
                : 'bg-paper text-neutral-600 border-2 border-dashed border-ink/30 hover:border-solid hover:text-black'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 stroke-[2.5] text-[#16A34A]" />
            <span>Meus Eventos</span>
          </button>

          <button
            type="button"
            onClick={onToggleFeedTasks}
            aria-pressed={showFeedTasks}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              showFeedTasks
                ? 'bg-pastel-yellow text-[#854d0e] dark:text-[#FEF08A] border-2 border-[#EAB308] shadow-[2px_2px_0px_0px_var(--neo-shadow)]'
                : 'bg-paper text-neutral-600 border-2 border-dashed border-ink/30 hover:border-solid hover:text-black'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 stroke-[2.5] text-[#EAB308]" />
            <span>Tarefas do Feed</span>
          </button>
        </div>

        {/* Select de filtro por matérias do usuário */}
        <div className="w-full sm:w-[260px] shrink-0">
          <Select
            value={selectedCourse || 'all'}
            items={courseOptions}
            onValueChange={(val) => {
              if (val) onCourseChange(val);
            }}
          >
            <SelectTrigger
              className={`h-[34px] w-full px-3 text-xs font-bold rounded-xl border-2 border-ink shadow-[2px_2px_0px_0px_var(--neo-shadow)] transition-all ${
                selectedCourse && selectedCourse !== 'all'
                  ? 'bg-pastel-blue text-[#1e40af] dark:text-[#BFDBFE] border-[#468AFB]'
                  : 'bg-paper text-black'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <BookOpen className="w-3.5 h-3.5 stroke-[2.5] text-neo-blue shrink-0" />
                <SelectValue>
                  {courseOptions.find((opt) => opt.value === (selectedCourse || 'all'))?.label ?? 'Todas as matérias'}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              {courseOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
