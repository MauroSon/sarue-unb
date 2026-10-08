import { useState, useEffect, useCallback, useMemo } from 'react';
import { useContainer } from '../context/ContainerContext';
import type {
  Department,
  SemesterOption,
  ScrapedDiscipline,
  ScrapedClass,
  ScheduleOption,
  SavedGrade,
} from '@/core';
import { generateAcronyms } from '@/core';

// Cache em memória de disciplinas por depto-ano-período
const disciplinesCache = new Map<string, ScrapedDiscipline[]>();

// Cache da última grade salva para restauração instantânea ao revisitar a tela
let savedGradeCache: SavedGrade | null = null;

// Busca sem sensibilidade a acentos, maiúsculas ou pontuação ("calculo" acha "Cálculo")
const normalizeText = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const matchesDiscipline = (d: ScrapedDiscipline, q: string): boolean => {
  if (normalizeText(d.code).includes(q)) return true;
  if (normalizeText(d.name).includes(q)) return true;

  // Busca via sigla (ex.: C1 para Cálculo 1, OAC para Organização e Arquitetura de Computadores)
  const acronym = d.acronym || generateAcronyms(d.name).acronym;
  if (acronym && normalizeText(acronym) === q) return true;

  const acronyms =
    d.acronyms && d.acronyms.length > 0
      ? d.acronyms
      : generateAcronyms(d.name).acronyms;

  for (const ac of acronyms) {
    const normAc = normalizeText(ac);
    if (normAc === q) return true;
    if (q.length >= 2 && normAc.includes(q)) return true;
  }

  return false;
};

export const ALL_DEPARTMENTS_ITEM: Department = {
  id: 'ALL',
  name: 'Todos os departamentos (UnB Geral)',
};

