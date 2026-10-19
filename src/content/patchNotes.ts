/**
 * Patch notes do Saruê UnB.
 *
 * Como publicar uma nova versão:
 *  1. Atualize `version` em `src-tauri/tauri.conf.json` e `package.json`.
 *  2. Adicione um objeto NO TOPO do array `PATCH_NOTES` com a mesma versão.
 *
 * A entrada cuja `version` for igual à versão instalada do app recebe o selo
 * "Atual" automaticamente — nada mais precisa ser alterado.
 */

export interface PatchNotesEntry {
  /** Versão no formato semver, ex.: "0.1.0" — igual à versão do release. */
  version: string;
  /** Data de publicação, exibida como texto livre. */
  date: string;
  /** Título curto da versão. */
  title: string;
  /** Lista de novidades, melhorias e correções. */
  items: string[];
}

export const PATCH_NOTES: PatchNotesEntry[] = [
  {
    version: "0.1.0",
    date: "19/10/2026",
    title: "Lançamento inicial",
    items: [
      "Onboarding guiado com configuração das credenciais do SIGAA, Aprender 3 e Microsoft Teams, guardadas no cofre criptografado Stronghold do seu dispositivo — e opção de explorar o app sem conectar nada.",
      "Feed unificado: avisos e tarefas das suas plataformas numa fila só, com prazo em destaque, marcação de concluído e arquivamento.",
      "Início com o resumo do que chegou e o que vence.",
      "Lista de disciplinas do semestre com o feed de cada matéria.",
      "Monte sua Grade: busca de turmas por departamento, geração de opções de horário sem conflito, preferência de turno, grades salvas por semestre e exportação da grade como PNG.",
      "Meu Curso: perfil acadêmico, histórico escolar e matriz curricular da UnB.",
      "Calculadora de IRA com cenários para simular o seu coeficiente.",
      "Sincronização manual sob demanda, com registro da última sincronização.",
      "Atualização automática integrada: verifique, baixe e instale novas versões sem sair do app.",
      "Privacidade em primeiro lugar: tudo roda e fica no seu dispositivo, com zero telemetria.",
      "Código aberto sob licença Apache 2.0.",
    ],
  },
];
