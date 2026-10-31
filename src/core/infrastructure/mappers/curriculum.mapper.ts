import type { CurriculumDiscipline, CurriculumStructure } from '../../domain/entities/course';

export const sharedDisciplineNameMap = new Map<string, string>();

export interface RawCurriculumDisciplineDto {
  code: string;
  name: string;
  workload_hours: number;
  level?: number | null;
  nature: string;
  prerequisites_raw?: string | null;
  prerequisites?: string[];
  equivalences_raw?: string | null;
  equivalences?: string[];
}

export interface RawCurriculumStructureDto {
  id: string;
  course_id: string;
  course_name: string;
  code: string;
  created_year?: string | null;
  status: string;
  shift?: string | null;
  total_hours?: number | null;
  min_elective_hours?: number | null;
  min_complementary_hours?: number | null;
  mandatory_disciplines?: RawCurriculumDisciplineDto[];
  elective_disciplines?: RawCurriculumDisciplineDto[];
  complementary_disciplines?: RawCurriculumDisciplineDto[];
}

export function mapCurriculumDisciplineDto(
  d: RawCurriculumDisciplineDto,
): CurriculumDiscipline {
  if (d.code && d.name && !sharedDisciplineNameMap.has(d.code)) {
    sharedDisciplineNameMap.set(d.code, d.name);
  }
  return {
    code: d.code,
    name: d.name,
    workloadHours: d.workload_hours,
    level: d.level ?? undefined,
    nature: d.nature as CurriculumDiscipline['nature'],
    prerequisitesRaw: d.prerequisites_raw ?? undefined,
    prerequisites: d.prerequisites || [],
    equivalencesRaw: d.equivalences_raw ?? undefined,
    equivalences: d.equivalences || [],
  };
}

export function mapCurriculumStructureDto(
  c: RawCurriculumStructureDto,
): CurriculumStructure {
  return {
    id: c.id,
    courseId: c.course_id,
    courseName: c.course_name,
    code: c.code,
    createdYear: c.created_year ?? undefined,
    status: c.status,
    shift: c.shift ?? undefined,
    totalHours: c.total_hours ?? undefined,
    minElectiveHours: c.min_elective_hours ?? undefined,
    minComplementaryHours: c.min_complementary_hours ?? undefined,
    mandatoryDisciplines: (c.mandatory_disciplines || []).map(
      mapCurriculumDisciplineDto,
    ),
    electiveDisciplines: (c.elective_disciplines || []).map(
      mapCurriculumDisciplineDto,
    ),
    complementaryDisciplines: (c.complementary_disciplines || []).map(
      mapCurriculumDisciplineDto,
    ),
  };
}

export function mapCurriculaDtos(
  dtos: RawCurriculumStructureDto[],
): CurriculumStructure[] {
  return dtos.map(mapCurriculumStructureDto);
}
