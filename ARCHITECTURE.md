# Arquitetura

Clean Architecture (portas e adapters) com um núcleo TypeScript e um driver Rust, integrada a uma arquitetura de dados estáticos assíncronos via CDN.
A regra de dependência é uma só: **as setas apontam para dentro**.

```
            ┌──────────────────────────────────────────────┐
            │              src/ (apresentação)             │
            │  screens/  components/  hooks/  context/     │
            └──────────────────────┬───────────────────────┘
                                   │ usa casos de uso
            ┌──────────────────────▼───────────────────────┐
            │               src/core/                      │
            │                                              │
            │  application/  (use cases)                   │
            │      │ depende apenas de                     │
            │      ▼                                       │
            │  domain/       (entidades + portas)          │
            │      ▲                                       │
            │      │ implementa                            │
            │  infrastructure/ (adapters: Tauri, in-memory)│
            └──────────────────────┬───────────────────────┘
                                   │ chama commands
            ┌──────────────────────▼───────────────────────┐
            │        src-tauri/ (Rust: driver de I/O)      │
            │  client estático CDN / solver / auth discente│
            └──────────────────────┬───────────────────────┘
                                   │ consome JSONs estáticos
            ┌──────────────────────▼───────────────────────┐
            │     CDN / GitHub Pages (branch gh-pages)     │
            │  departments.json | classes.json             │
            │  courses.json     | curricula.json           │
            └──────────────────────▲───────────────────────┘
                                   │ publica dados
            ┌──────────────────────┴───────────────────────┐
            │   Pipelines CI / GitHub Actions (.github/)   │
            │   Scrapers standalone (src/scrapers/)        │
            └──────────────────────────────────────────────┘
```

Nada em `domain/` depende de plataforma. Nada em `application/` depende de
infraestrutura. O código de apresentação nunca importa adapters: fala com o
core através de use cases. `src-tauri` não conhece o core.

## Mapa do código

```
src/
  core/
    domain/          entidades (Course, FeedItem, Grade...) + portas (I*Repository)
    application/     um use case por operação do produto
    infrastructure/  adapters Tauri + in-memory + bindings IPC gerados
    container.ts     composition root
    index.ts         API pública do core (barrel)
  components/        UI: ui/ (primitivos estilo shadcn) + feed/ + grade/
  screens/           telas
  hooks/  context/   cola React
  lib/               utilitários (cn, openExternalUrl)
  scrapers/          scrapers standalone SIGAA (turmas, cursos, estruturas curriculares)
src-tauri/           driver HTTP CDN, solver de horários, auth discente, commands IPC
.github/workflows/   cron jobs de scraping e deploy de dados na branch gh-pages
```

## Arquitetura de Dados Estáticos Assíncronos

Para resolver problemas históricos de lentidão, bloqueios de IP e instabilidade de scraping
dentro do client desktop, a extração de dados públicos do SIGAA foi desacoplada do runtime Tauri:

1. **Scrapers Standalone (`src/scrapers/`)**:
   - `grade-scraper.ts`: Realiza a navegação HTTP pura do SIGAA (cookies JSESSIONID e ViewState)
     para extrair departamentos e todas as turmas de graduação ofertadas com horários, vagas e salas.
   - `courses-scraper.ts`: Cataloga todos os 150+ cursos de graduação da UnB e suas matrizes
     curriculares ativas, detalhando disciplinas obrigatórias por semestre/nível, optativas,
     cargas horárias, pré-requisitos e equivalências.
   - Executáveis de forma independente com `pnpm run scrape:grade` e `pnpm run scrape:courses`.

2. **Automação no GitHub Actions (`.github/workflows/`)**:
   - `scrape-grade.yml`: Cron job diário (05:00 UTC) e manual via `workflow_dispatch` para atualizar turmas.
   - `scrape-courses.yml`: Cron job mensal (dia 1 às 04:00 UTC) e manual para atualizar cursos e currículos.
   - Ambos publicam exclusivamente em uma **branch órfã separada (`gh-pages`)** na pasta `/data`,
     garantindo histórico limpo na branch principal (`main`) e servindo os arquivos via CDN público.

3. **Consumo no Client Rust/Tauri**:
   - O backend em Rust não faz mais parsing de HTML nem submissão de formulários JSF de turmas.
   - Faz apenas requisições HTTP GET diretas aos JSONs estáticos (`departments.json`, `classes.json`,
     `courses.json`, `curricula.json`), mantendo cache em memória durante a sessão e filtrando
     os dados localmente com tempo de resposta em microssegundos.
   - Em caso de falha de conexão ou modo offline, entra em ação o fallback semente embutido.

## Portas e adapters

O `container.ts` é o único arquivo que conhece implementações concretas.
A escolha do adapter acontece por ambiente, não dentro dos adapters:

| Porta | Ambiente Tauri | Navegador (dev/preview) |
|---|---|---|
| `ICredentialsRepository` | `StrongholdCredentialsRepository` | o próprio adapter cai para store em memória |
| `ISyncRepository` | `TauriSyncRepository` | `InMemorySyncRepository` (dados demo) |
| `IFeedRepository` | `SqliteFeedRepository` | `InMemoryFeedRepository` |
| `IGradeRepository` | `TauriGradeRepository` | `InMemoryGradeRepository` (dados demo) |

Testes injetam os próprios repositórios via `ContainerOverrides` — nenhum use
case toca rede ou banco.

## IPC Rust e bindings gerados

A superfície IPC tem fonte única: os commands anotados em `src-tauri/src/lib.rs`
(`collect_commands!`). Os bindings TypeScript são gerados a partir deles:

```sh
cargo test export_bindings   # gera src/core/infrastructure/bindings.ts
```

Os adapters TS importam `commands` de `bindings.ts` — nunca chamam `invoke`
com string solta. Tipos novos no lado Rust (derive `specta::Type`) aparecem
no TS na próxima geração.

**Commands Disponíveis:**
- `get_sigaa_departments`: Lista departamentos UnB.
- `scrape_sigaa_classes`: Consulta turmas por departamento (filtrado localmente via JSON estático).
- `get_courses_catalog`: Lista catálogo de cursos de graduação da UnB.
- `get_course_curriculum`: Obtém matrizes curriculares e disciplinas de um curso específico.
- `solve_schedules`: Resolvedor de grade e combinações de horários.
- `check_schedule_conflicts`: Detector nativo de conflitos de horário.
- `sync_platforms`: Sincronizador de feed do discente (Aprender 3 / SIGAA / Teams autenticado).
- `connect_teams`: Abertura e orquestração de login interativo na Webview do Microsoft Teams.
- `disconnect_teams`: Desconexão e limpeza da sessão do Microsoft Teams.
- `check_vault_status`: Status de integridade criptográfica do cofre Argon2.

## Guardrails

Regras em `eslint.config.js` mantêm a fronteira sem revisão humana:

- Fora de `src/core`: proibido importar `core/infrastructure` e proibido
  abrir `core/domain`/`core/application` direto — use o barrel `@/core`.
- `src/core/domain`: não depende de nada fora de si.
- `src/core/application`: depende apenas do domínio.

## Verificação e Execução

```sh
pnpm lint            # fronteira ESLint + qualidade de código
pnpm typecheck       # checagem de tipos estáticos TypeScript (tsc --noEmit)
pnpm test            # testes unitários dos use cases
cargo test           # testes do backend em Rust e exportação de bindings IPC
pnpm scrape:grade    # teste local do scraper de turmas/departamentos
pnpm scrape:courses  # teste local do scraper de cursos e matrizes curriculares
```
