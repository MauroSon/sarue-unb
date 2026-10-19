import React from "react";
import { ArrowLeft, ScrollText } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  PageContainer,
  PageHeader,
} from "@/components/ui";
import { PATCH_NOTES, type PatchNotesEntry } from "@/content/patchNotes";
import { cn } from "@/lib/utils";

export interface PatchNotesViewProps {
  onBack: () => void;
  /** Versão atualmente instalada, sem o prefixo "v" (ex.: "0.1.0"). */
  currentVersion: string;
}

/** Selo de versão: adesivo pill com borda preta e sombra dura de ação. */
const versionPillClass =
  "inline-flex items-center rounded-full border-2 border-black bg-white px-3 py-0.5 text-xs font-extrabold text-black shadow-[2px_2px_0px_0px_#000]";

const PatchNotesEntryCard: React.FC<{
  entry: PatchNotesEntry;
  isCurrent: boolean;
}> = ({ entry, isCurrent }) => (
  <Card variant={isCurrent ? "yellow" : "default"} className="p-5">
    <div className="flex flex-wrap items-center gap-2">
      <span className={versionPillClass}>v{entry.version}</span>
      {isCurrent && (
        <Badge variant="success" size="sm">
          Atual
        </Badge>
      )}
      <span className="ml-auto text-[11px] font-bold text-neutral-600">
        {entry.date}
      </span>
    </div>

    <h3 className="mt-2.5 text-sm font-black uppercase tracking-tight text-black">
      {entry.title}
    </h3>

    <ul className="mt-2 space-y-1.5">
      {entry.items.map((item, index) => (
        <li key={index} className="flex items-start gap-2">
          <span
            aria-hidden="true"
            className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-[2px] bg-black"
          />
          <span className="text-xs font-medium leading-relaxed text-neutral-700">
            {item}
          </span>
        </li>
      ))}
    </ul>
  </Card>
);

export const PatchNotesView: React.FC<PatchNotesViewProps> = ({
  onBack,
  currentVersion,
}) => {
  return (
    <PageContainer>
      <PageHeader
        icon={ScrollText}
        title="Novidades e Patch Notes"
        actions={
          <Button type="button" variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Voltar</span>
          </Button>
        }
      />

      <div className={cn("w-full max-w-2xl space-y-4")}>
        {PATCH_NOTES.map((entry) => (
          <PatchNotesEntryCard
            key={entry.version}
            entry={entry}
            isCurrent={entry.version === currentVersion}
          />
        ))}
      </div>
    </PageContainer>
  );
};
