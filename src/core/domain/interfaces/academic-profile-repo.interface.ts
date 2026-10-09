import type { StudentAcademicProfile } from '../entities/academic-profile';
import type { CurriculumStructure } from '../entities/course';
import type { SigaaCredentials } from '../entities/credential';

export interface SigaaHistoryRawResponse {
  pdfBase64?: string;
  matricula: string;
  nome?: string;
  curso: string;
  nivel: string;
  status: string;
  entrada: string;
  email?: string;
  ira?: number;
  mp?: number;
  chObrigatoriaPendente?: number;
  chOptativaPendente?: number;
  chTotalCurriculo?: number;
  chComplementarPendente?: number;
  percentualIntegralizado?: number;
}

export interface IAcademicProfileRepository {
  getProfile(): Promise<StudentAcademicProfile | null>;
  saveProfile(profile: StudentAcademicProfile): Promise<void>;
  clearProfile(): Promise<void>;
  getAllCurricula(): Promise<CurriculumStructure[]>;
  fetchSigaaHistory(creds: SigaaCredentials): Promise<SigaaHistoryRawResponse>;
}
