import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import * as React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

type PageToken = number | 'ellipsis-left' | 'ellipsis-right';

// Janela compacta: primeira, última, vizinhas da atual, reticências no meio
function buildPageTokens(page: number, pageCount: number): PageToken[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const inner = [page - 1, page, page + 1].filter((p) => p >= 2 && p <= pageCount - 1);
  const tokens: PageToken[] = [1];
  if (inner[0] > 2) tokens.push('ellipsis-left');
  tokens.push(...inner);
  if (inner[inner.length - 1] < pageCount - 1) tokens.push('ellipsis-right');
  tokens.push(pageCount);
  return tokens;
}

const numberBase =
  'cursor-pointer inline-flex h-8 min-w-8 px-1.5 items-center justify-center text-xs font-bold rounded-lg border-2 select-none transition-[transform,box-shadow,background-color] duration-150 ease-out focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2';

export const Pagination: React.FC<PaginationProps> = ({ page, pageCount, onPageChange, className }) => {
  if (pageCount <= 1) return null;
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const tokens = buildPageTokens(currentPage, pageCount);

  return (
    <nav role="navigation" aria-label="Paginação do feed" className={cn('flex items-center justify-center gap-1.5', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Página anterior"
        title="Página anterior"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="h-8 w-8 rounded-lg"
      >
        <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
      </Button>

      <ul className="flex items-center gap-1.5">
        {tokens.map((token) => {
          if (token === 'ellipsis-left' || token === 'ellipsis-right') {
            return (
              <li key={token} aria-hidden className="flex h-8 items-center text-neutral-400">
                <MoreHorizontal className="w-4 h-4 stroke-[2.5]" />
              </li>
            );
          }
          const isCurrent = token === currentPage;
          return (
            <li key={token}>
              <button
                type="button"
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`Página ${token}`}
                disabled={isCurrent}
                onClick={() => onPageChange(token)}
                className={cn(
                  numberBase,
                  isCurrent
                    ? 'bg-neo-blue text-white border-ink shadow-[2px_2px_0px_0px_var(--neo-shadow)] cursor-default'
                    : 'bg-paper text-black border-ink shadow-[2px_2px_0px_0px_var(--neo-shadow)] hover:bg-neutral-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_var(--neo-shadow)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
                )}
              >
                {token}
              </button>
            </li>
          );
        })}
      </ul>

      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Próxima página"
        title="Próxima página"
        disabled={currentPage >= pageCount}
        onClick={() => onPageChange(currentPage + 1)}
        className="h-8 w-8 rounded-lg"
      >
        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
      </Button>
    </nav>
  );
};
