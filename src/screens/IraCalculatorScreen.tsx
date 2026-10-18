import React, { useState } from 'react';
import { ArrowLeft, Calculator, GraduationCap, Minus, Plus } from 'lucide-react';
import { useMyCourse } from '@/hooks/useMyCourse';
import { useContainer } from '@/context/ContainerContext';
import {
  PageContainer,
  PageHeader,
  Button,
  EmptyState,
} from '@/components/ui';
import { MyCourseSkeleton } from '@/components/flowchart/MyCourseSkeleton';
import {
  IraResultPanel,
  IraSemesterCard,
} from '@/components/ira';
import type {
  IraMention,
  IraScenario,
} from '@/core';
import {
  CalculateIraUseCase,
  MAX_DISCIPLINES_PER_SEMESTER,
  scenarioProfileSignature,
} from '@/core';

const IRA_CALCULATOR_INSTANCE = new CalculateIraUseCase();

function stripScenario(s: IraScenario) {
  return JSON.stringify({
    semesters: s.semesters,
    baseTrancadasObrigatorias: s.baseTrancadasObrigatorias,
    baseTrancadasOptativas: s.baseTrancadasOptativas,
    extraTrancadasObrigatorias: s.extraTrancadasObrigatorias,
    extraTrancadasOptativas: s.extraTrancadasOptativas,
  });
}

export interface IraCalculatorScreenProps {
  onBack: () => void;
}

