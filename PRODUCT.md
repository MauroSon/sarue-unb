# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Alunos de graduação da Universidade de Brasília (UnB), usuários principais. Situação: matrícula ativa, rotina espalhada entre plataformas acadêmicas (SIGAA para matrícula/horários, Aprender 3 para aulas e prazos), cada uma com login e notificação próprios. Trabalho do usuário: acompanhar avisos e prazos das disciplinas e montar a grade de matrícula sem cruzar abas manualmente.

Meta confirmada: distribuir o app para outros alunos da UnB — não é ferramenta de uso pessoal apenas. Onboarding, confiabilidade e polimento são requisitos de produto.

## Product Purpose

Desktop app que reúne as plataformas acadêmicas da UnB em um único feed integrado, seguro e rápido: posts e tarefas com prazo de SIGAA e Aprender 3, agregados e sincronizados, mais o "Monte sua Grade" — busca de turmas por departamento, geração de opções de horário sem conflito e grades salvas por semestre.

Sucesso: o aluno abre um app e sabe o que há de novo e o que vence, sem visitar cada plataforma; na matrícula, monta uma grade viável em minutos.

## Positioning

Agregação local-first com credenciais em cofre criptografado no próprio dispositivo (Stronghold) e dados em SQLite local, combinada com o solver de grade específico do modelo de horários da UnB (turnos M/T/N, códigos de horário, conflitos). Plataforma oficial nenhuma oferece as duas coisas juntas; um agregador em nuvem não poderia copiar a promessa de privacidade sem mudar de arquitetura.

## Operating Context

- Empacotado como app desktop via Tauri (UI web: React 19, Tailwind, Base UI); roda em desktop, não é site.
- Scrape/sync das plataformas com credenciais do próprio aluno; sincronização manual disparada pelo usuário.
- Calendário e vocabulário da UnB: departamentos, códigos de disciplina, turnos Matutino/Turno/Noturno, período letivo/semestre.
- Projeto único (sem monorepo): `src/core` (domínio/casos de uso/adapters), `src/components` (UI), `src-tauri` (Rust: scraping e commands).

## Capabilities and Constraints

Confirmado e funcional hoje:

- Onboarding de boas-vindas e fluxo de configuração de credenciais no Stronghold, com opção "explorar sem conectar".
- Feed unificado (posts e tarefas com `dueDate`, marcação de concluído), Dashboard, lista de Cursos, sincronização manual com registro de última sync.
- Monte sua Grade: departamentos, turmas raspadas (horário, professor, sala, vagas), solver de horários com detecção de conflito e preferência de turno, grades salvas por semestre.
- Tela de Settings.

Restrições e undecided (trabalho futuro não deve tratá-los como promessa):

- Plataformas confirmadas no momento: **SIGAA, Aprender 3 e Microsoft Teams** (via autenticação interativa institucional para turmas e avisos). MoodleMat removido da plataforma. Novas plataformas são escopo futuro.
- **Zero telemetria é o estado atual, não um compromisso permanente.** Telemetria anônima pode existir no futuro para melhorar a plataforma, sempre com consentimento do usuário e possibilidade de desativar. Não tratar "zero telemetria" como promessa eterna em copy novo.
- UI sempre em **português brasileiro**.

## Brand Commitments

- Nome: **UnB Aggregator**.
- Idioma da UI: pt-BR, sempre.
- Voz atual na copy: direta, informal-técnica, dirigida ao aluno ("suas plataformas acadêmicas reunidas").

## Evidence on Hand

- App funcional com todas as telas implementadas em `src/screens/`.
- Nenhum asset de marca além do bloco-logo "UnB" renderizado em componente; sem logo arquivo, sem testemunhos, métricas ou cases. Trabalho futuro **não deve fabricar** depoimentos, números de usuários ou provas sociais.

## Product Principles

1. **Os dados do aluno pertencem ao aluno.** Credenciais no cofre do dispositivo, dados locais; qualquer coleta futura é anônima, opt-in e reversível.
2. **Uma fonte só.** O valor é o aluno não precisar caçar informação em várias plataformas; tudo chega agregado, com prazo visível.
3. **Confiança antes de escala.** Pedir credenciais institucionais exige transparência e cuidado em cada tela que as menciona.
4. **Falar a língua do aluno.** pt-BR, vocabulário da UnB (departamento, turno, grade), sem jargão importado.
5. **Desktop de verdade.** App nativo, rápido, com atalhos e densidade de tela cheia — não um site encaixado numa janela.