export function useGrade() {
  const container = useContainer();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters, setSemesters] = useState<SemesterOption[]>([
    { value: '2026-2', year: '2026', period: '2', label: '2026 • 2º semestre', isCurrent: true },
    { value: '2027-1', year: '2027', period: '1', label: '2027 • 1º semestre' },
  ]);
  const [allDisciplines, setAllDisciplines] = useState<ScrapedDiscipline[]>([]);

  // Sempre abre em "Todos os departamentos" — sem persistir a escolha de departamento
  const [selectedDeptId, setSelectedDeptIdState] = useState<string>('ALL');

  const [year, setYearState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('unb_grade_year');
      return stored && /^\d{4}$/.test(stored) ? stored : '2026';
    } catch {
      return '2026';
    }
  });

  const [period, setPeriodState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('unb_grade_period');
      // Apenas períodos válidos (1 ou 2) são aceitos; corrige seleções legadas como '3' ou '4'
      return stored === '1' || stored === '2' ? stored : '2';
    } catch {
      return '2';
    }
  });

  const setSelectedDeptId = useCallback((id: string) => {
    setSelectedDeptIdState(id);
  }, []);

  const clearDeptFilter = useCallback(() => {
    setSelectedDeptId('ALL');
  }, [setSelectedDeptId]);

  const setYear = useCallback((y: string) => {
    setYearState(y);
    try {
      localStorage.setItem('unb_grade_year', y);
    } catch {}
  }, []);

  const setPeriod = useCallback((p: string) => {
    setPeriodState(p);
    try {
      localStorage.setItem('unb_grade_period', p);
    } catch {}
  }, []);

  const [disciplines, setDisciplines] = useState<ScrapedDiscipline[]>(() => {
    const initialKey = `all-${year}-${period}`;
    const all = disciplinesCache.get(initialKey);
    if (all) {
      return selectedDeptId === 'ALL' ? all : all.filter((d) => d.departmentId === selectedDeptId);
    }
    return [];
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('');
  const [activeDeptId, setActiveDeptId] = useState<string>(selectedDeptId);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Restaura instantaneamente da visita anterior da sessão (evita flash de empty state)
  const [selectedClasses, setSelectedClasses] = useState<ScrapedClass[]>(
    () => savedGradeCache?.selectedClasses ?? [],
  );
  const [conflicts, setConflicts] = useState<string[]>([]);

  const [scheduleOptions, setScheduleOptions] = useState<ScheduleOption[]>([]);
  const [currentOptionIndex, setCurrentOptionIndex] = useState<number>(0);

  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Carrega departamentos, semestres e grade salva no início
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const [depts, sems] = await Promise.all([
          container.useCases.getDepartments.execute(),
          container.useCases.getSemesters.execute().catch(() => []),
        ]);

        if (isMounted) {
          setDepartments([
            ALL_DEPARTMENTS_ITEM,
            ...depts.filter((d) => d.id !== 'ALL'),
          ]);
          if (sems && sems.length > 0) {
            setSemesters(sems);
            setYearState((currYear) => {
              setPeriodState((currPeriod) => {
                const isValid = sems.some((s) => s.year === currYear && s.period === currPeriod);
                if (!isValid) {
                  const defaultSem = sems.find((s) => s.isCurrent) || sems[0];
                  if (defaultSem) {
                    try {
                      localStorage.setItem('unb_grade_period', defaultSem.period);
                    } catch {}
                    return defaultSem.period;
                  }
                }
                return currPeriod;
              });

              const isValidYear = sems.some((s) => s.year === currYear);
              if (!isValidYear) {
                const defaultSem = sems.find((s) => s.isCurrent) || sems[0];
                if (defaultSem) {
                  try {
                    localStorage.setItem('unb_grade_year', defaultSem.year);
                  } catch {}
                  return defaultSem.year;
                }
              }
              return currYear;
            });
          }
        }

        // Tenta carregar grade salva do SQLite (inclusive grade vazia salva de propósito)
        const saved = await container.useCases.manageGrade.get();
        savedGradeCache = saved;
        if (isMounted && saved) {
          setSelectedClasses(saved.selectedClasses ?? []);
        }
      } catch {
        // Inicialização com degradação elegante
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [container]);

  // Mapa de departamentos para lookup O(1) de nomes
  const departmentsMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of departments) {
      map.set(d.id, d.name);
    }
    return map;
  }, [departments]);

  // Coleta todas as turmas da UnB com suporte a cache global em memória
  const fetchClasses = useCallback(
    async (deptId = selectedDeptId, y = year, p = period, force = false) => {
      const allKey = `all-${y}-${p}`;

      if (!force && disciplinesCache.has(allKey)) {
        const all = disciplinesCache.get(allKey)!;
        setAllDisciplines(all);
        const deptList =
          deptId === 'ALL' ? all : all.filter((d) => d.departmentId === deptId);
        setDisciplines(deptList);
        return;
      }

      setIsScraping(true);
      try {
        const result = await container.useCases.scrapeClasses.execute('ALL', y, p);
        disciplinesCache.set(allKey, result);
        setAllDisciplines(result);
        const deptList =
          deptId === 'ALL' ? result : result.filter((d) => d.departmentId === deptId);
        setDisciplines(deptList);
      } catch (err) {
        setFeedbackMessage(`Aviso: ${errMsg(err)}`);
      } finally {
        setIsScraping(false);
      }
    },
    [container, selectedDeptId, year, period]
  );

  // Atualiza ou carrega disciplinas ao alterar departamento ou semestre
  useEffect(() => {
    if (allDisciplines.length > 0) {
      const deptList =
        selectedDeptId === 'ALL'
          ? allDisciplines
          : allDisciplines.filter((d) => d.departmentId === selectedDeptId);
      setDisciplines(deptList);
    } else {
      fetchClasses(selectedDeptId, year, period, false);
    }
  }, [selectedDeptId, year, period, allDisciplines, fetchClasses]);

  // Recalcula conflitos sempre que as turmas selecionadas mudarem
  useEffect(() => {
    let isMounted = true;

    async function checkCurrentConflicts() {
      if (selectedClasses.length < 2) {
        if (isMounted) setConflicts([]);
        return;
      }

      try {
        const found = await container.useCases.solveSchedule.checkConflicts(selectedClasses);
        if (isMounted) setConflicts(found);
      } catch {
        if (isMounted) setConflicts([]);
      }
    }

    checkCurrentConflicts();

    return () => {
      isMounted = false;
    };
  }, [selectedClasses, container]);

  // Executa busca ativa (ao pressionar Enter ou clicar no botão Buscar)
  const executeSearch = useCallback(
    async (customQuery?: string, customDeptId?: string) => {
      const q = customQuery !== undefined ? customQuery : searchQuery;
      const dept = customDeptId !== undefined ? customDeptId : selectedDeptId;

      if (customQuery !== undefined) {
        setSearchQuery(customQuery);
      }
      if (customDeptId !== undefined) {
        setSelectedDeptId(customDeptId);
      }

      setIsSearching(true);
      setActiveSearchQuery(q);
      setActiveDeptId(dept);
      setHasSearched(true);

      try {
        const allKey = `all-${year}-${period}`;
        if (!disciplinesCache.has(allKey) || allDisciplines.length === 0) {
          await fetchClasses(dept, year, period, false);
        }
      } finally {
        setIsSearching(false);
      }
    },
    [searchQuery, selectedDeptId, setSelectedDeptId, year, period, allDisciplines.length, fetchClasses]
  );

  const resetSearch = useCallback(() => {
    setHasSearched(false);
    setSearchQuery('');
    setActiveSearchQuery('');
    setActiveDeptId(selectedDeptId);
  }, [selectedDeptId]);

  // Filtro e busca de disciplinas ativados sob demanda (Enter / botão Buscar)
  const filteredDisciplines = useMemo(() => {
    if (!hasSearched) return [];

    const q = normalizeText(activeSearchQuery);
    const pool = allDisciplines.length > 0 ? allDisciplines : disciplines;

    if (!q) {
      if (activeDeptId === 'ALL') {
        // Sem texto e UnB Geral: exibe as primeiras 50 para fluidez de renderização
        return pool.slice(0, 50);
      }
      return pool.filter((d) => d.departmentId === activeDeptId);
    }

    // Busca com query de texto (nome, código ou sigla)
    if (activeDeptId === 'ALL') {
      return pool.filter((d) => matchesDiscipline(d, q));
    }

    // Com departamento específico selecionado
    const inDept = pool.filter(
      (d) => d.departmentId === activeDeptId && matchesDiscipline(d, q)
    );

    if (inDept.length > 0) {
      return inDept;
    }

    // Fallback inteligente: se não encontrou no departamento selecionado, busca em toda a UnB
    return pool.filter((d) => matchesDiscipline(d, q));
  }, [hasSearched, activeSearchQuery, activeDeptId, allDisciplines, disciplines]);

  const isFallbackSearch = useMemo(() => {
    if (!hasSearched || activeDeptId === 'ALL' || !activeSearchQuery.trim()) return false;
    const q = normalizeText(activeSearchQuery);
    const pool = allDisciplines.length > 0 ? allDisciplines : disciplines;
    const inDept = pool.some(
      (d) => d.departmentId === activeDeptId && matchesDiscipline(d, q)
    );
    return !inDept && filteredDisciplines.length > 0;
  }, [hasSearched, activeDeptId, activeSearchQuery, allDisciplines, disciplines, filteredDisciplines]);

  // Adiciona ou remove turma
  const toggleClass = useCallback((cls: ScrapedClass) => {
    setSelectedClasses((prev) => {
      const exists = prev.some((c) => c.id === cls.id);
      if (exists) {
        return prev.filter((c) => c.id !== cls.id);
      } else {
        // Se já existe turma da mesma disciplina, substitui por esta turma escolhida
        const filtered = prev.filter((c) => c.disciplineCode !== cls.disciplineCode);
        return [...filtered, cls];
      }
    });
  }, []);

  const removeClass = useCallback((classId: string) => {
    setSelectedClasses((prev) => prev.filter((c) => c.id !== classId));
  }, []);

  const clearGrade = useCallback(() => {
    setSelectedClasses([]);
    setConflicts([]);
    setScheduleOptions([]);
    setCurrentOptionIndex(0);
    setFeedbackMessage(null);
  }, []);

  // Gerador automático de combinações sem conflito
  const generateCombinations = useCallback(
    async (preferenceShift?: 'M' | 'T' | 'N') => {
      if (selectedClasses.length === 0) {
        setFeedbackMessage('Selecione ao menos uma disciplina para gerar combinações.');
        return;
      }

      setIsSolving(true);
      setFeedbackMessage(null);

      try {
        // Pega todas as turmas disponíveis para as disciplinas atualmente selecionadas na base completa
        const targetDisciplineCodes = new Set(selectedClasses.map((c) => c.disciplineCode));
        const candidateClasses: ScrapedClass[] = [];

        const poolSource = allDisciplines.length > 0 ? allDisciplines : disciplines;
        for (const disc of poolSource) {
          if (targetDisciplineCodes.has(disc.code)) {
            candidateClasses.push(...disc.classes);
          }
        }

        // Se nenhuma turma foi encontrada no catálogo local, usa as próprias turmas selecionadas
        const pool = candidateClasses.length > 0 ? candidateClasses : selectedClasses;
        const options = await container.useCases.solveSchedule.execute(pool, preferenceShift);

        setScheduleOptions(options);
        setCurrentOptionIndex(0);

        if (options.length > 0) {
          setSelectedClasses(options[0].classes);
          setFeedbackMessage(
            `Geradas ${options.length} opções sem conflito! Exibindo opção 1.`
          );
        } else {
          setFeedbackMessage('Nenhuma combinação sem conflito foi encontrada para essas disciplinas.');
        }
      } catch (err) {
        setFeedbackMessage(`Erro ao gerar grade: ${errMsg(err)}`);
      } finally {
        setIsSolving(false);
      }
    },
    [container, selectedClasses, allDisciplines, disciplines]
  );

  const applyOption = useCallback(
    (index: number) => {
      if (index >= 0 && index < scheduleOptions.length) {
        setCurrentOptionIndex(index);
        setSelectedClasses(scheduleOptions[index].classes);
      }
    },
    [scheduleOptions]
  );

  // Salvar no SQLite (grade vazia também é salvable: persiste o estado "sem grade")
  const saveGrade = useCallback(async () => {
    setIsSaving(true);
    try {
      const grade: SavedGrade = {
        id: `grade-${year}-${period}`,
        name: `Grade ${year}.${period}`,
        semester: `${year}.${period}`,
        selectedClasses,
        updatedAt: new Date().toISOString(),
      };

      await container.useCases.manageGrade.save(grade);
      savedGradeCache = grade;
      setFeedbackMessage('Grade salva com sucesso no seu computador!');
    } catch (err) {
      setFeedbackMessage(`Erro ao salvar grade: ${errMsg(err)}`);
    } finally {
      setIsSaving(false);
    }
  }, [container, selectedClasses, year, period]);

  return {
    departments,
    departmentsMap,
    semesters,
    selectedDeptId,
    setSelectedDeptId,
    clearDeptFilter,
    year,
    setYear,
    period,
    setPeriod,
    disciplines,
    allDisciplines,
    filteredDisciplines,
    searchQuery,
    setSearchQuery,
    hasSearched,
    activeSearchQuery,
    activeDeptId,
    isFallbackSearch,
    isSearching,
    executeSearch,
    resetSearch,
    selectedClasses,
    conflicts,
    scheduleOptions,
    currentOptionIndex,
    isScraping,
    isSolving,
    isSaving,
    feedbackMessage,
    fetchClasses,
    toggleClass,
    removeClass,
    clearGrade,
    generateCombinations,
    applyOption,
    saveGrade,
  };
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
