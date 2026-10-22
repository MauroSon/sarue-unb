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
    version: "0.2.0",
    date: "21/10/2026",
    title: "Gerenciamento de Currículo e Grades por Semestre",
    items: [
      "Editor de currículo: adicione, edite ou busque disciplinas no catálogo da UnB.",
      "Optativas de interesse destacadas em lilás tanto na lista quanto no mapa.",
      "Envio direto de disciplinas do currículo para o Montar Grade.",
      "Grades salvas de forma independente para cada semestre.",
      "Inicialização automática com o sistema nas Configurações.",
      "Alerta de última semana para trancamento parcial e geral.",
      "Notas de matérias equivalentes visíveis diretamente no fluxograma.",
    ],
  },
  {
    version: "0.1.1",
    date: "21/10/2026",
    title: "Melhorias de UI, UX e estabilidade",
    items: [
      "Feed: ordenação corrigida com itens recentes primeiro.",
      "Disciplinas: cabeçalho padronizado e carregamento com skeleton.",
      "Configurações: tecla Enter para salvar credenciais.",
      "Teams: login concentrado nas Configurações.",
      "Aprender 3: ignora automaticamente turmas institucionais.",
      "Notificação toast ao concluir sincronização.",
      "Windows: correções em links externos e campos de senha.",
    ],
  },
  {
    version: "0.1.0",
    date: "19/10/2026",
    title: "Lançamento inicial",
    items: [
      "Cofre seguro local para SIGAA, Aprender 3 e Teams.",
      "Feed integrado de avisos, tarefas e prazos.",
      "Montador de Grade com resolução de conflitos e exportação PNG.",
      "Meu Curso: fluxograma interativo, pré-requisitos e histórico.",
      "Calculadora de IRA com simulação de notas futuras.",
      "Sincronização sob demanda e atualizador integrado.",
    ],
  },
];
