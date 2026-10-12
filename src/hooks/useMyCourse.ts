import { useState, useEffect, useCallback, useMemo } from 'react';
import { useContainer } from '../context/ContainerContext';
import { useCredentials } from './useCredentials';
import { toast } from '@/components/ui';
import type {
  StudentAcademicProfile,
  FlowchartData,
  CurriculumStructure,
} from '@/core';

// Notificador global entre instâncias ativas do hook useMyCourse
const myCourseListeners = new Set<() => void>();

export function notifyMyCourseListeners() {
  myCourseListeners.forEach((fn) => fn());
}

export function useMyCourse() {
  const { useCases } = useContainer();
  const { allCredentials } = useCredentials();

  const [profile, setProfile] = useState<StudentAcademicProfile | null>(null);
  const [allCurricula, setAllCurricula] = useState<CurriculumStructure[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState<CurriculumStructure | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  // Carrega currículos e perfil
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [curricula, currentProfile] = await Promise.all([
        useCases.manageAcademicProfile.getAllCurricula(),
        useCases.manageAcademicProfile.getProfile(),
      ]);

      setAllCurricula(curricula);

      if (currentProfile && curricula.length > 0) {
        // Auto-cura: se alguma disciplina salva no perfil tem nome igual ao código ou vazio,
        // recupera o nome real a partir do catálogo de matrizes carregadas
        let healed = false;
        const catalogNameMap = new Map<string, string>();
        for (const c of curricula) {
          for (const d of [
            ...(c.mandatoryDisciplines || []),
            ...(c.electiveDisciplines || []),
            ...(c.complementaryDisciplines || []),
          ]) {
            if (d.code && d.name && !catalogNameMap.has(d.code)) {
              catalogNameMap.set(d.code, d.name);
            }
          }
        }

        for (const cd of currentProfile.completedDisciplines) {
          if (!cd.name || cd.name === cd.code) {
            const realName = catalogNameMap.get(cd.code);
            if (realName) {
              cd.name = realName;
              healed = true;
            }
          }
        }

        // Se ainda houver alguma disciplina sem nome oficial, tenta recuperar do classes.json
        const stillMissing = currentProfile.completedDisciplines.some((cd) => !cd.name || cd.name === cd.code);
        if (stillMissing && typeof fetch !== 'undefined') {
          try {
            const res = await fetch('/data/classes.json');
            if (res.ok) {
              const classesData = (await res.json()) as Array<{ code: string; name: string }>;
              const classMap = new Map<string, string>();
              for (const cl of classesData) {
                if (cl.code && cl.name && !classMap.has(cl.code)) {
                  classMap.set(cl.code, cl.name);
                }
              }
              for (const cd of currentProfile.completedDisciplines) {
                if (!cd.name || cd.name === cd.code) {
                  const realName = classMap.get(cd.code);
                  if (realName) {
                    cd.name = realName;
                    healed = true;
                  }
                }
              }
            }
          } catch {}
        }

        if (healed) {
          await useCases.manageAcademicProfile.saveProfile(currentProfile);
        }

        setProfile(currentProfile);

        // Encontra a matriz correspondente
        let matched: CurriculumStructure | undefined;

        if (currentProfile.curriculumCode) {
          matched = curricula.find((c) => c.code === currentProfile.curriculumCode);
        }

        // Dentro do mesmo prefixo, a versão cuja CH total bate com o histórico oficial do
        // SIGAA ganha da versão gravada por engano no perfil (ex.: 1741/3 vs 1741/1)
        if (matched && currentProfile.chTotalCurriculo) {
          const prefix = currentProfile.curriculumCode!.split('/')[0];
          const byHours = curricula.find(
            (c) => c.code.startsWith(`${prefix}/`) && c.totalHours === currentProfile.chTotalCurriculo,
          );
          if (byHours && matched.totalHours !== currentProfile.chTotalCurriculo) {
            matched = byHours;
          }
        }

        if (!matched && currentProfile.curriculumCode) {
          const prefix = currentProfile.curriculumCode.split('/')[0];
          if (currentProfile.chTotalCurriculo) {
            matched = curricula.find((c) => c.code.startsWith(prefix) && c.totalHours === currentProfile.chTotalCurriculo);
          }
          if (!matched) {
            matched =
              curricula.find((c) => c.code.startsWith(`${prefix}/`) && c.status === 'Ativa') ||
              curricula.find((c) => c.code.startsWith(prefix));
          }
        }

        if (!matched && currentProfile.courseName) {
          const normCourse = currentProfile.courseName.toUpperCase().trim();
          if (currentProfile.chTotalCurriculo) {
            matched = curricula.find((c) => c.courseName.toUpperCase().includes(normCourse) && c.totalHours === currentProfile.chTotalCurriculo);
          }
          if (!matched) {
            matched =
              curricula.find((c) => c.courseName.toUpperCase().includes(normCourse) && c.status === 'Ativa') ||
              curricula.find((c) => c.courseName.toUpperCase().includes(normCourse));
          }
        }

        setSelectedCurriculum(matched || curricula[0]);
      } else {
        setProfile(currentProfile);
        if (curricula.length > 0) {
          setSelectedCurriculum(curricula[0]);
        }
      }
    } catch (e) {
      console.error('[useMyCourse] Erro ao carregar dados:', e);
      toast.add({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar a matriz curricular.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [useCases]);

  useEffect(() => {
    loadData();

    const listener = () => {
      loadData();
    };
    myCourseListeners.add(listener);

    return () => {
      myCourseListeners.delete(listener);
    };
  }, [loadData]);

  // Calcula o fluxograma quando houver perfil e matriz
  const flowchartData: FlowchartData | null = useMemo(() => {
    if (!selectedCurriculum || !profile) return null;
    return useCases.getFlowchart.execute(selectedCurriculum, profile, allCurricula);
  }, [selectedCurriculum, profile, allCurricula, useCases]);

  // Mapa código → nome de disciplina: todas as matrizes carregadas
  // + matriz selecionada + histórico cursado, garantindo nomes reais para qualquer código
  const disciplineNames: Map<string, string> = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of allCurricula) {
      for (const d of [
        ...(c.mandatoryDisciplines || []),
        ...(c.electiveDisciplines || []),
        ...(c.complementaryDisciplines || []),
      ]) {
        if (!map.has(d.code)) map.set(d.code, d.name);
      }
    }
    if (selectedCurriculum) {
      for (const d of [
        ...(selectedCurriculum.mandatoryDisciplines || []),
        ...(selectedCurriculum.electiveDisciplines || []),
        ...(selectedCurriculum.complementaryDisciplines || []),
      ]) {
        map.set(d.code, d.name);
      }
    }
    for (const d of profile?.completedDisciplines || []) {
      if (d.name && d.name !== d.code) map.set(d.code, d.name);
    }
    return map;
  }, [allCurricula, selectedCurriculum, profile]);

  // Alterna uma disciplina manualmente
  const toggleDiscipline = useCallback(async (code: string) => {
    try {
      const updated = await useCases.manageAcademicProfile.toggleDiscipline(code);
      setProfile(updated);
      notifyMyCourseListeners();
      toast.add({
        title: 'Disciplina atualizada',
        description: `Status de ${code} atualizado no seu fluxograma.`,
        type: 'info',
        timeout: 2500,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao alternar disciplina';
      toast.add({
        title: 'Erro',
        description: msg,
        type: 'error',
      });
    }
  }, [useCases]);

  // Redefine overrides manuais
  const resetOverrides = useCallback(async () => {
    try {
      const updated = await useCases.manageAcademicProfile.resetManualOverrides();
      setProfile(updated);
      notifyMyCourseListeners();
      toast.add({
        title: 'Marcações redefinidas',
        description: 'Todas as marcações manuais foram desfeitas.',
        type: 'success',
      });
    } catch {
      toast.add({
        title: 'Erro ao redefinir',
        description: 'Não foi possível redefinir as marcações.',
        type: 'error',
      });
    }
  }, [useCases]);

  // Sincroniza com o SIGAA usando as credenciais salvas
  const syncSigaa = useCallback(async () => {
    const creds = allCredentials.sigaa;
    if (!creds || !creds.matricula || !creds.senha) {
      toast.add({
        title: 'Credenciais do SIGAA não configuradas',
        description: 'Configure sua matrícula e senha nas Configurações para sincronizar.',
        type: 'warning',
      });
      return;
    }

    setIsSyncing(true);
    try {
      const res = await useCases.manageAcademicProfile.syncWithSigaa(creds);
      setProfile(res.profile);
      if (res.matchedCurriculum) {
        setSelectedCurriculum(res.matchedCurriculum);
      }
      notifyMyCourseListeners();
      toast.add({
        title: 'Histórico sincronizado com sucesso!',
        description: `${res.profile.courseName} (${res.profile.completedDisciplines.length} disciplinas identificadas).`,
        type: 'success',
        timeout: 5000,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha na conexão com o SIGAA';
      toast.add({
        title: 'Falha ao sincronizar histórico',
        description: msg,
        type: 'error',
        timeout: 6000,
      });
    } finally {
      setIsSyncing(false);
    }
  }, [allCredentials.sigaa, useCases]);

  // Troca manualmente a matriz curricular ativa
  const selectCurriculum = useCallback(async (curr: CurriculumStructure) => {
    try {
      const updated = await useCases.manageAcademicProfile.setCurriculum(curr);
      setProfile(updated);
      setSelectedCurriculum(curr);
      notifyMyCourseListeners();
      toast.add({
        title: 'Matriz Curricular alterada',
        description: `${curr.courseName} (${curr.code})`,
        type: 'info',
      });
    } catch {
      toast.add({
        title: 'Erro ao alterar matriz',
        description: 'Não foi possível selecionar esta matriz.',
        type: 'error',
      });
    }
  }, [useCases]);

  // Relações ativas de hover (para destacar pré-requisitos e pós-requisitos)
  const hoverRelations = useMemo(() => {
    if (!hoveredCode || !flowchartData) {
      return { prereqs: new Set<string>(), postreqs: new Set<string>() };
    }

    const allDiscs: typeof flowchartData.semesters[0]['disciplines'] = [];
    for (const sem of flowchartData.semesters) {
      allDiscs.push(...sem.disciplines);
    }

    const current = allDiscs.find((d) => d.code === hoveredCode);
    const prereqs = new Set(current?.prerequisites || []);
    const postreqs = new Set(current?.unlockedDisciplines || []);

    return { prereqs, postreqs };
  }, [hoveredCode, flowchartData]);

  return {
    profile,
    curriculum: selectedCurriculum,
    allCurricula,
    flowchartData,
    disciplineNames,
    isLoading,
    isSyncing,
    hoveredCode,
    setHoveredCode,
    hoverRelations,
    toggleDiscipline,
    resetOverrides,
    syncSigaa,
    selectCurriculum,
    reload: loadData,
  };
}
