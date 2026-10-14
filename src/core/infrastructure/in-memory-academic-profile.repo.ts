import type { StudentAcademicProfile } from '../domain/entities/academic-profile';
import type { CurriculumStructure } from '../domain/entities/course';
import type { SigaaCredentials } from '../domain/entities/credential';
import type {
  IAcademicProfileRepository,
  SigaaHistoryRawResponse,
} from '../domain/interfaces/academic-profile-repo.interface';

const STORAGE_KEY = 'unb_aggregator_academic_profile_v1';

export class InMemoryAcademicProfileRepository implements IAcademicProfileRepository {
  private profileInMemory: StudentAcademicProfile | null = null;
  private curriculaCache: CurriculumStructure[] | null = null;

  async getProfile(): Promise<StudentAcademicProfile | null> {
    if (this.profileInMemory) {
      return this.profileInMemory;
    }

    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
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
      } catch {}
    }
  }

  async getAllCurricula(): Promise<CurriculumStructure[]> {
    if (this.curriculaCache && this.curriculaCache.length > 0) {
      return this.curriculaCache;
    }

    if (typeof fetch !== 'undefined') {
      try {
        const res = await fetch('/data/curricula.json');
        if (res.ok) {
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
              prerequisites?: string[];
              equivalences?: string[];
            }>;
            elective_disciplines?: Array<{
              code: string;
              name: string;
              workload_hours: number;
              level?: number | null;
              nature: 'Obrigatória' | 'Optativa' | 'Complementar';
              prerequisites?: string[];
              equivalences?: string[];
            }>;
            complementary_disciplines?: Array<{
              code: string;
              name: string;
              workload_hours: number;
              level?: number | null;
              nature: 'Obrigatória' | 'Optativa' | 'Complementar';
              prerequisites?: string[];
              equivalences?: string[];
            }>;
          }>;

          if (Array.isArray(raw)) {
            const mapDisc = (d: {
              code: string;
              name: string;
              workload_hours: number;
              level?: number | null;
              nature: 'Obrigatória' | 'Optativa' | 'Complementar';
              prerequisites?: string[];
              equivalences?: string[];
            }) => ({
              code: d.code,
              name: d.name,
              workloadHours: d.workload_hours,
              level: d.level ?? undefined,
              nature: d.nature,
              prerequisites: d.prerequisites || [],
              equivalences: d.equivalences || [],
            });

            this.curriculaCache = raw.map((c) => ({
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
            }));
            return this.curriculaCache;
          }
        }
      } catch (e) {
        console.warn('[InMemoryAcademicProfileRepository] Erro ao carregar /data/curricula.json:', e);
      }
    }

    return [];
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
