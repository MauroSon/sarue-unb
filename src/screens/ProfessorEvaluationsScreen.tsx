import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useProfessorEvaluations } from "../hooks/useProfessorEvaluations";
import { useContainer } from "../context/ContainerContext";
import { subscribeToSyncComplete } from "../context/SyncContext";
import { resolveCourseIdForProfile } from "../hooks/useMyCourse";
import {
  Card,
  Badge,
  PageContainer,
  PageHeader,
  Button,
  Pagination,
  EmptyState,
  Skeleton,
  FilterSelect,
  SegmentedControl,
  Alert,
  Switch,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui";
import {
  Star,
  Search,
  ExternalLink,
  RefreshCw,
  BookOpen,
  MapPin,
  Building2,
  ThumbsUp,
  MessageSquareQuote,
  ArrowLeft,
  Users,
  CheckCircle2,
  HelpCircle,
  XCircle,
  ClipboardCheck,
  GraduationCap,
  Medal,
  ChevronDown,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn, openExternalUrl } from "../lib/utils";
import {
  CONSENSUS_SEAL_MIN_EVALUATIONS,
  normalizeDepartmentDisplay,
  normalizeText,
  professorKeyOf,
  PROFESSOR_EVALUATIONS_SHEET_URL,
  type CampusName,
  type RecommendationType,
  type DifficultyLevel,
  type ProfessorEvaluationSortBy,
  type ProfessorEvaluation,
  type ProfessorSummary,
  type DisciplineSummary,
  type CurriculumStructure,
} from "@/core";

type EvaluationViewMode = "professors" | "disciplines";

let cachedEvaluationViewMode: EvaluationViewMode = "professors";

// Preferência do usuário: filtrar (ou não) as avaliações pelo próprio curso.
const FILTER_BY_COURSE_STORAGE_KEY = "unb_evaluations_filter_by_course";

const PAGE_SIZE = 20;

function getDidaticaBadgeStyle(score: number | null): string {
  if (score === null) {
    return "bg-neutral-100 text-neutral-700 border-black";
  }
  if (score >= 8) {
    return "bg-neo-green text-black border-black";
  }
  if (score >= 6) {
    return "bg-neo-yellow text-black border-black";
  }
  return "bg-neo-danger text-white border-black";
}

/** Cor do card de didática inteiro, por faixa de nota. */
function getDidaticaCardStyle(score: number | null): string {
  if (score === null) {
    return "bg-neutral-100 text-neutral-700";
  }
  if (score >= 8) {
    return "bg-neo-green text-black";
  }
  if (score >= 6) {
    return "bg-neo-yellow text-black";
  }
  return "bg-neo-danger text-white";
}

function getRecommendationBadge(rec: RecommendationType) {
  if (rec === "sim") {
    return (
      <Badge variant="success" size="sm">
        Recomenda
      </Badge>
    );
  }
  if (rec === "depende") {
    return (
      <Badge variant="yellow" size="sm" title="Recomendaria, mas com ressalvas">
        Depende
      </Badge>
    );
  }
  if (rec === "nao") {
    return (
      <Badge variant="urgent" size="sm">
        Não recomenda
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      size="sm"
      title="O relato não respondeu se recomendaria"
    >
      Sem resposta
    </Badge>
  );
}

// Opções dos Filtro Selects: o rótulo exibido do valor selecionado vem de
// `options` (resolvido pelo próprio FilterSelect).
const DIFFICULTY_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Todas as dificuldades" },
  { value: "muito_facil", label: "Muito fácil" },
  { value: "facil", label: "Fácil" },
  { value: "medio", label: "Médio" },
  { value: "dificil", label: "Difícil" },
  { value: "muito_dificil", label: "Muito difícil" },
  { value: "nivel_god", label: "Nível God" },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "recommendation_desc", label: "Mais recomendados" },
  { value: "rating_desc", label: "Maior didática (10 → 0)" },
  { value: "rating_asc", label: "Menor didática (0 → 10)" },
  { value: "reviews_desc", label: "Mais avaliados" },
];

const CAMPUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Todos os campi" },
  { value: "Darcy Ribeiro", label: "Darcy Ribeiro" },
  { value: "Ceilândia", label: "Ceilândia" },
  { value: "Gama", label: "Gama" },
  { value: "Planaltina", label: "Planaltina" },
];

/** Selo exige muitas avaliações E consenso confirmado entre os relatos. */
function hasConsensusSeal(summary: {
  hasConsistentLevels?: boolean;
  evaluationsCount: number;
}): boolean {
  return (
    Boolean(summary.hasConsistentLevels) &&
    summary.evaluationsCount >= CONSENSUS_SEAL_MIN_EVALUATIONS
  );
}

const ConsensusSeal: React.FC<{ count: number }> = ({ count }) => {
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
            <Medal className="w-3 h-3 stroke-[2.5] shrink-0" />
            Consenso da comunidade
          </Badge>
        }
      />
      <TooltipContent className="max-w-72 leading-relaxed text-left">
        {hint}
      </TooltipContent>
    </Tooltip>
  );
};

