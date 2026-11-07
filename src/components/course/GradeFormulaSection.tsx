import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Badge,
  Button,
  Input,
} from "@/components/ui";
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  Target,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
} from "lucide-react";
import {
  validateFormula,
  extractVariables,
  calculateApprovalRequirements,
  COMMON_UNB_FORMULA_PRESETS,
} from "@/core";
import type { Discipline, CalculationResult } from "@/core";

interface GradeFormulaSectionProps {
  discipline: Discipline;
}

export const GradeFormulaSection: React.FC<GradeFormulaSectionProps> = ({
  discipline,
}) => {
  const storagePrefix = `sarue:discipline_grades:${discipline.id}`;
  const formulaStorageKey = `${storagePrefix}:formula`;
  const valuesStorageKey = `${storagePrefix}:values`;
  const expandedStorageKey = `${storagePrefix}:expanded`;

  // Fórmula matemática
  const [formula, setFormula] = useState<string>(() => {
    return localStorage.getItem(formulaStorageKey) || "(P1 + P2) / 2";
  });

  // Notas informadas por variável: { P1: 7.5, P2: null }
  const [grades, setGrades] = useState<Record<string, number | null>>(() => {
    try {
      const saved = localStorage.getItem(valuesStorageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Estado de expansão da seção
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem(expandedStorageKey);
    // Expandido por padrão se não houver preferência anterior
    return saved !== null ? saved === "true" : true;
  });

  // Salva fórmula no localStorage
  useEffect(() => {
    localStorage.setItem(formulaStorageKey, formula);
  }, [formulaStorageKey, formula]);

  // Salva notas no localStorage
  useEffect(() => {
    localStorage.setItem(valuesStorageKey, JSON.stringify(grades));
  }, [valuesStorageKey, grades]);

  // Salva estado de expansão
  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      localStorage.setItem(expandedStorageKey, String(next));
      return next;
    });
  };

  // Validação e cálculo
  const validation = useMemo(() => validateFormula(formula), [formula]);
  const variables = useMemo(() => extractVariables(formula), [formula]);

  const calculation: CalculationResult | null = useMemo(() => {
    if (!validation.isValid) return null;
    return calculateApprovalRequirements(formula, grades);
  }, [formula, grades, validation.isValid]);

  const handleGradeChange = (variable: string, rawVal: string) => {
    const cleanStr = rawVal.replace(",", ".");
    if (cleanStr === "") {
      setGrades((prev) => ({ ...prev, [variable]: null }));
      return;
    }

    const num = parseFloat(cleanStr);
    if (!isNaN(num)) {
      // Limita de 0 a 10
      const clamped = Math.max(0, Math.min(10, num));
      setGrades((prev) => ({ ...prev, [variable]: clamped }));
    }
  };

  const handleResetGrades = () => {
    setGrades({});
  };

  const handleApplyPreset = (presetFormula: string) => {
    setFormula(presetFormula);
  };

  // Resumo para o cabeçalho (visível mesmo colapsado)
  const headerSummaryBadge = useMemo(() => {
    if (!validation.isValid) {
      return (
        <Badge variant="urgent" size="sm">
          Fórmula inválida
        </Badge>
      );
    }

    if (!calculation) return null;

    if (calculation.isFullyGraded && calculation.finalGrade !== null && calculation.finalMention) {
      return (
        <Badge
          variant={calculation.finalMention.passed ? "success" : "urgent"}
          size="sm"
          className="font-black"
        >
          Média: {calculation.finalGrade.toFixed(1)} ({calculation.finalMention.mention}) —{" "}
          {calculation.finalMention.passed ? "Aprovado" : "Reprovado"}
        </Badge>
      );
    }

    const mmReq = calculation.requirements.MM;
    if (mmReq.isAlreadyAchieved) {
      return (
        <Badge variant="success" size="sm" className="font-black">
          Aprovação (MM) garantida!
        </Badge>
      );
    }

    if (!mmReq.isAchievable) {
      return (
        <Badge variant="urgent" size="sm" className="font-black">
          MM inatingível (Máx: {calculation.maxPossibleGrade.toFixed(1)})
        </Badge>
      );
    }

    if (mmReq.requiredGrade !== null) {
      return (
        <Badge variant="yellow" size="sm" className="font-black">
          {calculation.pendingVariables.length === 1
            ? `Precisa de ${mmReq.requiredGrade.toFixed(1)} na ${calculation.pendingVariables[0]} (MM)`
            : `Média de ${mmReq.requiredGrade.toFixed(1)} restante (MM)`}
        </Badge>
      );
    }

    return null;
  }, [validation.isValid, calculation]);

  return (
    <Card className="p-4 bg-paper rounded-lg border-2 border-ink shadow-(--neo-card-shadow) space-y-4">
      {/* Topo / Cabeçalho da Seção com Botão de Expansão */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          onClick={toggleExpanded}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleExpanded();
            }
          }}
        >
          <div className="w-8 h-8 rounded-md bg-blue-ink/10 border border-blue-ink/30 flex items-center justify-center text-blue-ink shrink-0 group-hover:bg-blue-ink/20 transition-colors">
            <Calculator className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-black group-hover:text-blue-ink transition-colors">
                Fórmula de Notas & Estimativa de Aprovação
              </h3>
              {headerSummaryBadge}
            </div>
            <p className="text-xs text-neutral-600 font-medium">
              Calcule a menção final (UnB) e veja a nota restante necessária para aprovação (MM ≥ 5.0).
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleExpanded}
          className="cursor-pointer font-bold flex items-center gap-1.5"
          aria-label={isExpanded ? "Recolher seção de fórmulas" : "Expandir seção de fórmulas"}
        >
          <span>{isExpanded ? "Ocultar" : "Configurar"}</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
          )}
        </Button>
      </div>

      {/* Conteúdo Expandido */}
      {isExpanded && (
        <div className="pt-3 border-t-2 border-ink/10 space-y-4">
          {/* Seletor de Presets Rápidos */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 stroke-[2.5]" />
              <span>Modelos Frequentes da UnB:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_UNB_FORMULA_PRESETS.map((preset) => {
                const isSelected = formula.trim() === preset.formula.trim();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.formula)}
                    title={preset.description}
                    className={`text-xs px-2.5 py-1 rounded-md font-bold border transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-black text-white border-black"
                        : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-ink/20"
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campo da Fórmula Matemática */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="discipline-formula-input" className="font-black text-black">
                Fórmula de Avaliação:
              </label>
              {validation.isValid ? (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  Fórmula válida ({variables.length}{" "}
                  {variables.length === 1 ? "avaliação" : "avaliações"})
                </span>
              ) : (
                <span className="text-[11px] font-bold text-ink-urgent flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                  {validation.error || "Fórmula inválida"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Input
                id="discipline-formula-input"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="Ex.: (P1 + P2 + P3) / 3 ou 0.4*P1 + 0.6*P2"
                className="font-mono text-sm font-bold bg-white"
              />
              {Object.keys(grades).length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetGrades}
                  title="Limpar notas preenchidas"
                  className="cursor-pointer shrink-0 font-bold flex items-center gap-1 text-neutral-600 hover:text-ink-urgent"
                >
                  <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Limpar</span>
                </Button>
              )}
            </div>

            <p className="text-[11px] text-neutral-500 font-medium flex items-center gap-1">
              <Info className="w-3 h-3 stroke-[2] shrink-0" />
              Use letras para os nomes das provas/trabalhos (ex: P1, P2, T). Operadores permitidos: +, -, *, /, ( ).
            </p>
          </div>

          {/* Grade de Lançamento de Notas das Variáveis Detectadas */}
          {variables.length > 0 && validation.isValid && (
            <div className="space-y-2">
              <span className="text-xs font-black text-black block">
                Notas Obtidas (deixe em branco se a avaliação for futura/pendente):
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {variables.map((variable) => {
                  const val = grades[variable];
                  const hasValue = val !== undefined && val !== null;

                  return (
                    <div
                      key={variable}
                      className={`p-2.5 rounded-lg border-2 transition-all ${
                        hasValue
                          ? "bg-pastel-blue/40 border-blue-ink/40"
                          : "bg-white border-ink/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="font-black text-xs text-black">
                          {variable}
                        </span>
                        {hasValue && (
                          <button
                            type="button"
                            onClick={() =>
                              setGrades((prev) => ({ ...prev, [variable]: null }))
                            }
                            className="text-[10px] text-neutral-400 hover:text-ink-urgent font-bold cursor-pointer"
                            title="Limpar nota"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        placeholder="Pendente"
                        value={hasValue ? val : ""}
                        onChange={(e) => handleGradeChange(variable, e.target.value)}
                        className="w-full px-2 py-1 text-sm font-bold text-black border border-ink/30 rounded-md focus:outline-hidden focus:border-blue-ink bg-white font-mono"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Painel de Resultados & Estimativas para Aprovação */}
          {calculation && validation.isValid && (
            <div className="space-y-3 pt-2">
              {/* Caso 1: Todas as notas já foram preenchidas */}
              {calculation.isFullyGraded && calculation.finalGrade !== null && calculation.finalMention && (
                <div
                  className={`p-4 rounded-lg border-2 ${
                    calculation.finalMention.passed
                      ? "bg-pastel-green border-emerald-600/50"
                      : "bg-pastel-red border-red-600/50"
                  } flex flex-wrap items-center justify-between gap-3`}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-neutral-700 block">
                      Nota Final Calculada
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-black text-black font-mono">
                        {calculation.finalGrade.toFixed(2)}
                      </span>
                      <span
                        className={`text-xs font-black px-2.5 py-0.5 rounded-md ${calculation.finalMention.colorClass}`}
                      >
                        {calculation.finalMention.mention} — {calculation.finalMention.label}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-black ${
                        calculation.finalMention.passed
                          ? "text-emerald-800 dark:text-emerald-300"
                          : "text-red-800 dark:text-red-300"
                      }`}
                    >
                      {calculation.finalMention.passed
                        ? "✓ Aprovado na Disciplina"
                        : "✗ Reprovado por Nota (Abaixo de 5.0 - MM)"}
                    </span>
                    <p className="text-[11px] text-neutral-600 font-medium">
                      Critério regimental da UnB: aprovação com menção MM, MS ou SS.
                    </p>
                  </div>
                </div>
              )}

              {/* Caso 2: Avaliações ainda pendentes -> Estimativa de Nota Restante */}
              {!calculation.isFullyGraded && (
                <div className="space-y-2.5">
                  {/* Card Principal: Meta de Aprovação (MM - 5.0) */}
                  {calculation.requirements.MM.isAlreadyAchieved ? (
                    <div className="p-3.5 rounded-lg border-2 bg-pastel-green border-emerald-600/50 flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 stroke-[2.5] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-black text-emerald-950">
                          Aprovação Garantida (Menção MM)!
                        </h4>
                        <p className="text-xs font-medium text-emerald-900 mt-0.5">
                          Parabéns! Mesmo se você tirar zero em todas as avaliações restantes (
                          {calculation.pendingVariables.join(", ")}), sua nota acumulada já é suficiente para ser aprovado na UnB.
                        </p>
                      </div>
                    </div>
                  ) : calculation.requirements.MM.isAchievable ? (
                    <div className="p-3.5 rounded-lg border-2 bg-pastel-yellow border-amber-600/50 flex items-start gap-2.5">
                      <Target className="w-5 h-5 text-amber-700 stroke-[2.5] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-black text-amber-950">
                            Nota Restante para Aprovação (MM ≥ 5.0):
                          </h4>
                          <span className="text-base font-black font-mono px-2 py-0.5 bg-black text-white rounded-md">
                            {calculation.requirements.MM.requiredGrade?.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-amber-900">
                          {calculation.pendingVariables.length === 1 ? (
                            <>
                              Você precisa tirar no mínimo{" "}
                              <strong className="underline">
                                {calculation.requirements.MM.requiredGrade?.toFixed(2)}
                              </strong>{" "}
                              na avaliação <strong>{calculation.pendingVariables[0]}</strong> para fechar com menção MM (Aprovado).
                            </>
                          ) : (
                            <>
                              Você precisa de uma média de no mínimo{" "}
                              <strong className="underline">
                                {calculation.requirements.MM.requiredGrade?.toFixed(2)}
                              </strong>{" "}
                              nas avaliações pendentes (
                              {calculation.pendingVariables.join(", ")}) para ser aprovado.
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-lg border-2 bg-pastel-red border-red-600/50 flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-red-700 stroke-[2.5] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-black text-red-950">
                          Atenção: Aprovação em Risco
                        </h4>
                        <p className="text-xs font-medium text-red-900 mt-0.5">
                          Mesmo tirando nota máxima 10.0 em todas as avaliações restantes, a nota final atingível é{" "}
                          <strong>{calculation.maxPossibleGrade.toFixed(2)}</strong> (abaixo do mínimo de 5.0 para MM). Verifique com o docente sobre provas de reposição ou trabalhos extras.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Metas Superiores: MS (7.0) e SS (9.0) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Meta MS */}
                    <div className="p-2.5 rounded-lg border border-ink/20 bg-white flex items-center justify-between">
                      <span className="font-bold text-neutral-700">Meta MS (Médio Superior ≥ 7.0):</span>
                      <span className="font-mono font-black text-black">
                        {calculation.requirements.MS.isAlreadyAchieved
                          ? "✓ Garantido!"
                          : calculation.requirements.MS.isAchievable &&
                            calculation.requirements.MS.requiredGrade !== null
                          ? `Falta ${calculation.requirements.MS.requiredGrade.toFixed(2)}`
                          : "Inatingível"}
                      </span>
                    </div>

                    {/* Meta SS */}
                    <div className="p-2.5 rounded-lg border border-ink/20 bg-white flex items-center justify-between">
                      <span className="font-bold text-neutral-700">Meta SS (Superior ≥ 9.0):</span>
                      <span className="font-mono font-black text-black">
                        {calculation.requirements.SS.isAlreadyAchieved
                          ? "✓ Garantido!"
                          : calculation.requirements.SS.isAchievable &&
                            calculation.requirements.SS.requiredGrade !== null
                          ? `Falta ${calculation.requirements.SS.requiredGrade.toFixed(2)}`
                          : "Inatingível"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
