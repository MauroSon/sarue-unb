import React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui";
import { Heart } from "lucide-react";
import { openExternalUrl } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

export interface ContributorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ContributorsDialog: React.FC<ContributorsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { resolvedTheme } = useTheme();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-lg bg-neo-yellow border-2 border-ink flex items-center justify-center shadow-neo-sm">
              <Heart className="w-5 h-5 stroke-[2.5] text-ink" />
            </div>
            <DialogTitle>Contribuidores</DialogTitle>
          </div>
          <DialogDescription>Quem faz o Saruê acontecer.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          {/* Fundador em primeiro, com o grifo amarelo; no escuro, placa
              com fita lateral Ouro vivo (mesma receita do Alert) */}
          <div className="flex items-center justify-between gap-3 bg-pastel-yellow border-2 border-ink rounded-lg p-3.5 shadow-neo-sm dark:bg-paper dark:border-l-[6px] dark:border-l-neo-yellow">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-neutral-700 block">
                Contribuidor de código
              </span>
              <p className="text-sm font-black text-black mt-0.5">
                Kaleb Henrique
              </p>
              <p className="text-xs font-bold text-neutral-700 mt-0.5">
                Idealizador e desenvolvedor fullstack
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                title="https://github.com/kalebhenrique"
                aria-label="GitHub de Kaleb Henrique"
                onClick={() =>
                  void openExternalUrl("https://github.com/kalebhenrique")
                }
                className="w-8 p-0"
              >
                <img
                  src={
                    resolvedTheme === "dark"
                      ? "/github-142-svgrepo-com-dark.svg"
                      : "/github-142-svgrepo-com.svg"
                  }
                  alt=""
                  className="w-4 h-4 select-none"
                />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                title="https://www.linkedin.com/in/kalebhenrique/"
                aria-label="LinkedIn de Kaleb Henrique"
                onClick={() =>
                  void openExternalUrl(
                    "https://www.linkedin.com/in/kalebhenrique/",
                  )
                }
                className="w-8 p-0"
              >
                <img
                  src={
                    resolvedTheme === "dark"
                      ? "/linkedin-svgrepo-com-dark.svg"
                      : "/linkedin-svgrepo-com.svg"
                  }
                  alt=""
                  className="w-4 h-4 select-none"
                />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 bg-paper border-2 border-ink rounded-lg p-3.5 shadow-neo-sm">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-neutral-700 block">
                Contribuidor de código
              </span>
              <p className="text-sm font-black text-black mt-0.5">
                Mauro Ribeiro
              </p>
              <p className="text-xs font-bold text-neutral-700 mt-0.5">
                Desenvolvedor fullstack
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                title="https://github.com/MauroSon"
                aria-label="GitHub de Mauro"
                onClick={() =>
                  void openExternalUrl("https://github.com/MauroSon")
                }
                className="w-8 p-0"
              >
                <img
                  src={
                    resolvedTheme === "dark"
                      ? "/github-142-svgrepo-com-dark.svg"
                      : "/github-142-svgrepo-com.svg"
                  }
                  alt=""
                  className="w-4 h-4 select-none"
                />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                title="https://www.linkedin.com/in/maurorsilva/"
                aria-label="LinkedIn de Mauro"
                onClick={() =>
                  void openExternalUrl(
                    "https://www.linkedin.com/in/maurorsilva/",
                  )
                }
                className="w-8 p-0"
              >
                <img
                  src={
                    resolvedTheme === "dark"
                      ? "/linkedin-svgrepo-com-dark.svg"
                      : "/linkedin-svgrepo-com.svg"
                  }
                  alt=""
                  className="w-4 h-4 select-none"
                />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 bg-paper border-2 border-ink rounded-lg p-3.5 shadow-neo-sm">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-neutral-700 block">
                Contribuidor
              </span>
              <p className="text-sm font-black text-black mt-0.5">Ricardo</p>
              <p className="text-xs font-bold text-neutral-700 mt-0.5">
                Administrador do grupo UnB Geral
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => onOpenChange(false)}
          >
            <span>Fechar</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
