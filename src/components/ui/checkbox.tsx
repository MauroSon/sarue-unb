import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Check } from "lucide-react"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Checkbox do design system (receita neobrutalism adaptada): 20px, raio 6px,
 * borda de tinta 2px e SEM sombra — ghost que afunda 1px só no active.
 * A cor do check é semântica do consumidor via data-checked: seleção veste
 * Azul Caneta Ação (`data-checked:bg-neo-blue data-checked:text-white`),
 * conclusão veste Verde Giz (`data-checked:bg-neo-green data-checked:text-ink`).
 */
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 border-ink bg-paper outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2 data-disabled:cursor-not-allowed data-disabled:opacity-50 transition-[transform,background-color] duration-150 ease-out active:translate-y-[1px]",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <Check className="w-3.5 h-3.5 stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
