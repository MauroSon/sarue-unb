import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useContainer } from '../context/ContainerContext';
import { useCredentials } from './useCredentials';
import { useMyCourse } from './useMyCourse';
import { useFeed } from './useFeed';
import { toast } from '@/components/ui';
import type {
  Department,
  SemesterOption,
  ScrapedDiscipline,
  ScrapedClass,
  ScheduleOption,
  SavedGrade,
  AcademicCalendar,
} from '@/core';
import { generateAcronyms, parseScheduleCode } from '@/core';

// Listeners para atualização da grade entre telas
const gradeUpdateListeners = new Set<() => void>();
export function notifyGradeUpdate() {
  gradeUpdateListeners.forEach((fn) => fn());
}

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

// Período ativo da Grade, lido por outras telas sem montar o hook.
// Aceita apenas períodos válidos (1 ou 2); corrige seleções legadas como '3' ou '4'.
export function getActiveGradePeriod(): { year: string; period: string } {
  try {
    const storedYear = localStorage.getItem('unb_grade_year');
    const storedPeriod = localStorage.getItem('unb_grade_period');
    return {
      year: storedYear && /^\d{4}$/.test(storedYear) ? storedYear : '2026',
      period: storedPeriod === '1' || storedPeriod === '2' ? storedPeriod : '2',
    };
  } catch {
    return { year: '2026', period: '2' };
  }
}

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

  const [year, setYearState] = useState<string>(
    () => getActiveGradePeriod().year,
  );

  const [period, setPeriodState] = useState<string>(
    () => getActiveGradePeriod().period,
  );

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

  const { allCredentials, hasCredentials } = useCredentials();
  const { profile } = useMyCourse();
  const { courses: feedCourses } = useFeed();

  const [calendar, setCalendar] = useState<AcademicCalendar | null>(null);
  const [isSemesterStarted, setIsSemesterStarted] = useState<boolean>(true);
  const [isCurrentSemesterMode, setIsCurrentSemesterMode] = useState<boolean>(false);
  // Assinatura das turmas matriculadas já aplicadas na grade + flag de edição manual.
  // A auto-aplicação re-sincroniza quando os dados melhoram em ondas (feed do SIGAA
  // chega antes do catálogo completo raspado da rede), mas para de intervir assim que
  // o usuário edita a grade por conta própria.
  const appliedEnrolledSignatureRef = useRef('');
  const hasEditedGradeRef = useRef(false);

  // Disciplinas atualmente matriculadas no Meu Curso
  const enrolledDisciplines = useMemo(() => {
    if (!profile) return [];
    return profile.completedDisciplines.filter((d) => d.situation === 'MATR');
  }, [profile]);

  const hasConnectedAccount = Boolean(allCredentials.sigaa || hasCredentials);
  const isMyCourseActive = Boolean(profile && (profile.completedDisciplines.length > 0 || profile.matricula));

  // Converte disciplinas matriculadas no Meu Curso em ScrapedClass estruturadas
  const currentEnrolledClasses = useMemo<ScrapedClass[]>(() => {
    if (!enrolledDisciplines.length) return [];

    const resolved: ScrapedClass[] = [];

    for (const d of enrolledDisciplines) {
      // 1. Procura no catálogo allDisciplines por código exato
      const scrapedDisc = allDisciplines.find((ad) => ad.code.toUpperCase() === d.code.toUpperCase());

      // Procura dados complementares no feed de turmas SIGAA (se houver schedule extraído).
      // Ordem: código exato, nome exato (normalizado sem acento/caixa) e, por último,
      // inclusão de nome — mas apenas quando aponta para UM único curso do feed. Include
      // ambíguo (ex.: "ESTRUTURAS DE DADOS" casa teoria e "LABORATÓRIO DE ESTRUTURAS DE
      // DADOS") ficaria com o horário da turma errada e fabricaria conflito inexistente.
      const normCode = normalizeText(d.code);
      const normName = normalizeText(d.name);
      const matchedFeedCourse =
        feedCourses.find((c) => normalizeText(c.code) === normCode) ??
        feedCourses.find((c) => normalizeText(c.name) === normName) ??
        (() => {
          const partial = feedCourses.filter(
            (c) =>
              normalizeText(c.name).includes(normName) ||
              normName.includes(normalizeText(c.name))
          );
          return partial.length === 1 ? partial[0] : undefined;
        })();

      let matchedClass: ScrapedClass | undefined;

      if (scrapedDisc && scrapedDisc.classes.length > 0) {
        // 1. Se houver classCode (ex: "01"), casa exatamente
        if (d.classCode) {
          const normTurma = d.classCode.replace(/^0+/, '');
          matchedClass = scrapedDisc.classes.find(
            (c) => c.classCode === d.classCode || c.classCode.replace(/^0+/, '') === normTurma
          );
        }

        // 2. Casa a turma do catálogo cujo horário é o mesmo do feed SIGAA
        if (!matchedClass && matchedFeedCourse?.schedule) {
          matchedClass = scrapedDisc.classes.find(
            (c) => c.scheduleCode === matchedFeedCourse.schedule
          );
        }

        // Sem fallback para a primeira turma do catálogo: turma errada é pior que turma ausente
      }

      if (matchedClass) {
        resolved.push(matchedClass);
      } else if (matchedFeedCourse?.schedule) {
        // Se não estava no catálogo mas temos o horário do SIGAA, monta a classe estruturada
        const slots = parseScheduleCode(matchedFeedCourse.schedule);
        if (slots.length > 0) {
          resolved.push({
            id: `enrolled-${d.code}-${d.classCode || '01'}`,
            disciplineCode: d.code,
            disciplineName: d.name,
            classCode: d.classCode || '01',
            teachers: matchedFeedCourse.professor ? [matchedFeedCourse.professor] : [],
            classroom: matchedFeedCourse.classroom || 'A definir',
            scheduleCode: matchedFeedCourse.schedule,
            scheduleDescription: matchedFeedCourse.schedule,
            scheduleSlots: slots,
          });
        }
      }
    }

    return resolved;
  }, [enrolledDisciplines, allDisciplines, feedCourses]);

  // Carrega calendário acadêmico dinamicamente para ano e período selecionados
  useEffect(() => {
    let isMounted = true;
    async function loadCalendar() {
      try {
        const [cal, started] = await Promise.all([
          container.useCases.getAcademicCalendar.getCalendar(year, period),
          container.useCases.getAcademicCalendar.isSemesterStarted(year, period),
        ]);
        if (isMounted) {
          setCalendar(cal);
          setIsSemesterStarted(started);
        }
      } catch {
        if (isMounted) {
          setIsSemesterStarted(true);
        }
      }
    }
    loadCalendar();
    return () => {
      isMounted = false;
    };
  }, [container, year, period]);

  // Se o aluno tiver conta conectada com Meu Curso ativado:
  // inicializa com as turmas matriculadas do semestre atual no modo compactado.
  // Re-aplica sempre que as turmas matriculadas mudarem de composição enquanto a
  // grade ainda espelha as matrículas — o primeiro snapshot pode ter horários
  // reconstruídos do feed, antes do catálogo completo chegar da rede. Para de
  // intervir assim que o usuário edita a grade (toggleClass, solver, limpar etc.).
  useEffect(() => {
    if (!hasConnectedAccount || !isMyCourseActive) return;
    if (currentEnrolledClasses.length === 0) return;
    if (hasEditedGradeRef.current) return;

    const signature = currentEnrolledClasses
      .map((c) => c.id)
      .sort()
      .join('|');

    if (signature === appliedEnrolledSignatureRef.current) return;

    appliedEnrolledSignatureRef.current = signature;
    setSelectedClasses(currentEnrolledClasses);
    setIsCurrentSemesterMode(true);
  }, [hasConnectedAccount, isMyCourseActive, currentEnrolledClasses]);

  const hasSemesterAlert = Boolean(
    hasConnectedAccount && isMyCourseActive && isSemesterStarted && enrolledDisciplines.length > 0
  );

  const restoreEnrolledClasses = useCallback(() => {
    if (currentEnrolledClasses.length === 0) {
      setFeedbackMessage('Nenhuma turma matriculada disponível para restaurar agora.');
      return;
    }
    hasEditedGradeRef.current = false;
    appliedEnrolledSignatureRef.current = currentEnrolledClasses
      .map((c) => c.id)
      .sort()
      .join('|');
    setSelectedClasses(currentEnrolledClasses);
    setIsCurrentSemesterMode(true);
    // Opções antigas do solver não correspondem mais à grade restaurada
    setScheduleOptions([]);
    setCurrentOptionIndex(0);
    const n = currentEnrolledClasses.length;
    setFeedbackMessage(
      `Grade restaurada: ${n} ${n === 1 ? 'turma matriculada' : 'turmas matriculadas'} do semestre.`,
    );
  }, [currentEnrolledClasses]);

  const startNewPlanning = useCallback(() => {
    hasEditedGradeRef.current = true;
    setSelectedClasses([]);
    setIsCurrentSemesterMode(false);
    setFeedbackMessage('Grade limpa para novo planejamento!');
  }, []);

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

        // Tenta carregar grade salva do semestre atual
        const semKey = `${year}.${period}`;
        const saved = await container.useCases.manageGrade.get(semKey);
        savedGradeCache = saved;
        if (isMounted && saved) {
          hasEditedGradeRef.current = true;
          setSelectedClasses(saved.selectedClasses ?? []);
          setIsCurrentSemesterMode(false);
        }
      } catch {
        // Inicialização com degradação elegante
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [container, year, period]);

  // Carrega a grade salva do semestre ao alternar de semestre
  useEffect(() => {
    let isMounted = true;
    const semKey = `${year}.${period}`;

    async function loadSemesterGrade() {
      try {
        const saved = await container.useCases.manageGrade.get(semKey);
        if (!isMounted) return;
        savedGradeCache = saved;
        if (saved) {
          hasEditedGradeRef.current = true;
          setSelectedClasses(saved.selectedClasses ?? []);
          setIsCurrentSemesterMode(false);
          setScheduleOptions([]);
          setCurrentOptionIndex(0);
        } else {
          // Se for o semestre atual do calendário e o aluno tiver turmas matriculadas
          const isCurrentSem = (year === '2026' && period === '2') || semesters.some((s) => s.year === year && s.period === period && s.isCurrent);
          if (isCurrentSem && currentEnrolledClasses.length > 0 && !hasEditedGradeRef.current) {
            setSelectedClasses(currentEnrolledClasses);
            setIsCurrentSemesterMode(true);
          } else {
            // Novo planejamento limpo para o semestre
            hasEditedGradeRef.current = false;
            setSelectedClasses([]);
            setIsCurrentSemesterMode(false);
            setScheduleOptions([]);
            setCurrentOptionIndex(0);
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar grade do semestre:', e);
      }
    }

    loadSemesterGrade();

    const listener = () => {
      loadSemesterGrade();
    };
    gradeUpdateListeners.add(listener);

    return () => {
      isMounted = false;
      gradeUpdateListeners.delete(listener);
    };
  }, [year, period, container, semesters, currentEnrolledClasses]);

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
    hasEditedGradeRef.current = true;
    setIsCurrentSemesterMode(false);
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
    hasEditedGradeRef.current = true;
    setIsCurrentSemesterMode(false);
    setSelectedClasses((prev) => prev.filter((c) => c.id !== classId));
  }, []);

  const clearGrade = useCallback(() => {
    hasEditedGradeRef.current = true;
    setIsCurrentSemesterMode(false);
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

      hasEditedGradeRef.current = true;
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
        hasEditedGradeRef.current = true;
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

  // Envia disciplina para a grade do semestre adequado
  const sendDisciplineToGrade = useCallback(
    async (code: string, name: string) => {
      await sendDisciplineToGradeAction(container, code, name);
    },
    [container]
  );

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
    calendar,
    isSemesterStarted,
    hasSemesterAlert,
    isCurrentSemesterMode,
    currentEnrolledClasses,
    // Contagem honesta: turmas que a grade recebe de fato, não disciplinas cadastradas
    enrolledCount: currentEnrolledClasses.length,
    restoreEnrolledClasses,
    startNewPlanning,
    sendDisciplineToGrade,
  };
}

