import React from 'react';
import { Calendar, ExternalLink, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui';
import type { UnifiedCalendarEvent } from '@/core';

interface AcademicMilestoneBannerProps {
  milestones: UnifiedCalendarEvent[];
  semesterLabel?: string;
  pdfUrl?: string;
}

export const AcademicMilestoneBanner: React.FC<AcademicMilestoneBannerProps> = ({
  milestones,
  semesterLabel = '2026.2',
  pdfUrl,
}) => {
  if (milestones.length === 0) return null;

  // Formata data brasileira "DD/MM"
  const formatDateBR = (iso: string) => {
    const parts = iso.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return iso;
  };

  return (
    <div className="border-2 border-ink bg-pastel-yellow dark:bg-paper dark:border-l-[6px] dark:border-l-neo-yellow rounded-xl p-4 shadow-[4px_4px_0px_0px_var(--neo-shadow)] transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-highlighter-yellow border-2 border-ink flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_var(--neo-shadow)]">
            <GraduationCap className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="neutral" size="sm" className="font-black uppercase tracking-wider">
                Calendário Acadêmico UnB {semesterLabel}
              </Badge>
              <span className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200">
                Próximos Marcos Institucionais
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {milestones.map((m) => {
                const isDeadline = m.isDeadline;
                return (
                  <div
                    key={m.id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2 border-ink text-xs font-bold ${
                      isDeadline
                        ? 'bg-pastel-red text-ink-error dark:bg-paper dark:text-ink-error'
                        : 'bg-paper text-black'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 stroke-[2.5] text-neo-blue" />
                    <span>{m.title}:</span>
                    <span className="font-extrabold">
                      {m.endDate && m.endDate !== m.date
                        ? `${formatDateBR(m.date)} a ${formatDateBR(m.endDate)}`
                        : formatDateBR(m.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start md:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-ink bg-paper hover:bg-neutral-100 text-black text-xs font-extrabold shadow-[2px_2px_0px_0px_var(--neo-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_var(--neo-shadow)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all shrink-0 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>PDF Oficial SAA</span>
          </a>
        )}
      </div>
    </div>
  );
};
