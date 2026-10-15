import React, { useMemo } from 'react';
import { Badge, Button, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui';
import type { Discipline, FeedItem } from '@/core';
import { Archive, ArchiveRestore, Circle, CheckCircle, Check, ClipboardList, ExternalLink, FileText, MoreHorizontal } from 'lucide-react';
import { openExternalUrl } from '../../lib/utils';

export interface FeedListProps {
  items: FeedItem[];
  disciplines?: Discipline[];
  showDiscipline?: boolean;
  onToggleComplete?: (id: string, currentStatus?: boolean) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
}

const PLATFORM_LABELS: Record<string, string> = {
  aprender3: 'Aprender 3',
  sigaa: 'Sigaa',
  teams: 'Teams',
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Prazo curto para o pill da direita; urgência manda na cor
const getDueStatus = (dueDateStr?: string) => {
  if (!dueDateStr) return null;
  const diffHours = (new Date(dueDateStr).getTime() - Date.now()) / (1000 * 60 * 60);
  if (diffHours < 0) return { label: 'Encerrado', isUrgent: true };
  if (diffHours <= 24) return { label: '<24h', isUrgent: true };
  if (diffHours <= 48) return { label: '2 dias', isUrgent: false };
  return { label: null, isUrgent: false };
};

/**
 * Lista do feed no formato edição (referência GitHub): sem cabeçalho de coluna,
 * linha gorda de duas alturas — título em cima, meta inline embaixo. Clareza vem
 * dos rótulos ("Enviado em…", "Entrega…"), não de colunas. Ações no menu ⋯.
 */
export const FeedList: React.FC<FeedListProps> = ({
  items,
  showDiscipline = true,
  disciplines = [],
  onToggleComplete,
  onArchive,
  onRestore,
}) => {
  // Nome oficial da disciplina (SIGAA) por nome de turma associada (SIGAA ou Aprender 3)
  const disciplineNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of disciplines) {
      if (d.sigaaCourse) map.set(d.sigaaCourse.name, d.name);
      map.set(d.name, d.name);
      for (const ac of d.aprenderCourses) map.set(ac.name, d.name);
    }
    return map;
  }, [disciplines]);

  return (
    <ul role="list" className="divide-y-2 divide-black/10">
      {items.map((item) => {
        const isAssignment = item.itemType === 'assignment';
        const dueStatus = isAssignment ? getDueStatus(item.dueDate) : null;
        const platformLabel = PLATFORM_LABELS[item.platform] ?? item.platform;
        const titleTone = item.isCompleted
          ? 'text-neutral-600 line-through'
          : item.isArchived
          ? 'text-neutral-500'
          : 'text-black';
        const TypeIcon = isAssignment ? ClipboardList : FileText;
        const disciplineLabel = disciplineNames.get(item.courseName) || item.courseName || item.courseCode;

        return (
          <li
            key={item.id}
            className={`flex items-center gap-3 px-4 md:px-5 py-4 transition-colors duration-150 ${
              item.isCompleted
                ? 'bg-neutral-100/80 hover:bg-neutral-200/70'
                : item.isArchived
                ? 'bg-neutral-50/70 hover:bg-neutral-100/70'
                : 'hover:bg-neutral-50'
            }`}
          >
            {/* Indicador interativo de conclusão para tarefas ou ícone de tipo para avisos */}
            {isAssignment && onToggleComplete ? (
              <button
                type="button"
                onClick={() => onToggleComplete(item.id, item.isCompleted)}
                title={item.isCompleted ? 'Marcar como não concluído' : 'Marcar como concluído'}
                aria-label={item.isCompleted ? 'Marcar como não concluído' : 'Marcar como concluído'}
                className={`w-5 h-5 rounded-md border-2 border-black flex items-center justify-center shrink-0 cursor-pointer transition-[transform,box-shadow,background-color] duration-150 ease-out shadow-[1px_1px_0px_0px_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none active:translate-x-[1px] active:translate-y-[1px] ${
                  item.isCompleted
                    ? 'bg-neo-green text-black'
                    : 'bg-white hover:bg-neutral-100 text-neutral-400'
                }`}
              >
                {item.isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : null}
              </button>
            ) : (
              <TypeIcon className="w-4 h-4 stroke-[2.5] shrink-0 text-neutral-700" aria-hidden />
            )}

            {/* Título + meta */}
            <div className="min-w-0 flex-1">
              <span
                title={item.title}
                className={`block truncate text-sm font-bold ${titleTone}`}
              >
                {item.title}
              </span>

              <div className="mt-1 flex items-center gap-2 min-w-0 text-[11px] font-semibold text-neutral-500">
                <Badge variant={item.platform} size="sm" className="shrink-0">
                  {platformLabel}
                </Badge>
                {showDiscipline && disciplineLabel ? (
                  <span
                    className="shrink-0 inline-block max-w-[160px] truncate text-[11px] font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_#000]"
                    title={item.courseName}
                  >
                    {disciplineLabel}
                  </span>
                ) : null}
                <span className="truncate whitespace-nowrap">Enviado em {formatDate(item.createdAt)}</span>
                {item.dueDate ? (
                  <span className="truncate whitespace-nowrap">· Entrega {formatDate(item.dueDate)}</span>
                ) : null}
              </div>
            </div>

            {/* Prazo: pill curto + data completa, alinhado à direita */}
            {dueStatus ? (
              <div className="shrink-0 hidden sm:flex flex-col items-end gap-1">
                {dueStatus.label ? (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000] ${
                      dueStatus.isUrgent ? 'bg-neo-danger text-white' : 'bg-neo-yellow text-black'
                    }`}
                  >
                    {dueStatus.label}
                  </span>
                ) : null}
                <span className="text-[11px] font-semibold text-neutral-600 whitespace-nowrap">
                  {item.dueDate ? formatDate(item.dueDate) : ''}
                </span>
              </div>
            ) : null}

            {/* Ações */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Ações para: ${item.title}`}
                    className="h-8 w-8 rounded-lg text-neutral-600 hover:text-black shrink-0"
                  />
                }
              >
                <MoreHorizontal className="w-4 h-4 stroke-[2.5]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {item.externalUrl ? (
                  <DropdownMenuItem onClick={() => openExternalUrl(item.externalUrl!)}>
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir no {platformLabel}</span>
                  </DropdownMenuItem>
                ) : null}
                {isAssignment && onToggleComplete ? (
                  <DropdownMenuItem onClick={() => onToggleComplete(item.id, item.isCompleted)}>
                    {item.isCompleted ? (
                      <>
                        <Circle className="w-3.5 h-3.5" />
                        <span>Marcar como não concluído</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Marcar como concluído</span>
                      </>
                    )}
                  </DropdownMenuItem>
                ) : null}
                {item.externalUrl || (isAssignment && onToggleComplete) ? <DropdownMenuSeparator /> : null}
                {item.isArchived ? (
                  onRestore ? (
                    <DropdownMenuItem onClick={() => onRestore(item.id)}>
                      <ArchiveRestore className="w-3.5 h-3.5" />
                      <span>Desarquivar</span>
                    </DropdownMenuItem>
                  ) : null
                ) : onArchive ? (
                  <DropdownMenuItem onClick={() => onArchive(item.id)}>
                    <Archive className="w-3.5 h-3.5" />
                    <span>Arquivar</span>
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        );
      })}
    </ul>
  );
};
