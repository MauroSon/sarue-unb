import type {
  FlowchartData,
  FlowchartDiscipline,
  FlowchartMetrics,
  FlowchartSemester,
  StudentAcademicProfile,
} from '../domain/entities/academic-profile';
import type { CurriculumStructure } from '../domain/entities/course';

export class GetFlowchartUseCase {
  execute(curriculum: CurriculumStructure, profile: StudentAcademicProfile): FlowchartData {
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
    let inProgressCount = 0;

    for (const disc of mandatoryList) {
      const code = disc.code;
      const hours = disc.workloadHours || 60;
      totalHours += hours;

      const isCompleted = isCompletedOrEquivalent(code, disc.equivalences);
      const isEnrolled = inProgressCodes.has(code);
      const details = disciplineDetailsMap.get(code);

      // Avaliação de pré-requisitos pendentes
      const missingPrereqs: string[] = [];
      for (const prereq of disc.prerequisites || []) {
        const prereqObj = mandatoryList.find((m) => m.code === prereq);
        const prereqEquivs = prereqObj?.equivalences || [];
        if (!isCompletedOrEquivalent(prereq, prereqEquivs)) {
          // Busca o nome do pré-requisito no currículo se disponível
          missingPrereqs.push(prereqObj ? `${prereq} (${prereqObj.name})` : prereq);
        }
      }

      let status: FlowchartDiscipline['status'];
      if (isCompleted) {
        status = 'completed';
        completedMandatoryCount++;
        completedHours += hours;
      } else if (isEnrolled) {
        status = 'in_progress';
        inProgressCount++;
      } else if (missingPrereqs.length === 0) {
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
        missingPrerequisites: missingPrereqs,
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

    // 6. Métricas de integralização
    // A integralização oficial do SIGAA refere-se à matriz nativa do discente; ao
    // explorar outra estrutura curricular, as métricas são recalculadas nela.
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
      inProgressCount,
      ira: profile.ira,
      mp: profile.mp,
      chObrigatoriaPendente: profile.chObrigatoriaPendente,
      chOptativaPendente: profile.chOptativaPendente,
      chTotalCurriculo: profile.chTotalCurriculo,
      chComplementarPendente: profile.chComplementarPendente,
      percentualIntegralizado: profile.percentualIntegralizado,
    };

    // 7. Disciplinas cursadas pelo aluno que são optativas / fora da grade obrigatória
    const mandatoryCodeSet = new Set(mandatoryList.map((m) => m.code));
    const electiveCompletedDisciplines = (profile.completedDisciplines || []).filter(
      (d) => d.isCompleted && !mandatoryCodeSet.has(d.code)
    );

    return {
      profile,
      curriculum,
      semesters,
      metrics,
      electiveCompletedDisciplines,
    };
  }
}
