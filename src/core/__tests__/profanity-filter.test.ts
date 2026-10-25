import { describe, it, expect } from 'vitest';
import {
  censorProfanities,
  sanitizeEvaluationProfanities,
} from '../domain/utils/profanity-filter';
import {
  crossReferenceEvaluationsWithSigaa,
  type ProfessorEvaluation,
} from '../domain/entities/professor-evaluation';

describe('Filtro de Palavrões (Profanity Filter)', () => {
  describe('censorProfanities', () => {
    it('deve censurar palavras de baixo calão comuns substituindo por asteriscos', () => {
      expect(censorProfanities('Essa prova foi uma merda')).toBe(
        'Essa prova foi uma *****'
      );
      expect(censorProfanities('Que aula chata pra porra')).toBe(
        'Que aula chata pra *****'
      );
      expect(censorProfanities('Professor do caralho')).toBe(
        'Professor do *******'
      );
      expect(censorProfanities('Conteúdo muito foda')).toBe(
        'Conteúdo muito ****'
      );
      expect(censorProfanities('Achei uma bosta')).toBe(
        'Achei uma *****'
      );
      expect(censorProfanities('Aquele arrombado não ajudou')).toBe(
        'Aquele ********* não ajudou'
      );
      expect(censorProfanities('Não deu cacete de suporte')).toBe(
        'Não deu ****** de suporte'
      );
    });

    it('deve ser insensível a maiúsculas e minúsculas (case-insensitive)', () => {
      expect(censorProfanities('MERDA de prova')).toBe('***** de prova');
      expect(censorProfanities('CaRaLhO de matéria')).toBe('******* de matéria');
      expect(censorProfanities('pOrRa')).toBe('*****');
    });

    it('deve censurar variações com acentuação e flexões', () => {
      expect(censorProfanities('Vá tomar no cú')).toBe('** ***** ** **');
      expect(censorProfanities('Professor otário')).toBe('Professor ******');
      expect(censorProfanities('Gente escrota')).toBe('Gente *******');
      expect(censorProfanities('Fodeu tudo')).toBe('***** tudo');
      expect(censorProfanities('Ficou fodido')).toBe('Ficou ******');
    });

    it('deve censurar expressões compostas e siglas populares', () => {
      expect(censorProfanities('Ele é um filho da puta')).toBe(
        'Ele é um ***** ** ****'
      );
      expect(censorProfanities('Esse fdp não passou')).toBe(
        'Esse *** não passou'
      );
      expect(censorProfanities('Prova muito difícil pqp')).toBe(
        'Prova muito difícil ***'
      );
      expect(censorProfanities('Manda esse cara se foder')).toBe(
        'Manda esse cara se *****'
      );
      expect(censorProfanities('Vai se foder')).toBe(
        '*** ** *****'
      );
      expect(censorProfanities('Pau no cu de quem fez a lista')).toBe(
        '*** ** ** de quem fez a lista'
      );
    });

    it('NÃO deve censurar falsos positivos (Efeito Scunthorpe)', () => {
      // Palavras legítimas que contêm sequências como 'puta', 'cu', 'cacete', 'bosta', etc.
      expect(censorProfanities('Meu computador quebrou')).toBe(
        'Meu computador quebrou'
      );
      expect(censorProfanities('Vamos discutir a matéria em sala')).toBe(
        'Vamos discutir a matéria em sala'
      );
      expect(censorProfanities('Vaga muito disputada pelos alunos')).toBe(
        'Vaga muito disputada pelos alunos'
      );
      expect(censorProfanities('Recursos e materiais do curso')).toBe(
        'Recursos e materiais do curso'
      );
      expect(censorProfanities('Chegamos a um acordo sobre as datas')).toBe(
        'Chegamos a um acordo sobre as datas'
      );
      expect(censorProfanities('O custo do livro é alto')).toBe(
        'O custo do livro é alto'
      );
      expect(censorProfanities('Preciso escutar a gravação')).toBe(
        'Preciso escutar a gravação'
      );
      expect(censorProfanities('Use o capacete no laboratório')).toBe(
        'Use o capacete no laboratório'
      );
      expect(censorProfanities('A pasta de exercícios')).toBe(
        'A pasta de exercícios'
      );
      expect(censorProfanities('Excelente capacidade de ensino')).toBe(
        'Excelente capacidade de ensino'
      );
    });
  });

  describe('sanitizeEvaluationProfanities', () => {
    it('deve higienizar todos os campos textuais abertos da avaliação', () => {
      const dirtyEvaluation: ProfessorEvaluation = {
        id: 'eval-1',
        timestamp: '27/02/2025 21:37:15',
        createdAtIso: '2025-02-27T21:37:15.000Z',
        campus: 'Darcy Ribeiro',
        campusRaw: 'Darcy',
        discipline: 'CIC0004 - ALGORITMOS',
        modality: 'Presencial',
        semester: '2024/2',
        department: 'DEPTO CIÊNCIAS DA COMPUTAÇÃO',
        professor: 'Daniel Porto',
        didaticaScore: 10,
        didaticaRaw: '10',
        difficulty: 'Médio',
        workload: 'Moderada',
        material: 'Material uma merda',
        recommendation: 'nao',
        recommendationRaw: 'Não',
        feedback: 'Professor fdp, prova do caralho de difícil, não explica porra nenhuma.',
        evaluationMethods: 'Provas e projetos fodidos',
        hasMonitor: 'Sim',
        attendance: 'Tranquilo',
        attendanceStrictness: 'tranquilo',
        outcome: 'Fodeu, reprovei',
        caresAboutStudents: 'Não se importa nada com esse bando de otários',
        learnedContent: 'Aprendi bosta nenhuma',
      };

      const sanitized = sanitizeEvaluationProfanities(dirtyEvaluation);

      expect(sanitized.feedback).toBe(
        'Professor ***, prova do ******* de difícil, não explica ***** nenhuma.'
      );
      expect(sanitized.material).toBe('Material uma *****');
      expect(sanitized.evaluationMethods).toBe('Provas e projetos *******');
      expect(sanitized.outcome).toBe('*****, reprovei');
      expect(sanitized.caresAboutStudents).toBe(
        'Não se importa nada com esse bando de *******'
      );
      expect(sanitized.learnedContent).toBe('Aprendi ***** nenhuma');
      // Metadados e identificadores devem permanecer intocados
      expect(sanitized.id).toBe('eval-1');
      expect(sanitized.professor).toBe('Daniel Porto');
      expect(sanitized.didaticaScore).toBe(10);
    });
  });

  describe('Integração com crossReferenceEvaluationsWithSigaa', () => {
    it('deve censurar palavrões automaticamente durante o cruzamento com o SIGAA', () => {
      const rawEvals: ProfessorEvaluation[] = [
        {
          id: 'eval-1',
          timestamp: '27/02/2025 21:37:15',
          createdAtIso: '2025-02-27T21:37:15.000Z',
          campus: 'Darcy Ribeiro',
          campusRaw: 'Darcy',
          discipline: 'CIC0004',
          modality: 'Presencial',
          semester: '2024/2',
          department: 'CIC',
          professor: 'Daniel de Paula Porto',
          didaticaScore: 9,
          didaticaRaw: '9',
          difficulty: 'Médio',
          workload: 'Moderada',
          material: 'Suficiente',
          recommendation: 'sim',
          recommendationRaw: 'Sim',
          feedback: 'O professor é foda e explica muito bem, mas a prova foi do caralho de difícil.',
          evaluationMethods: 'Provas',
          hasMonitor: 'Sim',
          attendance: 'Tranquilo',
          attendanceStrictness: 'tranquilo',
          outcome: 'Passei',
          caresAboutStudents: 'Muito',
          learnedContent: 'Sim',
        },
      ];

      const crossed = crossReferenceEvaluationsWithSigaa(rawEvals, [], [], []);
      expect(crossed).toHaveLength(1);
      expect(crossed[0].feedback).toBe(
        'O professor é **** e explica muito bem, mas a prova foi do ******* de difícil.'
      );
    });
  });
});
