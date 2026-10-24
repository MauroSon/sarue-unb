<h1 align="center">
<strong>Saruê UnB 0.2</strong>
</h1>

<p align="center">
    <img alt="Linux" src="https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black">
    <img alt="macOS" src="https://img.shields.io/badge/mac%20os-000000?style=for-the-badge&logo=macos&logoColor=F0F0F0">
    <img alt="Windows" src="https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white">
</p>

Saruê UnB é o **agregador acadêmico definitivo e moderno** para estudantes da [Universidade de Brasília (UnB)](https://www.unb.br), reimaginado e construído do zero como uma aplicação desktop de alta performance em **Tauri 2**, **Rust** e **React 19**. Ele centraliza e revitaliza a rotina universitária ao integrar **SIGAA**, **Aprender 3 (Moodle)** e **Microsoft Teams** em um feed unificado, sem atrito e com foco total em privacidade — mantendo todas as credenciais em um cofre criptográfico local e disponibilizando ferramentas essenciais como o **Monte sua Grade**, **Fluxograma Curricular interativo** de mais de 150 cursos e **Calculadora de IRA**.

---

<p align="center">
    <img alt="Saruê UnB" src="public/sarue-logo.png" width="280">
</p>

## ✨ Funcionalidades

- **Feed Acadêmico Centralizado (SIGAA, Aprender 3 & Teams)**: Agregação unificada de posts, tarefas com prazo, avisos institucionais e lembretes em uma única linha do tempo fluida. Permite marcar atividades como concluídas e acompanhar o status de entrega sem precisar abrir dezenas de abas no navegador.
- **Monte sua Grade com Solver em Rust**: Busca instantânea por turmas e departamentos da UnB. Conta com um algoritmo nativo em Rust que resolve e sugere combinações de horários sem choques (com suporte total aos códigos de horários da UnB, como `24M12`, `35T34`, `6N12`), filtros por turno e exportação da grade montada.
- **Segurança Local-First com IOTA Stronghold**: Arquitetura estritamente orientada à privacidade. Suas credenciais institucionais são criptografadas diretamente no dispositivo via **Argon2id** e **ChaCha20-Poly1305** no cofre Stronghold. Zero credenciais enviadas para servidores externos; dados acadêmicos e tarefas salvos em local.
- **Fluxograma Curricular Interativo**: Matrizes curriculares completas de mais de 150 cursos de graduação da UnB renderizadas dinamicamente em diagramas. Visualize disciplinas obrigatórias por nível/semestre, optativas, créditos, cargas horárias e cadeias completas de pré-requisitos e equivalências.
- **Calculadora e Simulador de IRA**: Aplicação fiel da fórmula institucional do Índice de Rendimento Acadêmico da UnB e simulador de cenários para projetar o impacto de notas futuras antes de trancar ou cursar disciplinas.
- **Performance Extrema com Dados Estáticos via CDN**: Extração pesada de turmas e matrizes curriculares desacoplada em pipelines agendadas no GitHub Actions e servidas via CDN estático (branch `gh-pages`), eliminando lentidão de scraping em tempo de execução e garantindo tempo de resposta em microssegundos.

---

## 🔧 Pré-requisitos: Rust, Node.js & pnpm

### 1. Node.js & pnpm

> [!TIP]
> O projeto utiliza **pnpm v10+** e **Node.js v20+** com recursos modernos (como suporte nativo a strip de tipos TypeScript no runtime).

Instale o `pnpm` globalmente caso ainda não o possua:

```bash
# macOS / Linux (via Homebrew ou npm)
brew install pnpm
# ou
npm install -g pnpm@latest
```

### 2. Rust & Ferramentas de Compilação

O Saruê UnB utiliza o ecossistema **Tauri 2**, cujo backend de I/O, cofre criptográfico e solver de horários é escrito em **Rust**:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

#### macOS

Certifique-se de ter as ferramentas de linha de comando do Xcode instaladas:

```bash
xcode-select --install
```

#### Linux

No Linux, instale as dependências nativas necessárias para o WebKitGTK e compilação do Tauri:

- **Debian / Ubuntu / Pop!\_OS / Linux Mint**:

  ```bash
  sudo apt update
  sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
  ```

- **Arch Linux / Manjaro**:

  ```bash
  sudo pacman -S --needed webkit2gtk-4.1 base-devel curl wget openssl librsvg libappindicator-gtk3
  ```

- **Fedora / RHEL**:

  ```bash
  sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget
  ```

### 3. Tipografia

O Saruê UnB utiliza a fonte **Plus Jakarta Sans** para compor uma identidade visual acolhedora com tema de material escolar e adesivos, com fallbacks nativos para a pilha de fontes do sistema (`sans-serif`).

---

## 🚀 Instalação & Desenvolvimento

### Clonar o Repositório

```bash
git clone git@github.com:kalebhenrique/sarue-unb.git
cd sarue-unb
```

### Instalar Dependências

```bash
pnpm install
```

---

### Executando o Aplicativo

#### Modo Desktop (Tauri + Vite)

Para rodar a aplicação desktop completa com o backend Rust, banco SQLite e cofre Stronghold ativo:

```bash
pnpm tauri dev
```

#### Modo Navegador (Preview do Frontend)

Para iterar com velocidade na interface e componentes visuais sem compilar o backend Rust, utilizando adapters em memória e dados mockados:

```bash
pnpm dev
```

---

### 🌱 Banco de Dados Local & Seeds de Desenvolvimento

O Saruê UnB adota uma política de **isolamento estrito entre desenvolvimento e produção**:

```bash
# Popula o SQLite de dev com turmas, feed de avisos/tarefas, histórico escolar e simulação de IRA
pnpm seeds

# Caso queira resetar o banco de dev antes de reinserir os dados
pnpm seeds --clean
```

---

### 📡 Execução dos Scrapers (Standalone)

Os scrapers de extração pública do SIGAA podem ser executados isoladamente via Node.js:

```bash
# Executa todos os scrapers de turmas, cursos e calendário
pnpm run scrape:all

# Ou execute individualmente:
pnpm run scrape:grade     # Departamentos e turmas ofertadas
pnpm run scrape:courses   # Catálogo de 150+ cursos e matrizes curriculares
pnpm run scrape:calendar  # Calendário acadêmico
```

---

### 🧪 Verificação & Testes

Execute localmente os testes e linters (TypeScript e Rust) que também são validados automaticamente via GitHub Actions ao abrir Pull Requests:

```bash
# Executa todos os testes (TypeScript via Vitest + Rust via Cargo)
pnpm test:all

# Executa todos os linters (TypeScript typecheck + ESLint + Rust fmt & Clippy)
pnpm lint:all

# Executa TUDO de uma vez (todos os linters + todos os testes) — recomendado antes de abrir PRs
pnpm check:all # ou apenas: pnpm check

# --- Comandos específicos / individuais ---

# Testes unitários do frontend e use cases (Vitest)
pnpm test

# Testes unitários do backend em Rust
pnpm test:rust

# Checagem estática de tipos (TypeScript)
pnpm typecheck

# Linting do frontend e regras de fronteira arquitetural (ESLint)
pnpm lint

# Linter e verificação de formatação em Rust (Clippy com -D warnings + rustfmt check)
pnpm lint:rust

# Formata o código Rust automaticamente
pnpm format:rust
```

---

### 📦 Compilação de Produção (Build)

Para gerar os instaladores e binários executáveis otimizados para o seu sistema operacional (`.dmg` no macOS, `.deb`/`.AppImage` no Linux, `.msi` no Windows):

```bash
pnpm tauri build
```

---

## 🏛️ Arquitetura

O projeto adota os princípios de **Clean Architecture** (Arquitetura Hexagonal), mantendo o domínio de negócios desacoplado do framework de apresentação e de detalhes de infraestrutura:

```
src/
  core/
    domain/          # Entidades (Course, FeedItem, Grade, Scenario...) e portas (I*Repository)
    application/     # Casos de uso do produto (sincronização, solver, cálculo de IRA)
    infrastructure/  # Adapters (Tauri IPC, Stronghold, SQLite, In-Memory) e bindings gerados
    container.ts     # Composition root (injeção de dependência por ambiente)
  components/        # Componentes de interface e primitivos UI estilo shadcn
  screens/           # Telas do app (Dashboard, Grade, Cursos, Meu Curso, Calculadora IRA, Configurações)
  scrapers/          # Scrapers standalone do SIGAA para execução em CI/CD
src-tauri/           # Backend Rust: driver de I/O, cofre Stronghold, SQLite, solver e commands IPC
```

---

## 📄 Licença

Distribuído sob a licença **Apache-2.0**. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.
