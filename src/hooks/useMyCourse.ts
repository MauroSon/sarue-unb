import { useState, useEffect, useCallback, useMemo } from 'react';
import { useContainer } from '../context/ContainerContext';
import { useCredentials } from './useCredentials';
import { toast } from '@/components/ui';
import { normalizeCourseText } from '@/core';
import type {
  StudentAcademicProfile,
  FlowchartData,
  CurriculumStructure,
  IGradeRepository,
} from '@/core';

// Notificador global entre instâncias ativas do hook useMyCourse
const myCourseListeners = new Set<() => void>();

export function notifyMyCourseListeners() {
  myCourseListeners.forEach((fn) => fn());
}

// Resolve o course_id do curso do perfil no catálogo de cursos (courses.json, ~47 KB).
// Com ele, o app baixa só as matrizes do curso em vez do catálogo inteiro da UnB.
export async function resolveCourseIdForProfile(
  profile: StudentAcademicProfile,
  gradeRepo: IGradeRepository,
): Promise<string | null> {
  if (!profile.courseName) return null;
  try {
    const catalog = (await gradeRepo.getCoursesCatalog?.()) || [];
    if (catalog.length === 0) return null;
    const target = normalizeCourseText(profile.courseName);
    const hit =
      catalog.find((c) => normalizeCourseText(c.name) === target) ||
      catalog.find((c) => {
        const n = normalizeCourseText(c.name);
        return n.length >= 4 && (n.includes(target) || target.includes(n));
      });
    return hit ? hit.id : null;
  } catch (e) {
    console.warn('[useMyCourse] Não foi possível resolver o curso no catálogo:', e);
    return null;
  }
}

// Cache de sessão: voltar à aba remonta o hook e hidrata daqui, sem tela de
// carregamento — o catálogo de matrizes é estático na sessão e o perfil vem de
// leitura local barata. `undefined` = nunca carregado (primeira carga da sessão).
let cachedCurricula: CurriculumStructure[] | null = null;
// Escopo do cache de matrizes: course_id do curso carregado ou 'ALL' (catálogo completo)
let cachedCurriculaScope: string | null = null;
let cachedProfile: StudentAcademicProfile | null | undefined;
// Matriz resolvida: sem ela o primeiro render pós-cache renderia a página sem
// stats e sem lista, e o conteúdo inteiro entraria de uma vez depois (layout shift)
let cachedSelectedCurriculum: CurriculumStructure | null = null;

export function resetMyCourseCache() {
  cachedProfile = null;
  cachedSelectedCurriculum = null;
  notifyMyCourseListeners();
}

