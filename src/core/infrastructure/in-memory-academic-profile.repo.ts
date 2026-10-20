import type { StudentAcademicProfile } from '../domain/entities/academic-profile';
import type { CurriculumStructure } from '../domain/entities/course';
import type { SigaaCredentials } from '../domain/entities/credential';
import type {
  IAcademicProfileRepository,
  SigaaHistoryRawResponse,
} from '../domain/interfaces/academic-profile-repo.interface';

const STORAGE_KEY = 'sarue_academic_profile_v1';
const LEGACY_STORAGE_KEY = 'unb_aggregator_academic_profile_v1';

let sharedCurriculaCache: CurriculumStructure[] | null = null;
let sharedCurriculaPromise: Promise<CurriculumStructure[]> | null = null;
export const sharedDisciplineNameMap = new Map<string, string>();

export class InMemoryAcademicProfileRepository implements IAcademicProfileRepository {
  private profileInMemory: StudentAcademicProfile | null = null;

  async getProfile(): Promise<StudentAcademicProfile | null> {
    if (this.profileInMemory) {
      return this.profileInMemory;
    }

    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as StudentAcademicProfile;
          this.profileInMemory = parsed;
          return parsed;
        }
      } catch {}
    }

    return null;
  }

  async saveProfile(profile: StudentAcademicProfile): Promise<void> {
    this.profileInMemory = profile;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } catch {}
    }
  }

  async clearProfile(): Promise<void> {
    this.profileInMemory = null;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {}
    }
  }

  async getAllCurricula(): Promise<CurriculumStructure[]> {
    if (sharedCurriculaCache && sharedCurriculaCache.length > 0) {
      return sharedCurriculaCache;
    }

    if (sharedCurriculaPromise) {
      return sharedCurriculaPromise;
    }

    sharedCurriculaPromise = (async () => {
      if (typeof fetch !== 'undefined') {
        const candidateUrls = [
          '/data/curricula.json',
          'https://kalebhenrique.github.io/sarue-unb/data/curricula.json',
          'https://raw.githubusercontent.com/kalebhenrique/sarue-unb/gh-pages/data/curricula.json',
        ];

        for (const url of candidateUrls) {
          try {
            const res = await fetch(url);
            if (!res.ok) continue;

            const raw = (await res.json()) as Array<{
              id: string;
              course_id: string;
              course_name: string;
              code: string;
              created_year?: string | null;
              status: string;
              shift?: string | null;
              total_hours?: number | null;
              mandatory_disciplines?: Array<{
                code: string;
                name: string;
                workload_hours: number;
                level?: number | null;
                nature: 'Obrigatória' | 'Optativa' | 'Complementar';
                prerequisites_raw?: string | null;
                prerequisites?: string[];
                equivalences_raw?: string | null;
                equivalences?: string[];
              }>;
              elective_disciplines?: Array<{
                code: string;
                name: string;
                workload_hours: number;
                level?: number | null;
                nature: 'Obrigatória' | 'Optativa' | 'Complementar';
                prerequisites_raw?: string | null;
                prerequisites?: string[];
                equivalences_raw?: string | null;
                equivalences?: string[];
              }>;
              complementary_disciplines?: Array<{
                code: string;
                name: string;
                workload_hours: number;
                level?: number | null;
                nature: 'Obrigatória' | 'Optativa' | 'Complementar';
                prerequisites_raw?: string | null;
                prerequisites?: string[];
                equivalences_raw?: string | null;
                equivalences?: string[];
              }>;
            }>;

            if (Array.isArray(raw) && raw.length > 0) {
              const mapDisc = (d: {
                code: string;
                name: string;
                workload_hours: number;
                level?: number | null;
                nature: 'Obrigatória' | 'Optativa' | 'Complementar';
                prerequisites_raw?: string | null;
                prerequisites?: string[];
                equivalences_raw?: string | null;
                equivalences?: string[];
              }) => {
                if (d.code && d.name && !sharedDisciplineNameMap.has(d.code)) {
                  sharedDisciplineNameMap.set(d.code, d.name);
                }
                return {
                  code: d.code,
                  name: d.name,
                  workloadHours: d.workload_hours,
                  level: d.level ?? undefined,
                  nature: d.nature,
                  prerequisitesRaw: d.prerequisites_raw ?? undefined,
                  prerequisites: d.prerequisites || [],
                  equivalencesRaw: d.equivalences_raw ?? undefined,
                  equivalences: d.equivalences || [],
                };
              };

              const mapped: CurriculumStructure[] = [];
              const CHUNK_SIZE = 25;

              for (let i = 0; i < raw.length; i += CHUNK_SIZE) {
                const slice = raw.slice(i, i + CHUNK_SIZE);
                for (const c of slice) {
                  mapped.push({
                    id: c.id,
                    courseId: c.course_id,
                    courseName: c.course_name,
                    code: c.code,
                    createdYear: c.created_year ?? undefined,
                    status: c.status,
                    shift: c.shift ?? undefined,
                    totalHours: c.total_hours ?? undefined,
                    mandatoryDisciplines: (c.mandatory_disciplines || []).map(mapDisc),
                    electiveDisciplines: (c.elective_disciplines || []).map(mapDisc),
                    complementaryDisciplines: (c.complementary_disciplines || []).map(mapDisc),
                  });
                }
                if (i + CHUNK_SIZE < raw.length) {
                  await new Promise((resolve) => setTimeout(resolve, 0));
                }
              }

              sharedCurriculaCache = mapped;
              return mapped;
            }
          } catch (e) {
            console.warn(`[InMemoryAcademicProfileRepository] Erro ao carregar currículos de ${url}:`, e);
          }
        }
      }

      return [];
    })();

    try {
      return await sharedCurriculaPromise;
    } finally {
      sharedCurriculaPromise = null;
    }
  }

  async fetchSigaaHistory(creds: SigaaCredentials): Promise<SigaaHistoryRawResponse> {
    return {
      matricula: creds.matricula,
      nome: 'Discente UnB',
      curso: 'ENGENHARIA DE COMPUTAÇÃO',
      nivel: 'GRADUAÇÃO',
      status: 'ATIVO',
      entrada: '2022.1',
    };
  }
}
