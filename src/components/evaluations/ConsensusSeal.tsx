import React from 'react';
import { Badge, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui';
import { Medal } from 'lucide-react';

export const ConsensusSeal: React.FC<{ count: number }> = ({ count }) => {
  const hint = `A comunidade converge: a partir de ${count} relatos com nível de dificuldade parecido.`;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge
            variant="yellow"
            size="sm"
            aria-label={hint}
            tabIndex={0}
            className="cursor-help focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2"
          >
            <Medal
              className="w-3 h-3 stroke-[2.5] text-amber-700 shrink-0"
              aria-hidden="true"
            />
            <span>Consenso</span>
          </Badge>
        }
      />
      <TooltipContent className="max-w-xs">{hint}</TooltipContent>
    </Tooltip>
  );
};