export function useMyCourse() {
  const { useCases, repos } = useContainer();
  const { allCredentials } = useCredentials();

  const [profile, setProfile] = useState<StudentAcademicProfile | null>(() => cachedProfile ?? null);
  const [allCurricula, setAllCurricula] = useState<CurriculumStructure[]>(() => cachedCurricula ?? []);
  const [selectedCurriculum, setSelectedCurriculum] = useState<CurriculumStructure | null>(
    () => cachedSelectedCurriculum,
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => cachedProfile === undefined);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  // Carrega currículos e perfil. Com cache quente, só o perfil é relido (barato):
  // conteúdo troca no lugar, sem skeleton intermediário (@DESIGN.md — piscar é shift).
  const loadData = useCallback(async () => {
    try {
      const currentProfile = await useCases.manageAcademicProfile.getProfile();

      // Com perfil (login SIGAA), baixa apenas as matrizes do curso do usuário
      // (arquivo por curso no CDN) em vez do catálogo inteiro da UnB (~40 MB).
      // Sem perfil (modo explorar) ou sem casamento no catálogo, cai no fetch completo.
      let curricula: CurriculumStructure[] = [];
      let curriculaScope: string | null = null;
      if (currentProfile) {
        const courseId = await resolveCourseIdForProfile(currentProfile, repos.gradeRepo);
        if (courseId) {
          if (cachedCurricula && cachedCurriculaScope === courseId) {
            curricula = cachedCurricula;
            curriculaScope = courseId;
          } else {
            curricula = await useCases.manageAcademicProfile.getCurriculaForCourse(courseId);
            curriculaScope = curricula.length > 0 ? courseId : null;
          }
        }
      }
      if (curricula.length === 0) {
        curricula =
          cachedCurriculaScope === 'ALL' && cachedCurricula
            ? cachedCurricula
            : await useCases.manageAcademicProfile.getAllCurricula();
        curriculaScope = 'ALL';
      }

      cachedCurricula = curricula;
      cachedCurriculaScope = curriculaScope;
      cachedProfile = currentProfile;
      setAllCurricula(curricula);

      if (currentProfile && curricula.length > 0) {
        // Auto-cura: se alguma disciplina salva no perfil tem nome igual ao código ou vazio,
        // recupera o nome real a partir do catálogo de matrizes carregadas (apenas quando necessário)
        let healed = false;
        const missingNameItems = currentProfile.completedDisciplines.filter(
          (cd) => !cd.name || cd.name === cd.code,
        );

        if (missingNameItems.length > 0) {
          const { sharedDisciplineNameMap } = await import(
            '@/core/infrastructure/in-memory-academic-profile.repo'
          );

          for (const cd of missingNameItems) {
            const cachedName = sharedDisciplineNameMap.get(cd.code);
            if (cachedName) {
              cd.name = cachedName;
              healed = true;
            }
          }

          const stillUnresolved = new Set(
            currentProfile.completedDisciplines
              .filter((cd) => !cd.name || cd.name === cd.code)
              .map((cd) => cd.code),
          );

          if (stillUnresolved.size > 0) {
            const catalogNameMap = new Map<string, string>();
            for (const c of curricula) {
              for (const list of [
                c.mandatoryDisciplines,
                c.electiveDisciplines,
                c.complementaryDisciplines,
              ]) {
                if (!list) continue;
                for (const d of list) {
                  if (d.code && d.name && stillUnresolved.has(d.code)) {
                    catalogNameMap.set(d.code, d.name);
                    stillUnresolved.delete(d.code);
                    if (stillUnresolved.size === 0) break;
                  }
                }
                if (stillUnresolved.size === 0) break;
              }
              if (stillUnresolved.size === 0) break;
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

        cachedSelectedCurriculum = matched || curricula[0];
        setSelectedCurriculum(cachedSelectedCurriculum);
      } else {
        setProfile(currentProfile);
        if (curricula.length > 0) {
          cachedSelectedCurriculum = curricula[0];
          setSelectedCurriculum(cachedSelectedCurriculum);
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
  }, [useCases, repos]);

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

  const activeCurriculum = useMemo(() => {
    if (profile?.customCurriculum) {
      return profile.customCurriculum;
    }
    return selectedCurriculum;
  }, [profile?.customCurriculum, selectedCurriculum]);

  // Calcula o fluxograma quando houver perfil e matriz
  const flowchartData: FlowchartData | null = useMemo(() => {
    if (!activeCurriculum || !profile) return null;
    return useCases.getFlowchart.execute(activeCurriculum, profile, allCurricula);
  }, [activeCurriculum, profile, allCurricula, useCases]);

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
    if (activeCurriculum) {
      for (const d of [
        ...(activeCurriculum.mandatoryDisciplines || []),
        ...(activeCurriculum.electiveDisciplines || []),
        ...(activeCurriculum.complementaryDisciplines || []),
      ]) {
        map.set(d.code, d.name);
      }
    }
    for (const d of profile?.completedDisciplines || []) {
      if (d.name && d.name !== d.code) map.set(d.code, d.name);
    }
    return map;
  }, [allCurricula, activeCurriculum, profile]);

  // Alterna uma disciplina manualmente (a UI passa o estado efetivo atual do card)
  const toggleDiscipline = useCallback(async (code: string, isEffectivelyCompleted?: boolean) => {
    try {
      const updated = await useCases.manageAcademicProfile.toggleDiscipline(code, isEffectivelyCompleted);
      cachedProfile = updated;
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
      cachedProfile = updated;
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
      cachedProfile = res.profile;
      setProfile(res.profile);
      if (res.matchedCurriculum) {
        cachedSelectedCurriculum = res.matchedCurriculum || null;
        setSelectedCurriculum(cachedSelectedCurriculum);
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
      cachedProfile = updated;
      setProfile(updated);
      cachedSelectedCurriculum = curr;
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

  // Salva currículo customizado editado pelo discente
  const saveCustomCurriculum = useCallback(async (curr: CurriculumStructure) => {
    try {
      const updated = await useCases.manageAcademicProfile.saveCustomCurriculum(curr);
      cachedProfile = updated;
      setProfile(updated);
      notifyMyCourseListeners();
      toast.add({
        title: 'Currículo atualizado',
        description: 'Suas alterações no currículo foram salvas com sucesso.',
        type: 'success',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar currículo';
      toast.add({
        title: 'Erro ao salvar currículo',
        description: msg,
        type: 'error',
      });
    }
  }, [useCases]);

  // Restaura o currículo para a matriz original da UnB
  const resetCustomCurriculum = useCallback(async () => {
    try {
      const updated = await useCases.manageAcademicProfile.resetCustomCurriculum();
      cachedProfile = updated;
      setProfile(updated);
      notifyMyCourseListeners();
      toast.add({
        title: 'Currículo restaurado',
        description: 'Seu currículo foi restaurado para a matriz original da UnB.',
        type: 'info',
      });
    } catch {
      toast.add({
        title: 'Erro ao restaurar',
        description: 'Não foi possível restaurar a matriz original.',
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
    curriculum: activeCurriculum,
    originalCurriculum: selectedCurriculum,
    hasCustomCurriculum: Boolean(profile?.customCurriculum),
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
    saveCustomCurriculum,
    resetCustomCurriculum,
    syncSigaa,
    selectCurriculum,
    reload: loadData,
  };
}
