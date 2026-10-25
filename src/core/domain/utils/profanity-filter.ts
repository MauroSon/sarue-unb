import type { ProfessorEvaluation } from '../entities/professor-evaluation';

/**
 * Padrões de palavras de baixo calão, ofensas e gírias chulas no português brasileiro.
 *
 * Utiliza fronteiras Unicode `(?<![\p{L}\p{N}])` e `(?![\p{L}\p{N}])` para garantir
 * que palavras legítimas com sequências similares (ex.: "computador", "discutir",
 * "recurso", "capacete") NUNCA sejam falsamente censuradas (Efeito Scunthorpe).
 */
const PROFANITY_PATTERNS: string[] = [
  // Expressões compostas (avaliadas primeiro para casamento completo)
  String.raw`filh[oa]s?\s+d[aeo]\s+puta`,
  String.raw`pau\s+no\s+c[uú]`,
  String.raw`(?:v[aá](?:i)?\s+)?tomar\s+no\s+c[uú]`,
  String.raw`vai\s+(?:se|te)\s+fod(?:er|e)`,
  String.raw`vai\s+(?:se|te)\s+fud(?:er|e)`,
  String.raw`vai\s+(?:se|te)\s+lascar`,
  String.raw`chup(?:a|ar)\s+(?:o\s+)?c[uú]`,

  // Siglas e abreviações comuns
  String.raw`f\.?d\.?p\.?`,
  String.raw`p\.?q\.?p\.?`,
  String.raw`v\.?t\.?n\.?c\.?`,
  String.raw`t\.?n\.?c\.?`,
  String.raw`v\.?s\.?f\.?`,
  String.raw`krl(?:h[oa])?`,

  // Termos individuais e variações flexionais
  String.raw`arrombad[oa]s?`,
  String.raw`babac[ao]s?`,
  String.raw`babaquices?`,
  String.raw`bostas?`,
  String.raw`bucet[as]`,
  String.raw`bucet[aã]o`,
  String.raw`bucetinhas?`,
  String.raw`cacet[es]`,
  String.raw`cacetas?`,
  String.raw`caralh[oa]s?`,
  String.raw`caralhad[as]`,
  String.raw`caralhet[as]`,
  String.raw`carai`,
  String.raw`caraio`,
  String.raw`c[uú]s?`,
  String.raw`cuz[aã]o`,
  String.raw`cuz[oõ]es`,
  String.raw`cuzinhos?`,
  String.raw`escrot[oa]s?`,
  String.raw`escrotices?`,
  String.raw`fod[ae]s?`,
  String.raw`fod(?:er|em|eu|i|am|a|e)(?:em)?`,
  String.raw`fodid[oa]s?`,
  String.raw`fodendo`,
  String.raw`fod[aã]o`,
  String.raw`fud(?:er|em|eu|i|am|a|e)(?:em)?`,
  String.raw`fudid[oa]s?`,
  String.raw`fudendo`,
  String.raw`merdas?`,
  String.raw`ot[aá]ri[oa]s?`,
  String.raw`picas?`,
  String.raw`pic[aã]o`,
  String.raw`porras?`,
  String.raw`put[ao]s?`,
  String.raw`putarias?`,
  String.raw`putinhas?`,
  String.raw`put[aã]o`,
  String.raw`vadi[as]`,
  String.raw`viad[oa]s?`,
  String.raw`viadinh[oa]s?`,
  String.raw`viad[aã]o`,
  String.raw`xoxotas?`,
];

const UNICODE_PROFANITY_REGEX = new RegExp(
  `(?<![\\p{L}\\p{N}])(?:${PROFANITY_PATTERNS.join('|')})(?![\\p{L}\\p{N}])`,
  'gui'
);

/**
 * Censura palavras e expressões de baixo calão substituindo caracteres por asteriscos (`*`),
 * preservando espaços em branco e a cadência do texto.
 */
export function censorProfanities(text: string): string {
  if (!text || typeof text !== 'string') return text;
  return text.replace(UNICODE_PROFANITY_REGEX, (match) =>
    match.replace(/\S/g, '*')
  );
}

/**
 * Higieniza todos os campos de texto livre preenchidos por discentes em uma avaliação,
 * censurando quaisquer termos ofensivos antes da exibição e persistência.
 */
export function sanitizeEvaluationProfanities(
  evaluation: ProfessorEvaluation
): ProfessorEvaluation {
  return {
    ...evaluation,
    feedback: censorProfanities(evaluation.feedback),
    outcome: censorProfanities(evaluation.outcome),
    caresAboutStudents: censorProfanities(evaluation.caresAboutStudents),
    evaluationMethods: censorProfanities(evaluation.evaluationMethods),
    learnedContent: censorProfanities(evaluation.learnedContent),
    material: censorProfanities(evaluation.material),
  };
}