const ReviewCard: React.FC<{
  evaluation: ProfessorEvaluation;
  /** Drill-down habilita "Mais detalhes" com os campos de curiosidade pós-decisão. */
  detailed?: boolean;
}> = ({ evaluation, detailed = false }) => {
  const [showDetails, setShowDetails] = useState(false);

  const scoreDisplay =
    evaluation.didaticaScore !== null
      ? evaluation.didaticaScore.toLocaleString("pt-BR", {
          maximumFractionDigits: 1,
        })
      : "N/A";

  const detailFields = [
    { label: "Monitoria", value: evaluation.hasMonitor },
    { label: "Importa-se", value: evaluation.caresAboutStudents },
    { label: "Aprendizado", value: evaluation.learnedContent },
    { label: "Resultado", value: evaluation.outcome },
  ].filter((d) => d.value);

  const showModality =
    evaluation.modality && normalizeText(evaluation.modality) !== "PRESENCIAL";

  // Parâmetros em linha, com rótulos onde o valor não é autoexplicativo.
  const parameters = [
    evaluation.difficulty
      ? { label: "Dificuldade:", value: evaluation.difficulty }
      : null,
    evaluation.workload
      ? { label: "Carga:", value: evaluation.workload }
      : null,
    evaluation.material ? { label: "", value: evaluation.material } : null,
    evaluation.attendance ? { label: "", value: evaluation.attendance } : null,
  ].filter((p): p is { label: string; value: string } => p !== null);

  return (
    <Card className="bg-white rounded-lg p-6 shadow-neo space-y-4">
      {/* Cabeçalho: Recomendação, SIGAA e Campus */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {getRecommendationBadge(evaluation.recommendation)}
            <Badge variant="outline" size="sm">
              {evaluation.campus}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-neutral-600">
            <span className="inline-flex items-center gap-1.5 text-base font-black text-black">
              <BookOpen className="w-3.5 h-3.5 stroke-[2.5] text-neutral-500 shrink-0" />
              <span>{evaluation.discipline}</span>
            </span>
            {evaluation.department && (
              <>
                <span className="text-neutral-500">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 stroke-[2.5] text-neutral-500 shrink-0" />
                  <span>
                    {normalizeDepartmentDisplay(evaluation.department)}
                  </span>
                </span>
              </>
            )}
            {evaluation.semester && evaluation.semester !== "-" && (
              <>
                <span className="text-neutral-500">·</span>
                <span>{evaluation.semester}</span>
              </>
            )}
            {showModality && (
              <>
                <span className="text-neutral-500">·</span>
                <span>{evaluation.modality}</span>
              </>
            )}
          </div>
        </div>

        {/* Bloco Adesivo de Nota da Didática: cor única por faixa */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border-2 border-black shadow-neo-xs shrink-0 ${getDidaticaCardStyle(
            evaluation.didaticaScore,
          )}`}
        >
          <span className="text-[11px] font-black uppercase tracking-wider opacity-80">
            Didática
          </span>
          <span className="inline-flex items-center gap-1 text-base font-black">
            <Star className="w-3.5 h-3.5 stroke-[2.5] fill-current shrink-0" />
            {scoreDisplay}
            {evaluation.didaticaScore !== null && (
              <span className="text-[11px] font-bold opacity-80">/10</span>
            )}
          </span>
        </div>
      </div>

      {/* Feedback sincero em destaque */}
      {evaluation.feedback ? (
        <div className="bg-cream border-2 border-black rounded-lg p-3.5 shadow-neo-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-neutral-600 mb-1">
            <MessageSquareQuote className="w-3.5 h-3.5 stroke-[2.5] text-neo-blue shrink-0" />
            <span>Feedback Sincero</span>
          </div>
          <p className="text-sm font-medium text-black whitespace-pre-line leading-relaxed">
            {evaluation.feedback}
          </p>
        </div>
      ) : null}

      {/* Parâmetros da disciplina em linha, separados para leitura clara */}
      {parameters.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-black">
          {parameters.map((p, i) => (
            <React.Fragment key={`${p.label}-${p.value}-${i}`}>
              {i > 0 && <span className="text-neutral-500">·</span>}
              <span>
                {p.label && (
                  <span className="text-neutral-600">{p.label} </span>
                )}
                {p.value}
              </span>
            </React.Fragment>
          ))}
        </p>
      )}

      {/* Rodapé: método de avaliação + data; curiosidades ficam atrás de disclosure */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t-2 border-black/10 text-xs font-semibold text-neutral-600">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {evaluation.evaluationMethods && (
            <span className="inline-flex items-center gap-1">
              <ClipboardCheck className="w-3.5 h-3.5 stroke-[2.5] text-neutral-500" />
              <strong className="font-bold text-black">Avaliação:</strong>{" "}
              {evaluation.evaluationMethods}
            </span>
          )}
          {evaluation.timestamp && (
            <span className="text-[11px] font-bold text-neutral-600">
              {evaluation.timestamp.split(" ")[0]}
            </span>
          )}
          {detailed && detailFields.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              aria-expanded={showDetails}
              className="ml-auto cursor-pointer inline-flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-black focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue rounded-xs"
            >
              {showDetails ? "Menos detalhes" : "Mais detalhes"}
              <ChevronDown
                className={`w-3.5 h-3.5 stroke-[2.5] transition-transform duration-150 ease-out ${
                  showDetails ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {detailed && showDetails && detailFields.length > 0 && (
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2.5 text-xs">
          {detailFields.map((d) => (
            <div key={d.label} className="space-y-0.5">
              <dt className="text-[11px] font-black uppercase tracking-wider text-neutral-600">
                {d.label}
              </dt>
              <dd className="font-bold text-black">{d.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
};
interface DrillDownSummary {
  publicUrl?: string;
  campuses: CampusName[];
  departments: string[];
  evaluationsCount: number;
  hasConsistentLevels?: boolean;
  averageDidatica: number | null;
  recommendationRate: number;
  recommendYesCount: number;
  recommendDependeCount: number;
  recommendNoCount: number;
  evaluations: ProfessorEvaluation[];
}

/**
 * Drill-down compartilhado por professor e disciplina: resumo + lista paginada
 * de relatos. Assume relatos ordenados do mais recente (garantido pelo use-case).
 */
const EvaluationDrillDown: React.FC<{
  icon: LucideIcon;
  title: string;
  relatedLabel: string;
  relatedItems: string[];
  summary: DrillDownSummary;
  onBack: () => void;
}> = ({ icon, title, relatedLabel, relatedItems, summary, onBack }) => {
  const reviews = summary.evaluations;
  const pageCount = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE));
  const [page, setPage] = useState(1);
  const safePage = Math.min(page, pageCount);
  const pageItems = reviews.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const avgDisplay =
    summary.averageDidatica !== null
      ? summary.averageDidatica.toLocaleString("pt-BR", {
          maximumFractionDigits: 1,
        })
      : "N/A";

  return (
    <PageContainer>
      <PageHeader
        icon={icon}
        title={title}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            className="cursor-pointer flex items-center gap-1.5 font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Voltar</span>
          </Button>
        }
      />

      {/* Resumo do Professor */}
      <Card className="bg-white rounded-lg p-6 shadow-neo space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {summary.campuses.map((c) => (
            <Badge key={c} variant="outline" size="sm">
              <MapPin className="w-3 h-3 stroke-[2.5] mr-1" />
              {c}
            </Badge>
          ))}
          {summary.departments.slice(0, 3).map((dept) => (
            <Badge
              key={dept}
              variant="neutral"
              size="sm"
              className="bg-pastel-blue"
            >
              {normalizeDepartmentDisplay(dept)}
            </Badge>
          ))}
          {hasConsensusSeal(summary) && (
            <ConsensusSeal count={summary.evaluationsCount} />
          )}
          {summary.publicUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openExternalUrl(summary.publicUrl!)}
              className="h-6 px-2.5 text-[11px]"
            >
              <span>Página SIGAA</span>
              <ExternalLink className="w-3 h-3 stroke-[2.5]" />
            </Button>
          )}
        </div>

        {/* Indicadores centralizados: faixa única, colunas com divisores */}
        <div className="grid grid-cols-3 divide-x-2 divide-black/10">
          <div className="px-2 text-center">
            <span className="block text-[11px] font-black uppercase tracking-wider text-neutral-600">
              Didática Média
            </span>
            <span className="flex items-center justify-center gap-1 text-2xl font-black text-black">
              <Star className="w-4 h-4 stroke-[2.5] fill-current shrink-0" />
              {avgDisplay}
              {summary.averageDidatica !== null && (
                <span className="text-sm font-bold text-neutral-600">/10</span>
              )}
            </span>
            <span className="block text-[11px] font-bold text-neutral-600">
              em todas as disciplinas
            </span>
          </div>

          <div className="px-2 text-center">
            <span className="block text-[11px] font-black uppercase tracking-wider text-neutral-600">
              Recomendação
            </span>
            <span className="flex items-center justify-center gap-1 text-2xl font-black text-black">
              <ThumbsUp className="w-4 h-4 stroke-[2.5] text-ink-success shrink-0" />
              {summary.recommendationRate}%
            </span>
            <span className="block text-[11px] font-bold text-neutral-600">
              em todas as disciplinas
            </span>
          </div>

          <div className="px-2 text-center">
            <span className="block text-[11px] font-black uppercase tracking-wider text-neutral-600">
              Relatos
            </span>
            <span className="flex items-center justify-center text-2xl font-black text-black">
              {summary.evaluationsCount}
            </span>
            <span className="block text-[11px] font-bold text-neutral-600">
              no total
            </span>
          </div>
        </div>

        {/* Disciplinas avaliadas */}
        <div className="pt-3 border-t border-black/10">
          <p className="text-xs font-black uppercase tracking-wider text-neutral-600 mb-1.5">
            {relatedLabel} ({relatedItems.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {relatedItems.map((item) => (
              <span
                key={item}
                className="text-xs font-bold bg-neutral-100 px-2.5 py-1 border-2 border-black rounded-lg"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-3 border-t-2 border-black/10 text-xs font-bold">
          <span className="inline-flex items-center gap-1.5 text-ink-success">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            {summary.recommendYesCount}{" "}
            {summary.recommendYesCount === 1 ? "recomenda" : "recomendam"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-neutral-700">
            <HelpCircle className="w-4 h-4 stroke-[2.5]" />
            {summary.recommendDependeCount}{" "}
            {summary.recommendDependeCount === 1
              ? 'responde "depende"'
              : 'respondem "depende"'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-ink-error">
            <XCircle className="w-4 h-4 stroke-[2.5]" />
            {summary.recommendNoCount}{" "}
            {summary.recommendNoCount === 1
              ? "não recomenda"
              : "não recomendam"}
          </span>
        </div>
      </Card>

      {/* Lista de Relatos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-600 px-1">
          <span>
            Avaliações registradas ({reviews.length}{" "}
            {reviews.length === 1 ? "relato" : "relatos"})
          </span>
          <span>Ordenado das mais recentes</span>
        </div>

        {pageItems.map((ev) => (
          <ReviewCard key={ev.id} evaluation={ev} detailed />
        ))}

        <Pagination
          page={safePage}
          pageCount={pageCount}
          onPageChange={setPage}
        />
      </div>
    </PageContainer>
  );
};

/** Card clicável do catálogo (@DESIGN.md "Card clicável"): sombra token
 * shadow-neo, física de afundar na escala 4px e semântica de botão. */
const ClickableCard: React.FC<{
  onClick: () => void;
  "aria-label": string;
  className?: string;
  children: React.ReactNode;
}> = ({ onClick, "aria-label": ariaLabel, className, children }) => (
  <Card
    onClick={onClick}
    role="button"
    tabIndex={0}
    aria-label={ariaLabel}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    }}
    className={cn(
      "cursor-pointer bg-white rounded-lg shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2 transition-[transform,box-shadow,background-color,border-color] duration-150 ease-out group",
      className,
    )}
  >
    {children}
  </Card>
);

interface CatalogSummaryCardProps {
  title: string;
  campuses: CampusName[];
  hasConsensus: boolean;
  averageDidatica: number | null;
  evaluationsCount: number;
  recommendationRate: number;
  departments: string[];
  secondaryIcon: LucideIcon;
  secondaryItems: string[];
  onClick: () => void;
}

/** Card base reutilizável para exibição de resumos no catálogo (docentes ou disciplinas). */
const CatalogSummaryCard: React.FC<CatalogSummaryCardProps> = ({
  title,
  campuses,
  hasConsensus,
  averageDidatica,
  evaluationsCount,
  recommendationRate,
  departments,
  secondaryIcon: SecondaryIcon,
  secondaryItems,
  onClick,
}) => {
  const avgStr =
    averageDidatica !== null
      ? averageDidatica.toLocaleString("pt-BR", {
          maximumFractionDigits: 1,
        })
      : "N/A";

  return (
    <ClickableCard
      onClick={onClick}
      aria-label={`Ver ${evaluationsCount} avaliações de ${title}`}
      className="p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {campuses.map((c) => (
              <Badge key={c} variant="outline" size="sm">
                {c}
              </Badge>
            ))}
            {hasConsensus && <ConsensusSeal count={evaluationsCount} />}
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border-2 text-xs font-black shrink-0 ${getDidaticaBadgeStyle(
              averageDidatica,
            )}`}
          >
            <Star className="w-3.5 h-3.5 stroke-[2.5] fill-current shrink-0" />
            {avgStr}
          </span>
        </div>

        <h3 className="text-sm md:text-base font-black text-black leading-snug mb-2 group-hover:text-neo-blue transition-colors">
          {title}
        </h3>

        <div className="space-y-1.5 text-xs font-medium text-neutral-700">
          <div className="flex items-center gap-2">
            <SecondaryIcon className="w-3.5 h-3.5 text-neutral-500 stroke-[2.5] shrink-0" />
            <span className="truncate">
              {secondaryItems.slice(0, 2).join(", ")}
              {secondaryItems.length > 2
                ? ` (+${secondaryItems.length - 2})`
                : ""}
            </span>
          </div>

          {departments.length > 0 && (
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-neutral-500 stroke-[2.5] shrink-0" />
              <span className="truncate">
                {departments.slice(0, 2).join(" • ")}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-4 border-t-2 border-black/10 mt-4 text-xs font-bold">
        <span className="inline-flex items-center gap-1.5 text-neutral-700">
          <ThumbsUp className="w-3.5 h-3.5 stroke-[2.5] text-ink-success" />
          {recommendationRate}% recomendam
          <span className="text-neutral-500">·</span>
          {evaluationsCount} {evaluationsCount === 1 ? "relato" : "relatos"}
        </span>
        <span className="text-neutral-800 text-[11px] underline decoration-2 group-hover:text-neo-blue font-extrabold">
          Ver relatos →
        </span>
      </div>
    </ClickableCard>
  );
};

const ProfessorCatalogCard: React.FC<{
  prof: ProfessorSummary;
  onClick: () => void;
}> = ({ prof, onClick }) => (
  <CatalogSummaryCard
    title={prof.professorName}
    campuses={prof.campuses}
    hasConsensus={hasConsensusSeal(prof)}
    averageDidatica={prof.averageDidatica}
    evaluationsCount={prof.evaluationsCount}
    recommendationRate={prof.recommendationRate}
    departments={prof.departments}
    secondaryIcon={BookOpen}
    secondaryItems={prof.disciplines}
    onClick={onClick}
  />
);

const DisciplineCatalogCard: React.FC<{
  disc: DisciplineSummary;
  onClick: () => void;
}> = ({ disc, onClick }) => (
  <CatalogSummaryCard
    title={disc.disciplineName}
    campuses={disc.campuses}
    hasConsensus={hasConsensusSeal(disc)}
    averageDidatica={disc.averageDidatica}
    evaluationsCount={disc.evaluationsCount}
    recommendationRate={disc.recommendationRate}
    departments={disc.departments}
    secondaryIcon={Users}
    secondaryItems={disc.professors}
    onClick={onClick}
  />
);

/** Card compacto de professor dentro do drill-down de disciplina. */
const DisciplineProfessorCard: React.FC<{
  prof: ProfessorSummary;
  onOpen: (prof: ProfessorSummary) => void;
}> = ({ prof, onOpen }) => {
  const avgStr =
    prof.averageDidatica !== null
      ? prof.averageDidatica.toLocaleString("pt-BR", {
          maximumFractionDigits: 1,
        })
      : "N/A";

  return (
    <ClickableCard
      onClick={() => onOpen(prof)}
      aria-label={`Ver ${prof.evaluationsCount} relatos de ${prof.professorName}`}
      className="p-4 flex items-center justify-between gap-3"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          {hasConsensusSeal(prof) && (
            <ConsensusSeal count={prof.evaluationsCount} />
          )}
        </div>
        <h3 className="text-sm md:text-base font-black text-black leading-snug truncate group-hover:text-neo-blue transition-colors">
          {prof.professorName}
        </h3>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700 mt-1">
          <ThumbsUp className="w-3.5 h-3.5 stroke-[2.5] text-ink-success" />
          {prof.recommendationRate}% recomendam
          <span className="text-neutral-500">·</span>
          {prof.evaluationsCount}{" "}
          {prof.evaluationsCount === 1 ? "relato" : "relatos"}
        </span>
      </div>
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border-2 text-xs font-black shrink-0 ${getDidaticaBadgeStyle(
          prof.averageDidatica,
        )}`}
      >
        <Star className="w-3.5 h-3.5 stroke-[2.5] fill-current shrink-0" />
        {avgStr}
      </span>
    </ClickableCard>
  );
};

/**
 * Drill-down de disciplina: card-resumo com médias ENTRE professores (há poucos
 * relatos por disciplina — professor é o agregado confiável) e a grade de cards
 * de professores, que abrem os relatos de cada um.
 */
const DisciplineDrillDown: React.FC<{
  summary: DisciplineSummary;
  professorSummaries: ProfessorSummary[];
  onBack: () => void;
  onOpenProfessor: (prof: ProfessorSummary) => void;
}> = ({ summary, professorSummaries, onBack, onOpenProfessor }) => {
  const didaticas = professorSummaries
    .map((p) => p.averageDidatica)
    .filter((v): v is number => v !== null);
  const mediaDidatica: number | null =
    didaticas.length > 0
      ? Math.round(
          (didaticas.reduce((a, v) => a + v, 0) / didaticas.length) * 10,
        ) / 10
      : summary.averageDidatica;
  const mediaRecomendacao =
    professorSummaries.length > 0
      ? Math.round(
          professorSummaries.reduce((a, p) => a + p.recommendationRate, 0) /
            professorSummaries.length,
        )
      : summary.recommendationRate;

  const mediaStr =
    mediaDidatica !== null
      ? mediaDidatica.toLocaleString("pt-BR", { maximumFractionDigits: 1 })
      : "N/A";

  return (
    <PageContainer>
      <PageHeader
        icon={BookOpen}
        title={summary.disciplineName}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            className="cursor-pointer flex items-center gap-1.5 font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Voltar</span>
          </Button>
        }
      />

      {/* Resumo da disciplina */}
      <Card className="bg-white rounded-lg p-6 shadow-neo space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {summary.campuses.map((c) => (
            <Badge key={c} variant="outline" size="sm">
              <MapPin className="w-3 h-3 stroke-[2.5] mr-1" />
              {c}
            </Badge>
          ))}
          {summary.departments.slice(0, 3).map((dept) => (
            <Badge
              key={dept}
              variant="neutral"
              size="sm"
              className="bg-pastel-blue"
            >
              {normalizeDepartmentDisplay(dept)}
            </Badge>
          ))}
          {hasConsensusSeal(summary) && (
            <ConsensusSeal count={summary.evaluationsCount} />
          )}
        </div>

        {/* Painel de indicadores: faixa única, colunas com divisores finos */}
        <div className="grid grid-cols-3 divide-x-2 divide-black/10">
          <div className="px-2 text-center">
            <span className="block text-[11px] font-black uppercase tracking-wider text-neutral-600">
              Didática Média
            </span>
            <span className="flex items-center justify-center gap-1 text-2xl font-black text-black">
              <Star className="w-4 h-4 stroke-[2.5] fill-current shrink-0" />
              {mediaStr}
              {mediaDidatica !== null && (
                <span className="text-sm font-bold text-neutral-600">/10</span>
              )}
            </span>
            <span className="block text-[11px] font-bold text-neutral-600">
              entre {professorSummaries.length} professores
            </span>
          </div>

          <div className="px-2 text-center">
            <span className="block text-[11px] font-black uppercase tracking-wider text-neutral-600">
              Recomendação
            </span>
            <span className="flex items-center justify-center gap-1 text-2xl font-black text-black">
              <ThumbsUp className="w-4 h-4 stroke-[2.5] text-ink-success shrink-0" />
              {mediaRecomendacao}%
            </span>
            <span className="block text-[11px] font-bold text-neutral-600">
              entre professores
            </span>
          </div>

          <div className="px-2 text-center">
            <span className="block text-[11px] font-black uppercase tracking-wider text-neutral-600">
              Relatos
            </span>
            <span className="text-2xl font-black text-black">
              {summary.evaluationsCount}
            </span>
            <span className="block text-[11px] font-bold text-neutral-600">
              no total
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-3 border-t-2 border-black/10 text-xs font-bold">
          <span className="inline-flex items-center gap-1.5 text-ink-success">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            {summary.recommendYesCount}{" "}
            {summary.recommendYesCount === 1 ? "recomenda" : "recomendam"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-neutral-700">
            <HelpCircle className="w-4 h-4 stroke-[2.5]" />
            {summary.recommendDependeCount}{" "}
            {summary.recommendDependeCount === 1
              ? 'responde "depende"'
              : 'respondem "depende"'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-ink-error">
            <XCircle className="w-4 h-4 stroke-[2.5]" />
            {summary.recommendNoCount}{" "}
            {summary.recommendNoCount === 1
              ? "não recomenda"
              : "não recomendam"}
          </span>
        </div>
      </Card>

      {/* Professores da disciplina */}
      <div className="space-y-3">
        <p className="text-xs font-black uppercase tracking-wider text-neutral-600 px-1">
          Professores desta disciplina ({professorSummaries.length})
        </p>
        {professorSummaries.length === 0 ? (
          <p className="text-xs font-bold text-neutral-600 px-1">
            Não foi possível relacionar professores a esta disciplina.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {professorSummaries.map((prof) => (
              <DisciplineProfessorCard
                key={prof.professorKey}
                prof={prof}
                onOpen={onOpenProfessor}
              />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export const ProfessorEvaluationsScreen: React.FC = () => {
  const {
    summaries,
    disciplineSummaries,
    unfilteredSummaries,
    unfilteredDisciplineSummaries,
    isLoading,
    hasLoadedOnce,
    searchQuery,
    setSearchQuery,
    selectedCampus,
    setSelectedCampus,
    selectedDifficulty,
    setSelectedDifficulty,
    sortBy,
    setSortBy,
    hasActiveFilters,
    clearFilters,
    error,
    retry,
  } = useProfessorEvaluations();
  const { useCases, repos } = useContainer();

  // Valor inicial vem do localStorage; o setter grava a escolha para as
  // próximas visitas. Sem preferência salva (ou storage bloqueado), liga.
  const [filterByCourse, setFilterByCourseState] = useState<boolean>(() => {
    try {
      return (
        window.localStorage.getItem(FILTER_BY_COURSE_STORAGE_KEY) !== "false"
      );
    } catch {
      return true;
    }
  });
  const setFilterByCourse = useCallback((checked: boolean) => {
    setFilterByCourseState(checked);
    try {
      window.localStorage.setItem(
        FILTER_BY_COURSE_STORAGE_KEY,
        String(checked),
      );
    } catch {}
  }, []);
  const [hasCourseProfile, setHasCourseProfile] = useState(false);
  const [courseCodes, setCourseCodes] = useState<Set<string>>(new Set());

  const loadCourseScope = useCallback(async () => {
    try {
      const profile = await useCases.manageAcademicProfile.getProfile();
      if (!profile) {
        setHasCourseProfile(false);
        setCourseCodes(new Set());
        return;
      }
      setHasCourseProfile(true);

      const courseId = await resolveCourseIdForProfile(
        profile,
        repos.gradeRepo,
      );
      if (!courseId) {
        setCourseCodes(new Set());
        return;
      }
      const curricula =
        await useCases.manageAcademicProfile.getCurriculaForCourse(courseId);
      if (!curricula.length) {
        setCourseCodes(new Set());
        return;
      }

      // Matriz atual do usuário + a mais recente do curso.
      const sorted = [...curricula].sort((a, b) =>
        (b.createdYear ?? "").localeCompare(a.createdYear ?? ""),
      );
      const picked = new Map<string, CurriculumStructure>();
      const userCurriculum = curricula.find(
        (c) =>
          c.code === profile.curriculumCode || c.id === profile.curriculumId,
      );
      if (userCurriculum) picked.set(userCurriculum.id, userCurriculum);
      if (sorted[0]) picked.set(sorted[0].id, sorted[0]);
      if (picked.size === 0) {
        for (const c of curricula) picked.set(c.id, c);
      }

      const codes = new Set<string>();
      for (const c of picked.values()) {
        for (const d of [
          ...c.mandatoryDisciplines,
          ...c.electiveDisciplines,
          ...c.complementaryDisciplines,
        ]) {
          if (d.code) codes.add(d.code.toUpperCase());
        }
      }
      // Disciplinas adicionadas pelo usuário no Gerenciar currículo.
      const custom = profile.customCurriculum;
      if (custom) {
        for (const d of [
          ...custom.mandatoryDisciplines,
          ...custom.electiveDisciplines,
          ...custom.complementaryDisciplines,
        ]) {
          if (d.code) codes.add(d.code.toUpperCase());
        }
      }
      setCourseCodes(codes);
    } catch (e) {
      console.warn(
        "[Avaliações] Não foi possível carregar as matrizes do curso:",
        e,
      );
    }
  }, [useCases, repos]);

  useEffect(() => {
    void loadCourseScope();
    // Reexecuta quando uma sincronização termina: o perfil pode ter acabado
    // de ser criado (primeiro login) ou mudado de curso.
    const unsubscribe = subscribeToSyncComplete(() => {
      void loadCourseScope();
    });
    return unsubscribe;
  }, [loadCourseScope]);

  const [viewMode, setViewMode] = useState<EvaluationViewMode>(
    cachedEvaluationViewMode,
  );
  const [selectedProfessor, setSelectedProfessor] =
    useState<ProfessorSummary | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] =
    useState<DisciplineSummary | null>(null);

  // Professores da disciplina em drill-down, com o histórico completo de cada
  // um (as notas do card agregam todas as disciplinas do docente). Base SEM
  // filtro: a busca da listagem não pode encolher o elenco do drill-down.
  const disciplineProfessors = useMemo(() => {
    if (!selectedDiscipline) return [] as ProfessorSummary[];
    const byKey = new Map<string, ProfessorSummary>();
    for (const s of unfilteredSummaries) byKey.set(s.professorKey, s);
    const seen = new Map<string, ProfessorSummary>();
    for (const ev of selectedDiscipline.evaluations) {
      const key = professorKeyOf(ev.professor);
      if (key && !seen.has(key)) {
        const prof = byKey.get(key);
        if (prof) seen.set(key, prof);
      }
    }
    return [...seen.values()].sort(
      (a, b) =>
        b.recommendationRate - a.recommendationRate ||
        b.evaluationsCount - a.evaluationsCount,
    );
  }, [selectedDiscipline, unfilteredSummaries]);

  const switchViewMode = (mode: EvaluationViewMode) => {
    cachedEvaluationViewMode = mode;
    setViewMode(mode);
  };

  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCampus, selectedDifficulty, sortBy, viewMode]);

  if (isLoading && !hasLoadedOnce) {
    return (
      <PageContainer>
        <PageHeader icon={Star} title="Avaliação de Professores" />
        <div role="status" aria-busy="true">
          <span className="sr-only">
            Carregando avaliações de professores...
          </span>
          <Card className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </Card>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 space-y-4">
              <div className="flex justify-between">
                <div className="space-y-2 w-2/3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
                <Skeleton className="h-12 w-20" />
              </div>
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  // Estado de erro na primeira carga: nunca vender falha como "filtros sem resultado"
  if (error && !hasLoadedOnce) {
    return (
      <PageContainer>
        <PageHeader icon={Star} title="Avaliação de Professores" />
        <EmptyState
          title="Não conseguimos carregar os relatos"
          description="Ocorreu um problema ao buscar as avaliações da comunidade. Verifique sua conexão e tente de novo."
          action={
            <Button type="button" variant="primary" size="sm" onClick={retry}>
              <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
              Tentar novamente
            </Button>
          }
        />
      </PageContainer>
    );
  }

  // Drill-down: Visualizando todas as avaliações de um professor específico
  if (selectedProfessor) {
    return (
      <EvaluationDrillDown
        icon={GraduationCap}
        title={selectedProfessor.professorName}
        relatedLabel="Disciplinas Avaliadas"
        relatedItems={selectedProfessor.disciplines}
        summary={selectedProfessor}
        onBack={() => setSelectedProfessor(null)}
      />
    );
  }

  // Drill-down: disciplina como hub de professores — cada card abre o histórico
  // completo (relatos) do docente.
  if (selectedDiscipline) {
    return (
      <DisciplineDrillDown
        summary={selectedDiscipline}
        professorSummaries={disciplineProfessors}
        onBack={() => setSelectedDiscipline(null)}
        onOpenProfessor={(prof) => {
          setSelectedDiscipline(null);
          setSelectedProfessor(prof);
        }}
      />
    );
  }
  const disciplineCodeOf = (name: string): string | null =>
    name.match(/[A-Z]{3}\d{4}/)?.[0]?.toUpperCase() ?? null;

  const courseFilterActive =
    filterByCourse && hasCourseProfile && courseCodes.size > 0;

  const visibleSummaries = courseFilterActive
    ? summaries.filter((s) =>
        s.disciplines.some((d) => {
          const code = disciplineCodeOf(d);
          return code ? courseCodes.has(code) : false;
        }),
      )
    : summaries;

  const visibleDisciplines = courseFilterActive
    ? disciplineSummaries.filter((s) => {
        if (
          s.disciplineCode &&
          courseCodes.has(s.disciplineCode.toUpperCase())
        ) {
          return true;
        }
        const code = disciplineCodeOf(s.disciplineName);
        return code ? courseCodes.has(code) : false;
      })
    : disciplineSummaries;

  const totalListCount =
    viewMode === "professors"
      ? visibleSummaries.length
      : visibleDisciplines.length;
  const pageCount = Math.max(1, Math.ceil(totalListCount / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  const pageSummaries = visibleSummaries.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const pageDisciplines = visibleDisciplines.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return (
    <PageContainer>
      <PageHeader
        icon={Star}
        title={
          <>
            Avaliação de Professores{" "}
            {unfilteredSummaries.length > 0 && (
              <span className="text-sm font-bold text-neutral-600">
                ({unfilteredSummaries.length}{" "}
                {unfilteredSummaries.length === 1 ? "docente" : "docentes"})
              </span>
            )}
          </>
        }
      />

      {/* Aviso permanente: origem e responsabilidade do conteúdo — no topo,
          logo abaixo do título, com a sombra de card padrão do Alert */}
      <Alert
        variant="yellow"
        title="Sobre os relatos"
        description="Estes relatos vêm de uma fonte externa: uma planilha pública mantida pela própria comunidade de estudantes, sem moderação prévia. Cada opinião reflete a visão de quem escreveu — pode vir enviesada, desatualizada ou até conter ofensas. Use as avaliações como apoio na sua decisão, e não como verdade absoluta."
        aside={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openExternalUrl(PROFESSOR_EVALUATIONS_SHEET_URL)}
            title="Abrir planilha colaborativa no Google Sheets"
          >
            <span>Ver Planilha</span>
            <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
          </Button>
        }
      />

      {/* Barra de Busca e Filtros */}
      <div className="bg-white border-2 border-black rounded-lg p-4 shadow-neo space-y-4">
        {/* Linha 1: Campo de Busca + Segmented Control (Professores | Disciplinas) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 stroke-[2.5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por professor, disciplina (ex: CIC0004, Cálculo), departamento..."
              aria-label="Buscar avaliações de professores"
              className={`w-full pl-10 py-2.5 text-sm font-medium text-black border-2 border-black rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neo-blue transition-[transform,box-shadow,background-color,border-color] placeholder:text-neutral-400 shadow-none ${
                searchQuery.trim() ? "bg-pastel-blue pr-10" : "bg-white pr-4"
              }`}
            />
            {searchQuery.trim() !== "" && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Limpar busca"
                      className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-neutral-500 hover:text-black hover:bg-black/5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue transition-colors duration-150"
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  }
                />
                <TooltipContent>Limpar busca</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Segmented Control (Professores | Disciplinas) */}
          <SegmentedControl
            className="shrink-0 self-end sm:self-auto"
            size="md"
            ariaLabel="Modo de visualização das avaliações"
            value={viewMode}
            onValueChange={switchViewMode}
            options={[
              {
                value: "professors",
                label: (
                  <>
                    <Users className="w-3.5 h-3.5 stroke-[2.5]" />
                    Professores
                  </>
                ),
              },
              {
                value: "disciplines",
                label: (
                  <>
                    <BookOpen className="w-3.5 h-3.5 stroke-[2.5]" />
                    Disciplinas
                  </>
                ),
              },
            ]}
          />
        </div>

        {/* Linha 2: Filtros com rótulo em cima (Filtro Select) + link de serviço */}
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          <FilterSelect
            label="Campus:"
            value={selectedCampus}
            options={CAMPUS_FILTER_OPTIONS}
            active={selectedCampus !== "all"}
            onChange={(val) => setSelectedCampus(val as CampusName | "all")}
          />

          <FilterSelect
            label="Dificuldade:"
            value={selectedDifficulty}
            options={DIFFICULTY_FILTER_OPTIONS}
            active={selectedDifficulty !== "all"}
            onChange={(val) =>
              setSelectedDifficulty(val as DifficultyLevel | "all")
            }
          />

          {/* Ordenação não é filtro: sem estado engajado */}
          <FilterSelect
            label="Ordenar por:"
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={(val) => setSortBy(val as ProfessorEvaluationSortBy)}
          />

          {/* A Regra do Link de Serviço: ação terciária de barra é texto sublinhado */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="cursor-pointer rounded-xs pb-2 text-xs font-bold text-neutral-500 hover:text-black underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2"
            >
              Limpar filtros
            </button>
          )}

          {hasCourseProfile && (
            <div className="inline-flex items-center gap-2 ml-auto pb-1.5">
              <span className="text-xs font-bold text-neutral-600">
                Filtrar pelo meu curso:
              </span>
              <Switch
                checked={filterByCourse}
                onCheckedChange={(checked) =>
                  setFilterByCourse(checked === true)
                }
              />
            </div>
          )}
        </div>

        {/* Contagem filtrada: barra interna do card — nunca linha solta acima */}
        {hasActiveFilters && (
          <div className="border-t-2 border-black/10 pt-2 text-xs font-bold text-neutral-600">
            {viewMode === "professors"
              ? `${visibleSummaries.length} de ${unfilteredSummaries.length} ${
                  unfilteredSummaries.length === 1 ? "docente" : "docentes"
                }`
              : `${visibleDisciplines.length} de ${
                  unfilteredDisciplineSummaries.length
                } ${
                  unfilteredDisciplineSummaries.length === 1
                    ? "disciplina"
                    : "disciplinas"
                }`}
          </div>
        )}
      </div>

      {/* Conteúdo Principal */}
      {totalListCount === 0 ? (
        <EmptyState
          title="Nenhuma avaliação encontrada"
          description="Não encontramos relatos para os filtros selecionados. Tente buscar por outro termo ou limpe os filtros."
        />
      ) : viewMode === "professors" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pageSummaries.map((prof) => (
              <ProfessorCatalogCard
                key={prof.professorKey}
                prof={prof}
                onClick={() => setSelectedProfessor(prof)}
              />
            ))}
          </div>

          <Pagination
            page={safePage}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pageDisciplines.map((disc) => (
              <DisciplineCatalogCard
                key={disc.disciplineKey}
                disc={disc}
                onClick={() => setSelectedDiscipline(disc)}
              />
            ))}
          </div>

          <Pagination
            page={safePage}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </div>
      )}
    </PageContainer>
  );
};
