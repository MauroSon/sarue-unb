import React from 'react';
import {
  Clock,
  Edit3,
  Trash2,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui';
import type { UnifiedCalendarEvent, UserCalendarEvent } from '@/core';
import { getCalendarEventColors } from './calendar-colors';

interface CalendarAgendaViewProps {
  events: UnifiedCalendarEvent[];
  onAddEvent: () => void;
  onEditEvent: (event: UserCalendarEvent) => void;
  onDeleteEvent: (event: UnifiedCalendarEvent) => void;
}

export const CalendarAgendaView: React.FC<CalendarAgendaViewProps> = ({
  events,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Agrupa eventos por data
  const groupedEvents = React.useMemo(() => {
    const map = new Map<string, UnifiedCalendarEvent[]>();
    for (const evt of events) {
      const list = map.get(evt.date) || [];
      list.push(evt);
      map.set(evt.date, list);
    }
    return Array.from(map.entries()).sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
  }, [events]);

  const formatDateHeader = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    const month = dateObj.toLocaleDateString('pt-BR', { month: 'long' });

    let relativeBadge: string | null = null;
    if (dateStr === todayStr) {
      relativeBadge = 'Hoje';
    } else {
      const now = new Date();
      const diffTime = dateObj.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) relativeBadge = 'Amanhã';
      else if (diffDays === -1) relativeBadge = 'Ontem';
      else if (diffDays > 1 && diffDays <= 7) relativeBadge = `Em ${diffDays} dias`;
    }

    return {
      title: `${d} de ${month} de ${y}`,
      weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
      relativeBadge,
    };
  };

  if (events.length === 0) {
    return (
      <div className="bg-paper border-2 border-ink rounded-xl p-8 text-center shadow-[4px_4px_0px_0px_var(--neo-shadow)]">
        <div className="w-16 h-16 rounded-xl bg-canvas border-2 border-ink flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_0px_var(--neo-shadow)]">
          <CalendarIcon className="w-8 h-8 text-neutral-500 stroke-[2.5]" />
        </div>
        <h3 className="text-lg font-black text-black">Nenhum evento encontrado</h3>
        <p className="text-sm font-medium text-neutral-600 mt-1 max-w-sm mx-auto">
          Tente ajustar os filtros ou insira um novo evento manual no calendário.
        </p>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onAddEvent}
          className="mt-4 font-black"
        >
          + Adicionar Primeiro Evento
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedEvents.map(([dateStr, items]) => {
        const headerInfo = formatDateHeader(dateStr);
        const isToday = dateStr === todayStr;

        return (
          <div
            key={dateStr}
            className={`bg-paper border-2 border-ink rounded-xl p-4 sm:p-5 shadow-[4px_4px_0px_0px_var(--neo-shadow)] transition-all ${
              isToday ? 'ring-2 ring-neo-blue ring-offset-2' : ''
            }`}
          >
            {/* Header da Data */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-ink/10 dark:border-white/10 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-canvas border-2 border-ink flex items-center justify-center font-black text-xs text-black shadow-[1px_1px_0px_0px_var(--neo-shadow)]">
                  {dateStr.split('-')[2]}
                </div>
                <div>
                  <h3 className="text-base font-black text-black tracking-tight leading-none">
                    {headerInfo.title}
                  </h3>
                  <span className="text-xs font-bold text-neutral-500 block mt-0.5">
                    {headerInfo.weekday}
                  </span>
                </div>
              </div>

              {headerInfo.relativeBadge && (
                <span
                  className={`px-2.5 py-1 rounded-full border border-ink text-xs font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_var(--neo-shadow)] ${
                    isToday
                      ? 'bg-highlighter-yellow text-black'
                      : 'bg-pastel-blue text-black'
                  }`}
                >
                  {headerInfo.relativeBadge}
                </span>
              )}
            </div>

            {/* Lista de Eventos do Grupo */}
            <div className="space-y-3">
              {items.map((evt) => {
                const isManual = evt.type === 'manual';
                const isCompleted = Boolean(evt.isCompleted);
                const color = getCalendarEventColors(evt);

                return (
                  <div
                    key={evt.id}
                    className={`p-3.5 rounded-lg border-2 ${color.border} ${color.bg} transition-all shadow-[2px_2px_0px_0px_var(--neo-shadow)] ${
                      isCompleted ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full border border-ink text-[11px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_var(--neo-shadow)] ${color.badgeBg} ${color.badgeText}`}
                        >
                          {evt.type === 'academic'
                            ? 'UnB Oficial'
                            : evt.type === 'feed_task'
                            ? 'Scrapeado'
                            : 'Meu Evento'}
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

                      <div className="flex items-center gap-1.5">
                        {isManual && (
                          <>
                            <button
                              type="button"
                              onClick={() => onEditEvent(evt.rawPayload as UserCalendarEvent)}
                              title="Editar evento"
                              className="p-1 rounded-md border border-ink bg-paper hover:bg-neutral-100 text-black shadow-[1px_1px_0px_0px_var(--neo-shadow)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteEvent(evt)}
                              title="Excluir evento"
                              className="p-1 rounded-md border border-ink bg-paper hover:bg-correction-red/20 text-neutral-800 hover:text-correction-red-strong shadow-[1px_1px_0px_0px_var(--neo-shadow)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-sm font-extrabold text-black">
                        {evt.title}
                      </h4>

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

                      {evt.description && (
                        <p className="mt-2 text-xs text-neutral-800 leading-relaxed font-medium bg-paper/85 p-2.5 rounded-lg border border-ink/15">
                          {evt.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
