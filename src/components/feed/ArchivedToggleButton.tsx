import React from 'react';
import { Button } from '@/components/ui';
import { Archive, Inbox } from 'lucide-react';

export interface ArchivedToggleButtonProps {
  showArchived: boolean;
  onToggle: () => void;
}

/** Alterna entre o feed ativo e os itens arquivados. */
export const ArchivedToggleButton: React.FC<ArchivedToggleButtonProps> = ({ showArchived, onToggle }) => (
  <Button
    type="button"
    variant={showArchived ? 'default' : 'outline'}
    size="sm"
    onClick={onToggle}
    aria-pressed={showArchived}
    title={showArchived ? 'Voltar ao feed ativo' : 'Ver itens que você arquivou'}
    className={`cursor-pointer flex items-center gap-1.5 text-xs font-bold h-[34px] ${
      showArchived
        ? 'bg-neutral-800 text-paper hover:bg-black dark:hover:bg-neutral-700'
        : 'bg-paper text-neutral-700 hover:text-black'
    }`}
  >
    {showArchived ? (
      <>
        <Inbox className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Ver Feed Ativo</span>
      </>
    ) : (
      <>
        <Archive className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Arquivados</span>
      </>
    )}
  </Button>
);
