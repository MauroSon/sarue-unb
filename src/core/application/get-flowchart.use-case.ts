import type {
  FlowchartData,
  FlowchartDiscipline,
  FlowchartMetrics,
  FlowchartSemester,
  StudentAcademicProfile,
} from '../domain/entities/academic-profile';
import type { CurriculumStructure } from '../domain/entities/course';

export class GetFlowchartUseCase {
  execute(
    curriculum: CurriculumStructure,
    profile: StudentAcademicProfile,
    allCurricula?: CurriculumStructure[]
  ): FlowchartData {
    // 1. Constrói conjunto de disciplinas efetivamente concluídas
    const manualCompleted = new Set(profile.manualCompletedCodes || []);
    const manualUncompleted = new Set(profile.manualUncompletedCodes || []);

    const effectiveCompletedCodes = new Set<string>();
    const inProgressCodes = new Set<string>();
    const disciplineDetailsMap = new Map<string, { grade?: string; situation?: string }>();

    for (const d of profile.completedDisciplines || []) {
      disciplineDetailsMap.set(d.code, { grade: d.grade, situation: d.situation });

      if (d.situation === 'MATR') {
        inProgressCodes.add(d.code);
      }

      if (d.isCompleted && !manualUncompleted.has(d.code)) {
        effectiveCompletedCodes.add(d.code);
      }
    }

    // Adiciona as marcadas manualmente
    for (const code of manualCompleted) {
      effectiveCompletedCodes.add(code);
      inProgressCodes.delete(code);
    }

    // Garante que as desmarcadas manualmente não constem como concluídas
    for (const code of manualUncompleted) {
      effectiveCompletedCodes.delete(code);
    }

    // 2. Mapeamento de equivalências
    // Mapeamento canônico de disciplinas comuns e equivalências do currículo
    const canonicalEquivalences: Record<string, string[]> = {
      MAT0025: ['MAT0137'],
      MAT0137: ['MAT0025'],
      EST0023: ['EST0022'],
      EST0022: ['EST0023'],
      CIC0099: ['CIC0098'],
      CIC0098: ['CIC0099'],
      ENE0304: ['ENE0037'],
      ENE0037: ['ENE0304'],
      ENE0282: ['ENE0038'],
      ENE0038: ['ENE0282'],
      CIC0265: ['CIC0246'],
      CIC0246: ['CIC0265'],
      CIC0266: ['CIC0243'],
      CIC0243: ['CIC0266'],
      CIC0267: ['CIC0353'],
      CIC0353: ['CIC0267'],
      CIC0268: ['CIC0356'],
      CIC0356: ['CIC0268'],
      ENE0067: ['CIC0242'],
      CIC0242: ['ENE0067'],
    };

    const isCompletedOrEquivalent = (targetCode: string, equivalences: string[] = []): boolean => {
      if (effectiveCompletedCodes.has(targetCode)) return true;
      const allEqs = new Set([...equivalences, ...(canonicalEquivalences[targetCode] || [])]);
      for (const eq of allEqs) {
        if (effectiveCompletedCodes.has(eq)) return true;
      }
      return false;
    };

    // 3. Monta o grafo de pós-requisitos (disciplinas que dependem de uma dada matéria)
    const mandatoryList = curriculum.mandatoryDisciplines || [];
    const unlockedMap = new Map<string, Set<string>>();

    for (const disc of mandatoryList) {
      for (const prereq of disc.prerequisites || []) {
        if (!unlockedMap.has(prereq)) {
          unlockedMap.set(prereq, new Set());
        }
        unlockedMap.get(prereq)!.add(disc.code);
      }
    }

    // 4. Classifica cada disciplina obrigatória
    const enrichedMandatory: FlowchartDiscipline[] = [];
    let completedMandatoryCount = 0;
    let completedHours = 0;
    let totalHours = 0;
    let availableCount = 0;

    // Avaliador de expressões lógicas de pré-requisitos
    for (const disc of mandatoryList) {
      const code = disc.code;
      const hours = disc.workloadHours || 60;
      totalHours += hours;

      const isCompleted = isCompletedOrEquivalent(code, disc.equivalences);
      const isEnrolled = inProgressCodes.has(code);
      const details = disciplineDetailsMap.get(code);

      // Avaliação booleana de pré-requisitos (E / OU / parênteses)
      const isPrereqSatisfied = (prereqCode: string): boolean => {
        const prereqObj = mandatoryList.find((m) => m.code === prereqCode);
        const prereqEquivs = prereqObj?.equivalences || [];
        return isCompletedOrEquivalent(prereqCode, prereqEquivs);
      };

      const getPrereqLabel = (prereqCode: string): string => {
        const prereqObj = mandatoryList.find((m) => m.code === prereqCode)
          || (curriculum.electiveDisciplines || []).find((m) => m.code === prereqCode);
        return prereqObj ? `${prereqCode} (${prereqObj.name})` : prereqCode;
      };

      const evalPrereqs = evaluatePrerequisiteExpression(
        disc.prerequisitesRaw,
        disc.prerequisites || [],
        isPrereqSatisfied,
        getPrereqLabel,
      );

      let status: FlowchartDiscipline['status'];
      if (isCompleted) {
        status = 'completed';
        completedMandatoryCount++;
        completedHours += hours;
      } else if (isEnrolled) {
        status = 'in_progress';
      } else if (evalPrereqs.isSatisfied) {
        status = 'available';
        availableCount++;
      } else {
        status = 'locked';
      }

      const unlocked = Array.from(unlockedMap.get(code) || []);
      const isManuallyToggled = manualCompleted.has(code) || manualUncompleted.has(code);

      enrichedMandatory.push({
        code: disc.code,
        name: disc.name,
        workloadHours: hours,
        level: disc.level || 1,
        nature: disc.nature,
        status,
        grade: details?.grade,
        situation: details?.situation,
        prerequisites: disc.prerequisites || [],
        missingPrerequisites: evalPrereqs.missing,
        equivalences: disc.equivalences || [],
        unlockedDisciplines: unlocked,
        isManuallyToggled,
      });
    }

    // 5. Agrupa por semestres (levels)
    const semesterMap = new Map<number, FlowchartDiscipline[]>();
    for (const disc of enrichedMandatory) {
      const lvl = disc.level;
      if (!semesterMap.has(lvl)) {
        semesterMap.set(lvl, []);
      }
      semesterMap.get(lvl)!.push(disc);
    }

    // Garante ordenação dos semestres de 1 ao máximo
    const sortedLevels = Array.from(semesterMap.keys()).sort((a, b) => a - b);
    const semesters: FlowchartSemester[] = sortedLevels.map((level) => {
      const discs = semesterMap.get(level) || [];
      const sumHours = discs.reduce((acc, curr) => acc + curr.workloadHours, 0);
      return {
        level,
        totalHours: sumHours,
        disciplines: discs,
      };
    });

    // 6. Disciplinas cursando (in_progress) - une obrigatórias da grade + optativas/complementares matriculadas
    const allInProgressDisciplines: FlowchartDiscipline[] = [];
    const inProgressCodeSet = new Set<string>();

    for (const disc of enrichedMandatory) {
      if (disc.status === 'in_progress') {
        allInProgressDisciplines.push(disc);
        inProgressCodeSet.add(disc.code);
      }
    }

    for (const d of profile.completedDisciplines || []) {
      if (d.situation === 'MATR' && !inProgressCodeSet.has(d.code)) {
        const fromMandatory = (curriculum.mandatoryDisciplines || []).find((m) => m.code === d.code);
        const fromElective = (curriculum.electiveDisciplines || []).find((e) => e.code === d.code);
        const fromComplementary = (curriculum.complementaryDisciplines || []).find((c) => c.code === d.code);
        let catDisc = fromMandatory || fromElective || fromComplementary;

        // Se não constar na matriz selecionada, busca nas outras matrizes passadas
        if (!catDisc && allCurricula) {
          for (const curr of allCurricula) {
            const found = [
              ...(curr.mandatoryDisciplines || []),
              ...(curr.electiveDisciplines || []),
              ...(curr.complementaryDisciplines || []),
            ].find((cd) => cd.code === d.code);
            if (found) {
              catDisc = found;
              break;
            }
          }
        }

        const discName = d.name && d.name !== d.code ? d.name : catDisc?.name || d.name || d.code;
        const hours = d.workloadHours || catDisc?.workloadHours || 60;
        const nature = fromComplementary ? 'Complementar' : (catDisc?.nature || 'Optativa');

        allInProgressDisciplines.push({
          code: d.code,
          name: discName,
          workloadHours: hours,
          level: catDisc?.level || 0,
          nature,
          status: 'in_progress',
          grade: d.grade,
          situation: 'MATR',
          prerequisites: catDisc?.prerequisites || [],
          missingPrerequisites: [],
          equivalences: catDisc?.equivalences || [],
          unlockedDisciplines: [],
          isManuallyToggled: false,
        });
        inProgressCodeSet.add(d.code);
      }
    }

    // 7. Métricas de integralização
    const isNativeCurriculum =
      !profile.curriculumCode || profile.curriculumCode === curriculum.code;

    const totalMandatory = mandatoryList.length;
    const progressPct = totalMandatory > 0
      ? Math.round((completedMandatoryCount / totalMandatory) * 100)
      : 0;

    const officialTotalHours = isNativeCurriculum ? (profile.chTotalCurriculo ?? totalHours) : totalHours;
    const officialCompletedHours =
      isNativeCurriculum && profile.chTotalCurriculo && profile.chObrigatoriaPendente != null && profile.chOptativaPendente != null
        ? profile.chTotalCurriculo - (profile.chObrigatoriaPendente + profile.chOptativaPendente + (profile.chComplementarPendente || 0))
        : completedHours;
    const officialRemainingHours =
      isNativeCurriculum && profile.chTotalCurriculo && profile.chObrigatoriaPendente != null && profile.chOptativaPendente != null
        ? (profile.chObrigatoriaPendente + profile.chOptativaPendente + (profile.chComplementarPendente || 0))
        : Math.max(0, totalHours - completedHours);

    const metrics: FlowchartMetrics = {
      totalMandatoryDisciplines: totalMandatory,
      completedMandatoryDisciplines: completedMandatoryCount,
      mandatoryProgressPercentage: isNativeCurriculum ? (profile.percentualIntegralizado ?? progressPct) : progressPct,
      totalHours: officialTotalHours,
      completedHours: officialCompletedHours,
      remainingHours: officialRemainingHours,
      availableCount,
      inProgressCount: allInProgressDisciplines.length,
      ira: profile.ira,
      mp: profile.mp,
      chObrigatoriaTotal: totalHours,
      chObrigatoriaPendente: profile.chObrigatoriaPendente,
      chOptativaPendente: profile.chOptativaPendente,
      chTotalCurriculo: profile.chTotalCurriculo,
      chComplementarPendente: profile.chComplementarPendente,
      percentualIntegralizado: profile.percentualIntegralizado,
    };

    // 8. Disciplinas cursadas pelo aluno que são optativas / fora da grade obrigatória
    const mandatoryCodeSet = new Set(mandatoryList.map((m) => m.code));
    const electiveCompletedDisciplines = (profile.completedDisciplines || [])
      .filter((d) => d.isCompleted && !mandatoryCodeSet.has(d.code))
      .map((d) => {
        if (d.name && d.name !== d.code) return d;
        let resolvedName = d.name;
        if (allCurricula) {
          for (const curr of allCurricula) {
            const found = [
              ...(curr.mandatoryDisciplines || []),
              ...(curr.electiveDisciplines || []),
              ...(curr.complementaryDisciplines || []),
            ].find((cd) => cd.code === d.code);
            if (found?.name) {
              resolvedName = found.name;
              break;
            }
          }
        }
        return { ...d, name: resolvedName || d.code };
      });

    return {
      profile,
      curriculum,
      semesters,
      metrics,
      electiveCompletedDisciplines,
      inProgressDisciplines: allInProgressDisciplines,
    };
  }
}

