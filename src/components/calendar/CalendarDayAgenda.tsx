import React from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Edit3,
  Trash2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui';
import type { UnifiedCalendarEvent, UserCalendarEvent } from '@/core';
import { getCalendarEventColors } from './calendar-colors';

interface CalendarDayAgendaProps {
  selectedDate: string; // ISO "YYYY-MM-DD"
  events: UnifiedCalendarEvent[];
  onAddEvent: (date: string) => void;
  onEditEvent: (event: UserCalendarEvent) => void;
  onDeleteEvent: (event: UnifiedCalendarEvent) => void;
}

const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const WEEKDAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export const CalendarDayAgenda: React.FC<CalendarDayAgendaProps> = ({
  selectedDate,
  events,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
}) => {
  const [yearStr, monthStr, dayStr] = selectedDate.split('-');
  const y = Number(yearStr);
  const m = Number(monthStr) - 1;
  const d = Number(dayStr);
  const dateObj = new Date(y, m, d);

  const weekday = WEEKDAY_NAMES[dateObj.getDay()];
  const monthName = MONTH_NAMES[m];

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  return (
    <div className="bg-paper border-2 border-ink rounded-xl p-4 shadow-[4px_4px_0px_0px_var(--neo-shadow)] flex flex-col h-full min-h-[480px]">
      {/* Cabeçalho do Dia Selecionado */}
      <div className="flex items-start justify-between gap-2 pb-4 border-b-2 border-ink/10 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-neo-blue">
              {weekday}
            </span>
            {isToday && (
              <span className="px-2 py-0.5 rounded-full border border-ink bg-highlighter-yellow text-black font-black text-[11px] uppercase shadow-[1px_1px_0px_0px_var(--neo-shadow)]">
                Hoje
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-black tracking-tight mt-0.5">
            {d} de {monthName} <span className="text-neutral-500 font-bold">{y}</span>
          </h2>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAddEvent(selectedDate)}
          className="flex items-center gap-1 text-xs font-black shrink-0"
          title="Adicionar evento neste dia"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Adicionar</span>
        </Button>
      </div>

      {/* Lista de Eventos do Dia */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-6 h-full min-h-[220px] rounded-xl border-2 border-dashed border-ink/20 bg-canvas/40">
            <div className="w-12 h-12 rounded-xl bg-paper border-2 border-ink flex items-center justify-center mb-3 shadow-[2px_2px_0px_0px_var(--neo-shadow)]">
              <CalendarIcon className="w-6 h-6 text-neutral-400 stroke-[2.5]" />
            </div>
            <p className="font-extrabold text-sm text-black">Nenhum evento neste dia</p>
            <p className="text-xs text-neutral-600 mt-1 max-w-[200px]">
              Insira uma prova, trabalho, monitoria ou compromisso pessoal.
            </p>
            <Button
              type="button"
              variant="accent"
              size="sm"
              onClick={() => onAddEvent(selectedDate)}
              className="mt-4 font-black text-xs"
            >
              + Adicionar Evento
            </Button>
          </div>
        ) : (
          events.map((evt) => {
            const isManual = evt.type === 'manual';
            const isAcademic = evt.type === 'academic';
            const isFeed = evt.type === 'feed_task';
            const isCompleted = Boolean(evt.isCompleted);
            const color = getCalendarEventColors(evt);

            return (
              <div
                key={evt.id}
                className={`p-3 rounded-lg border-2 ${color.border} ${color.bg} transition-all shadow-[2px_2px_0px_0px_var(--neo-shadow)] ${
                  isCompleted ? 'opacity-50' : ''
                }`}
              >
                {/* Linha de Badges e Ações */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full border border-ink text-[11px] font-black uppercase tracking-wider ${color.badgeBg} ${color.badgeText}`}
                    >
                      {isAcademic ? 'UnB Oficial' : isFeed ? 'Scrapeado' : 'Meu Evento'}
                    </span>

                    {evt.categoryLabel && (
                      <span className="px-2 py-0.5 rounded-full border border-ink bg-paper text-black text-[11px] font-bold">
                        {evt.categoryLabel}
                      </span>
                    )}

                    {evt.courseCode && (
                      <span className="px-1.5 py-0.5 rounded font-mono text-[11px] font-black border border-ink bg-paper text-black">
                        {evt.courseCode}
                      </span>
                    )}
                  </div>

                  {/* Ações para eventos manuais */}
                  {isManual && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditEvent(evt.rawPayload as UserCalendarEvent)}
                        title="Editar evento"
                        className="p-1 rounded-md border border-ink bg-paper hover:bg-neutral-100 text-black shadow-[1px_1px_0px_0px_var(--neo-shadow)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteEvent(evt)}
                        title="Excluir evento"
                        className="p-1 rounded-md border border-ink bg-paper hover:bg-correction-red/20 text-neutral-800 hover:text-correction-red-strong shadow-[1px_1px_0px_0px_var(--neo-shadow)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Título do Evento e Detalhes */}
                <div className="space-y-1.5">
                  <h3 className="text-sm font-extrabold text-black leading-snug break-words">
                    {evt.title}
                  </h3>

                  {/* Informações de Período / Data */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-800 font-bold">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className={`w-3.5 h-3.5 stroke-[2.5] ${color.accentText}`} />
                      <span>
                        {evt.endDate && evt.endDate !== evt.date ? (
                          <>
                            Período:{' '}
                            <strong className="font-extrabold text-black">
                              {evt.date.split('-').reverse().slice(0, 2).join('/')} a{' '}
                              {evt.endDate.split('-').reverse().slice(0, 2).join('/')}
                            </strong>
                          </>
                        ) : (
                          <strong className="font-extrabold text-black">
                            {evt.date.split('-').reverse().slice(0, 2).join('/')}
                          </strong>
                        )}
                      </span>
                    </div>

                    {evt.startTime && !evt.allDay && (
                      <div className="flex items-center gap-1">
                        <Clock className={`w-3.5 h-3.5 stroke-[2.5] ${color.accentText}`} />
                        <span className="text-black font-extrabold">
                          {evt.startTime}
                          {evt.endTime ? ` às ${evt.endTime}` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Descrição oficial (quando disponível, ex.: calendários da SAA) */}
                  {evt.description && (
                    <p className="text-xs text-neutral-800 leading-relaxed font-medium bg-paper/85 p-2 rounded-lg border border-ink/15">
                      {evt.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
