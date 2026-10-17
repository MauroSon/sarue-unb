export interface SigaaCredentials {
  matricula: string;
  senha: string;
}

export interface Aprender3Credentials {
  cpf: string;
  senha: string;
}

export interface TeamsCredentials {
  isConnected: boolean;
  email?: string;
  connectedAt?: string;
}

export interface AllPlatformCredentials {
  sigaa?: SigaaCredentials;
  aprender3?: Aprender3Credentials;
  teams?: TeamsCredentials;
}

// Backward-compatible type
export type Credential = SigaaCredentials;

export function validateMatricula(matricula: string): boolean {
  const trimmed = matricula.trim();
  return /^\d{6,12}$/.test(trimmed);
}

export function validateCpf(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return false;
  // Rejeita sequências repetidas como 11111111111
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
  return true;
}

export function validateSenha(senha: string): boolean {
  return senha.length >= 4;
}

export function formatCpf(cpf: string): string {
  const clean = cpf.replace(/\D/g, '').slice(0, 11);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

export function validateUnbEmail(email: string): boolean {
  const clean = email.trim().toLowerCase();
  if (!clean) return true; // Se vazio, pode ser preenchido/detectado no login interativo
  return /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)*unb\.br$/.test(clean);
}