/**
 * Avalia expressões de pré-requisitos lógicos do SIGAA com suporte a 'E', 'OU' e '()'.
 */
export function evaluatePrerequisiteExpression(
  exprRaw: string | undefined,
  fallbackCodes: string[],
  isSatisfiedFn: (code: string) => boolean,
  getDisciplineLabelFn: (code: string) => string = (c) => c,
): { isSatisfied: boolean; missing: string[] } {
  const cleanExpr = (exprRaw || '').trim();

  if (!cleanExpr || cleanExpr === '-') {
    if (!fallbackCodes || fallbackCodes.length === 0) {
      return { isSatisfied: true, missing: [] };
    }
    const missing: string[] = [];
    for (const code of fallbackCodes) {
      if (!isSatisfiedFn(code)) {
        missing.push(getDisciplineLabelFn(code));
      }
    }
    return { isSatisfied: missing.length === 0, missing };
  }

  // Tokenização da expressão
  const tokenRegex = /(\(|\)|(?:\bE\b)|(?:\bOU\b)|(?:[A-Z]{3}\d{4}))/gi;
  const tokens: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = tokenRegex.exec(cleanExpr)) !== null) {
    tokens.push(m[1].toUpperCase());
  }

  if (tokens.length === 0) {
    if (fallbackCodes.length === 0) return { isSatisfied: true, missing: [] };
    const missing = fallbackCodes.filter((c) => !isSatisfiedFn(c)).map(getDisciplineLabelFn);
    return { isSatisfied: missing.length === 0, missing };
  }

  let pos = 0;

  type ASTNode =
    | { type: 'CODE'; code: string }
    | { type: 'AND'; left: ASTNode; right: ASTNode }
    | { type: 'OR'; left: ASTNode; right: ASTNode };

  function parseOr(): ASTNode | null {
    let node = parseAnd();
    if (!node) return null;
    while (pos < tokens.length && tokens[pos] === 'OU') {
      pos++;
      const right = parseAnd();
      if (right) {
        node = { type: 'OR', left: node, right };
      }
    }
    return node;
  }

  function parseAnd(): ASTNode | null {
    let node = parseFactor();
    if (!node) return null;
    while (pos < tokens.length && (tokens[pos] === 'E' || (tokens[pos] !== 'OU' && tokens[pos] !== ')'))) {
      if (tokens[pos] === 'E') {
        pos++;
      }
      const right = parseFactor();
      if (right) {
        node = { type: 'AND', left: node, right };
      }
    }
    return node;
  }

  function parseFactor(): ASTNode | null {
    if (pos >= tokens.length) return null;
    const token = tokens[pos];
    if (token === '(') {
      pos++;
      const node = parseOr();
      if (pos < tokens.length && tokens[pos] === ')') {
        pos++;
      }
      return node;
    } else if (token !== ')' && token !== 'OU' && token !== 'E') {
      pos++;
      return { type: 'CODE', code: token };
    }
    return null;
  }

  const ast = parseOr();
  if (!ast) {
    return { isSatisfied: true, missing: [] };
  }

  function evalNode(node: ASTNode): { satisfied: boolean; missingList: string[] } {
    if (node.type === 'CODE') {
      const ok = isSatisfiedFn(node.code);
      return {
        satisfied: ok,
        missingList: ok ? [] : [getDisciplineLabelFn(node.code)],
      };
    }

    if (node.type === 'AND') {
      const leftRes = evalNode(node.left);
      const rightRes = evalNode(node.right);
      return {
        satisfied: leftRes.satisfied && rightRes.satisfied,
        missingList: [...leftRes.missingList, ...rightRes.missingList],
      };
    }

    if (node.type === 'OR') {
      const leftRes = evalNode(node.left);
      const rightRes = evalNode(node.right);
      if (leftRes.satisfied || rightRes.satisfied) {
        return { satisfied: true, missingList: [] };
      }

      if (node.left.type === 'CODE' && node.right.type === 'CODE') {
        return {
          satisfied: false,
          missingList: [`${leftRes.missingList[0]} ou ${rightRes.missingList[0]}`],
        };
      }

      if (leftRes.missingList.length <= rightRes.missingList.length) {
        return { satisfied: false, missingList: leftRes.missingList };
      } else {
        return { satisfied: false, missingList: rightRes.missingList };
      }
    }

    return { satisfied: true, missingList: [] };
  }

  const result = evalNode(ast);
  return {
    isSatisfied: result.satisfied,
    missing: result.satisfied ? [] : result.missingList,
  };
}
