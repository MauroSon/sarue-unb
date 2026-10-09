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
          // Corrige perfil anteriormente salvo com 1741/3
          if (
            (parsed.matricula === '221020904' || parsed.courseName?.toUpperCase().includes('COMPUTAÇÃO')) &&
            parsed.curriculumCode === '1741/3'
          ) {
            parsed.curriculumCode = '1741/1';
            parsed.curriculumId = '354';
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            } catch {}
          }
          this.profileInMemory = parsed;
          return parsed;
        }
      } catch {}
    }

    // Perfil inicial de demonstração (Engenharia de Computação)
    return {
      matricula: '221020904',
      studentName: 'Discente UnB',
      courseName: 'ENGENHARIA DE COMPUTAÇÃO',
      degree: 'Bacharelado',
      shift: 'DIURNO',
      level: 'GRADUAÇÃO',
      admissionYear: '2022.1',
      curriculumCode: '1741/1',
      curriculumId: '354',
      completedDisciplines: [
        { code: 'CIC0004', name: 'ALGORITMOS E PROGRAMAÇÃO DE COMPUTADORES', workloadHours: 90, grade: 'MS', situation: 'APR', isCompleted: true },
        { code: 'CIC0188', name: 'INTRODUÇÃO À ENGENHARIA DE COMPUTAÇÃO', workloadHours: 30, grade: 'SS', situation: 'APR', isCompleted: true },
        { code: 'MAT0025', name: 'CÁLCULO 1', workloadHours: 90, grade: 'MS', situation: 'APR', isCompleted: true },
        { code: 'MAT0031', name: 'INTRODUCAO A ALGEBRA LINEAR', workloadHours: 60, grade: 'MS', situation: 'APR', isCompleted: true },
        { code: 'IFD0171', name: 'FISICA 1', workloadHours: 60, grade: 'MM', situation: 'APR', isCompleted: true },
        { code: 'IFD0173', name: 'FISICA 1 EXPERIMENTAL', workloadHours: 30, grade: 'MM', situation: 'APR', isCompleted: true },
        { code: 'CIC0090', name: 'ESTRUTURAS DE DADOS', workloadHours: 60, grade: 'MM', situation: 'APR', isCompleted: true },
        { code: 'EST0023', name: 'PROBABILIDADE E ESTATÍSTICA', workloadHours: 60, grade: 'MM', situation: 'APR', isCompleted: true },
        { code: 'MAT0026', name: 'CÁLCULO 2', workloadHours: 90, grade: 'MM', situation: 'APR', isCompleted: true },
        { code: 'CIC0234', name: 'MÉTODOS DE PROGRAMAÇÃO', workloadHours: 60, grade: 'SS', situation: 'APR', isCompleted: true },
        { code: 'MAT0027', name: 'CÁLCULO 3', workloadHours: 90, grade: 'MM', situation: 'APR', isCompleted: true },
        { code: 'ENE0039', name: 'SISTEMAS DIGITAIS', workloadHours: 60, grade: 'SS', situation: 'APR', isCompleted: true },
        { code: 'ENE0040', name: 'LABORATÓRIO DE SISTEMAS DIGITAIS', workloadHours: 30, grade: 'SS', situation: 'APR', isCompleted: true },
        { code: 'CIC0197', name: 'TÉCNICAS DE PROGRAMAÇÃO 1', workloadHours: 60, grade: 'MS', situation: 'APR', isCompleted: true },
        { code: 'CIC0093', name: 'LINGUAGENS DE PROGRAMAÇÃO', workloadHours: 60, grade: 'MS', situation: 'APR', isCompleted: true },
        { code: 'CIC0105', name: 'ENGENHARIA DE SOFTWARE', workloadHours: 60, grade: 'MM', situation: 'APR', isCompleted: true },
        { code: 'CIC0189', name: 'PROJETO E ANÁLISE DE ALGORITMOS', workloadHours: 60, grade: 'MS', situation: 'APR', isCompleted: true },
        { code: 'CIC0235', name: 'TELEINFORMÁTICA E REDES 1', workloadHours: 60, grade: 'MM', situation: 'APR', isCompleted: true },
        { code: 'ENE0056', name: 'SISTEMAS MICROPROCESSADOS', workloadHours: 60, grade: 'MM', situation: 'APR', isCompleted: true },
        { code: 'CIC0099', name: 'ORGANIZAÇÃO E ARQUITETURA DE COMPUTADORES', workloadHours: 60, situation: 'MATR', isCompleted: false },
        { code: 'MAT0053', name: 'CÁLCULO NUMÉRICO', workloadHours: 60, situation: 'MATR', isCompleted: false },
      ],
      manualCompletedCodes: [],
      manualUncompletedCodes: [],
      updatedAt: new Date().toISOString(),
      ira: 3.6238,
      mp: 3.5493,
      chObrigatoriaPendente: 990,
      chOptativaPendente: 240,
      chTotalCurriculo: 3480,
      chComplementarPendente: 0,
      percentualIntegralizado: 65.0,
    };
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