export const IraCalculatorScreen: React.FC<IraCalculatorScreenProps> = ({ onBack }) => {
  const { profile, curriculum, isLoading } = useMyCourse();
  const { useCases } = useContainer();

  const [scenario, setScenario] = useState<IraScenario | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [hasSavedScenario, setHasSavedScenario] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  // Carrega o cenário salvo uma única vez; sem cenário salvo, monta o cenário
  // real do histórico. Espera o perfil carregar (useMyCourse com cache quente
  // resolve na hora, sem skeleton).
  React.useEffect(() => {
    if (bootstrapped || isLoading) return;
    let cancelled = false;
    (async () => {
      const saved = await useCases.manageIraScenario.get();
      if (cancelled) return;
      // Cenário salvo só vale se veio do mesmo conteúdo de histórico; perfil
      // novo (menções, trancadas, períodos) reconstrói o cenário real.
      if (saved && profile && saved.profileSignature === scenarioProfileSignature(profile)) {
        setScenario(saved);
        setHasSavedScenario(true);
      } else if (profile) {
        setScenario(useCases.buildIraScenario.execute(profile, curriculum));
      }
      setHydrated(true);
      setBootstrapped(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [bootstrapped, isLoading, profile, curriculum, useCases]);

  // Cenário real do perfil — referência para detectar edição e restaurar.
  const realScenario = React.useMemo(() => {
    if (!profile) return null;
    return useCases.buildIraScenario.execute(profile, curriculum);
  }, [profile, curriculum, useCases]);

  const isSimulation = React.useMemo(
    () =>
      Boolean(scenario && realScenario && stripScenario(scenario) !== stripScenario(realScenario)),
    [scenario, realScenario],
  );

  // Auto-save com debounce: só quando o cenário difere do histórico real.
  React.useEffect(() => {
    if (!hydrated || !scenario || !isSimulation) return;
    const t = setTimeout(() => {
      useCases.manageIraScenario.save(scenario);
      setHasSavedScenario(true);
    }, 600);
    return () => clearTimeout(t);
  }, [scenario, hydrated, isSimulation, useCases]);

  const calculation = React.useMemo(
    () => (scenario ? IRA_CALCULATOR_INSTANCE.execute(scenario) : null),
    [scenario],
  );

  // --- Handlers do cenário (atualizações imutáveis) ---

  const updateScenario = React.useCallback(
    (updater: (prev: IraScenario) => IraScenario) => {
      setScenario((prev) => (prev ? updater(prev) : prev));
    },
    [],
  );

  const handleMentionChange = React.useCallback(
    (disciplineId: string, mention: IraMention) => {
      updateScenario((prev) => ({
        ...prev,
        semesters: prev.semesters.map((sem) => ({
          ...sem,
          disciplines: sem.disciplines.map((d) =>
            d.id === disciplineId ? { ...d, mention } : d,
          ),
        })),
      }));
    },
    [updateScenario],
  );

  const handleRemoveDiscipline = React.useCallback(
    (disciplineId: string) => {
      updateScenario((prev) => ({
        ...prev,
        semesters: prev.semesters.map((sem) => ({
          ...sem,
          disciplines: sem.disciplines.filter((d) => d.id !== disciplineId),
        })),
      }));
    },
    [updateScenario],
  );

  const handleUpdateCredits = React.useCallback(
    (disciplineId: string, credits: number) => {
      updateScenario((prev) => ({
        ...prev,
        semesters: prev.semesters.map((sem) => ({
          ...sem,
          disciplines: sem.disciplines.map((d) =>
            d.id === disciplineId ? { ...d, credits } : d,
          ),
        })),
      }));
    },
    [updateScenario],
  );

  const handleAddDiscipline = React.useCallback(
    (semesterId: string) => {
      updateScenario((prev) => {
        const target = prev.semesters.find((sem) => sem.id === semesterId);
        if (!target || target.disciplines.length >= MAX_DISCIPLINES_PER_SEMESTER) return prev;
        return {
          ...prev,
          semesters: prev.semesters.map((sem) =>
            sem.id === semesterId
              ? {
                  ...sem,
                  disciplines: [
                    ...sem.disciplines,
                    {
                      id: `added:${Date.now()}`,
                      name: 'Disciplina',
                      credits: 4,
                      mention: null,
                      origin: 'added' as const,
                    },
                  ],
                }
              : sem,
          ),
        };
      });
    },
    [updateScenario],
  );

  const handleAddFutureSemester = React.useCallback(() => {
    updateScenario((prev) => {
      const futureCount = prev.semesters.filter((s) => s.kind === 'future').length;
      return {
        ...prev,
        semesters: [
          ...prev.semesters,
          {
            id: `future:${Date.now()}`,
            label: futureCount === 0 ? 'Próximo semestre' : `Semestre futuro ${futureCount + 1}`,
            kind: 'future' as const,
            disciplines: [],
          },
        ],
      };
    });
  }, [updateScenario]);

  const handleAdjustExtraTrancadas = React.useCallback(
    (kind: 'obrigatorias' | 'optativas', delta: number) => {
      updateScenario((prev) => ({
        ...prev,
        extraTrancadasObrigatorias: Math.max(
          -prev.baseTrancadasObrigatorias,
          prev.extraTrancadasObrigatorias + (kind === 'obrigatorias' ? delta : 0),
        ),
        extraTrancadasOptativas: Math.max(
          -prev.baseTrancadasOptativas,
          prev.extraTrancadasOptativas + (kind === 'optativas' ? delta : 0),
        ),
      }));
    },
    [updateScenario],
  );

  const handleRestore = React.useCallback(async () => {
    await useCases.manageIraScenario.clear();
    setScenario(useCases.buildIraScenario.execute(profile!, curriculum));
    setHasSavedScenario(false);
  }, [useCases, profile, curriculum]);

  // --- Render ---

  const backButton = (
    <Button variant="outline" size="sm" onClick={onBack}>
      <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
      Voltar para Meu Curso
    </Button>
  );

  if (isLoading && !profile) {
    return (
      <PageContainer>
        <MyCourseSkeleton />
      </PageContainer>
    );
  }

  if (!profile) {
    return (
      <PageContainer>
        <PageHeader title="Calculadora de IRA" icon={Calculator} actions={backButton} />
        <EmptyState
          icon={GraduationCap}
          title="Nenhum Perfil Acadêmico Carregado"
          description={
            <>
              Sincronize com o SIGAA na aba <strong>Configurações</strong> para
              carregar seu histórico e calcular seu IRA.
            </>
          }
          className="mb-6"
        />
      </PageContainer>
    );
  }

  if (!scenario || !calculation) {
    return (
      <PageContainer>
        <PageHeader title="Calculadora de IRA" icon={Calculator} actions={backButton} />
      </PageContainer>
    );
  }

  // Semestres futuros adicionáveis a partir daqui — o corpo principal
  return (
    <PageContainer>
      <PageHeader
        title="Calculadora de IRA"
        icon={Calculator}
        actions={backButton}
      />

      <IraResultPanel
        calculation={calculation}
        sigaaIra={profile.ira}
        isSimulation={isSimulation}
        canRestore={hasSavedScenario && isSimulation}
        onRestore={handleRestore}
      />

      {/* Trancamentos extras simulados */}
      <section className="bg-white border-2 border-black rounded-lg shadow-neo p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="sm:mr-auto">
            <p className="text-[11px] font-black uppercase tracking-wider text-neutral-600">
              Trancamentos
            </p>
            <p className="text-xs font-bold text-neutral-600 mt-0.5">
              Do histórico: <span className="text-black font-extrabold">{scenario.baseTrancadasObrigatorias} obrigatória(s) e {scenario.baseTrancadasOptativas} optativa(s)</span>.
              Ajuste livremente — desconte o que não deveria contar ou simule trancamentos futuros.
            </p>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-black">Obrigatórias: {calculation.trancadasObrigatorias}</span>
              <Button variant="outline" size="icon" className="w-8 h-8" aria-label="Adicionar trancamento obrigatório extra" onClick={() => handleAdjustExtraTrancadas('obrigatorias', 1)}>
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </Button>
              <Button variant="outline" size="icon" className="w-8 h-8" aria-label="Remover trancamento obrigatório extra" onClick={() => handleAdjustExtraTrancadas('obrigatorias', -1)} disabled={calculation.trancadasObrigatorias === 0}>
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </Button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-black">Optativas: {calculation.trancadasOptativas}</span>
              <Button variant="outline" size="icon" className="w-8 h-8" aria-label="Adicionar trancamento optativo extra" onClick={() => handleAdjustExtraTrancadas('optativas', 1)}>
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </Button>
              <Button variant="outline" size="icon" className="w-8 h-8" aria-label="Remover trancamento optativo extra" onClick={() => handleAdjustExtraTrancadas('optativas', -1)} disabled={calculation.trancadasOptativas === 0} >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Grade de semestres: 4 colunas no desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {scenario.semesters.map((sem) => (
          <IraSemesterCard
            key={sem.id}
            semester={sem}
            semesterIra={calculation.semesterIras[sem.id] ?? null}
            onMentionChange={handleMentionChange}
            onRemoveDiscipline={handleRemoveDiscipline}
            onUpdateCredits={handleUpdateCredits}
            onAddDiscipline={() => handleAddDiscipline(sem.id)}
          />
        ))}

        <button
          type="button"
          onClick={handleAddFutureSemester}
          className="min-h-[8rem] rounded-lg border-2 border-dashed border-black/15 bg-neutral-50 hover:bg-neutral-100 cursor-pointer text-[11px] font-black text-neutral-600 hover:text-black transition-colors inline-flex flex-col items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Adicionar semestre futuro
        </button>
      </div>
    </PageContainer>
  );
};