export async function sendDisciplineToGradeAction(
  container: ReturnType<typeof useContainer>,
  code: string,
  name: string
) {
  try {
    const calendars = await container.useCases.getAcademicCalendar.execute();
    const currentCal = calendars.find((c) => c.isCurrent) || calendars[0];
    const now = new Date();

    const isDateInRange = (period?: { inicio: string; fim: string }) => {
      if (!period?.inicio || !period?.fim) return false;
      const start = new Date(`${period.inicio}T00:00:00`).getTime();
      const end = new Date(`${period.fim}T23:59:59`).getTime();
      const current = now.getTime();
      return current >= start && current <= end;
    };

    const isEnrolling =
      isDateInRange(currentCal?.periodoMatricula) ||
      isDateInRange(currentCal?.periodoRematricula) ||
      isDateInRange(currentCal?.periodoMatriculaExtraordinaria);

    const isStarted = currentCal
      ? await container.useCases.getAcademicCalendar.isSemesterStarted(currentCal.year, currentCal.period, now)
      : true;

    let targetYear = currentCal?.year || '2026';
    let targetPeriod = currentCal?.period || '2';

    // Se o semestre atual já começou e não está no período de matrículas/rematrícula, planeja para o próximo semestre!
    if (isStarted && !isEnrolling) {
      if (targetPeriod === '1') {
        targetPeriod = '2';
      } else {
        targetYear = String(parseInt(targetYear, 10) + 1);
        targetPeriod = '1';
      }
    }

    const targetSemester = `${targetYear}.${targetPeriod}`;

    // Busca turmas da matéria no catálogo
    let foundClasses: ScrapedClass[] = [];
    try {
      const disciplines = await container.useCases.scrapeClasses.execute('ALL', targetYear, targetPeriod);
      const matched = disciplines.find((d) => d.code.toUpperCase() === code.toUpperCase());
      if (matched && matched.classes.length > 0) {
        foundClasses = matched.classes;
      }
    } catch {}

    const selectedClass: ScrapedClass = foundClasses[0] || {
      id: `plan-${code}-01`,
      disciplineCode: code,
      disciplineName: name,
      classCode: '01',
      teachers: [],
      classroom: 'A definir',
      scheduleCode: 'A definir',
      scheduleSlots: [],
    };

    const existingGrade = await container.useCases.manageGrade.get(targetSemester);
    const existingClasses = existingGrade?.selectedClasses || [];
    const updatedClasses = [
      ...existingClasses.filter((c) => c.disciplineCode.toUpperCase() !== code.toUpperCase()),
      selectedClass,
    ];

    await container.useCases.manageGrade.save({
      id: `grade-${targetYear}-${targetPeriod}`,
      name: `Grade ${targetSemester}`,
      semester: targetSemester,
      selectedClasses: updatedClasses,
      updatedAt: new Date().toISOString(),
    });

    notifyGradeUpdate();

    toast.add({
      title: 'Enviada para o Montar Grade!',
      description: `${code} - ${name} foi adicionada ao planejamento de ${targetSemester}.`,
      type: 'success',
      timeout: 4500,
    });
  } catch (e) {
    console.error('Erro ao enviar disciplina para grade:', e);
    toast.add({
      title: 'Erro ao enviar disciplina',
      description: 'Não foi possível adicionar a disciplina ao Montar Grade.',
      type: 'error',
    });
  }
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
