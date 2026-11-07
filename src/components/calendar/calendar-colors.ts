import type { UnifiedCalendarEvent, CalendarEventCategory } from '@/core';

export interface CalendarEventColorStyle {
  bg: string;
  border: string;
  text: string;
  accentText: string;
  badgeBg: string;
  badgeText: string;
  hex: string;
  label: string;
}

export function getCalendarEventColors(evt: {
  type: UnifiedCalendarEvent['type'];
  category?: CalendarEventCategory;
  isDeadline?: boolean;
}): CalendarEventColorStyle {
  // Cores por tipo primário de evento:
  // academic (Oficial UnB) -> Azul
  // manual (Meu Evento) -> Verde
  // feed_task (Tarefas Scrapeadas) -> Amarelo / Âmbar
  switch (evt.type) {
    case 'academic':
      return {
        bg: 'bg-pastel-blue',
        border: 'border-[#468AFB]',
        text: 'text-[#1e40af] dark:text-[#BFDBFE]',
        accentText: 'text-[#2563EB] dark:text-[#60A5FA]',
        badgeBg: 'bg-[#468AFB] text-white',
        badgeText: 'text-white',
        hex: '#468AFB',
        label: 'UnB Oficial',
      };
    case 'feed_task':
      return {
        bg: 'bg-pastel-yellow',
        border: 'border-[#EAB308]',
        text: 'text-[#854d0e] dark:text-[#FEF08A]',
        accentText: 'text-[#A16207] dark:text-[#FACC15]',
        badgeBg: 'bg-[#EAB308] text-black',
        badgeText: 'text-black',
        hex: '#EAB308',
        label: 'Scrapeado',
      };
    case 'manual':
    default:
      return {
        bg: 'bg-pastel-green',
        border: 'border-[#16A34A]',
        text: 'text-[#15803d] dark:text-[#BBF7D0]',
        accentText: 'text-[#16A34A] dark:text-[#4ADE80]',
        badgeBg: 'bg-[#16A34A] text-white dark:text-black',
        badgeText: 'text-white dark:text-black',
        hex: '#16A34A',
        label: 'Meu Evento',
      };
  }
}
