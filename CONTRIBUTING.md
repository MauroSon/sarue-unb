# Contribuindo com o Saruê UnB

Ficamos muito felizes com o seu interesse em ajudar a construir o **Saruê UnB**! Este projeto é feito por e para estudantes da UnB, e toda contribuição — seja reportando bugs, sugerindo melhorias, aprimorando o design ou escrevendo código — é muito bem-vinda.

Antes de começar, por favor leia nosso [Código de Conduta](CODE_OF_CONDUCT.md).

---

## 🧭 Como Você Pode Contribuir?

- **Encontrou um bug?** Abra uma [Issue](../../issues) detalhando o ocorrido, o seu sistema operacional, passos para reproduzir e prints/logs do erro.
- **Tem uma ideia ou sugestão?** Abra uma Issue para discutirmos a proposta antes de você começar a implementar, garantindo alinhamento com a arquitetura e visão do produto.
- **Quer programar?** Explore as Issues abertas, especialmente as marcadas com a tag `good first issue`. Comente na Issue avisando que vai assumir a tarefa para evitar retrabalho de outros contribuidores!

---

## 🛠️ Configuração do Ambiente Local

### Pré-requisitos

1. **Node.js & pnpm**:
   - **Node.js**: v20+ (recomendado v22 LTS)
   - **pnpm**: v10+ (`npm install -g pnpm@latest` ou `brew install pnpm`)
2. **Rust & Ferramentas do Tauri 2** _(necessário para rodar o app desktop)_:
   - Toolchain Rust estável: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
   - Dependências nativas de compilação da sua plataforma (consulte a seção de pré-requisitos no [README.md](README.md#2-rust--ferramentas-de-compilação)).

### Passo a Passo (Fork & Clone)

1. Faça um **Fork** deste repositório no GitHub.
2. Clone o seu fork na sua máquina:

   ```bash
   git clone https://github.com/SEU-USUARIO/sarue-unb.git
   cd sarue-unb
   ```

3. Adicione o repositório oficial como `upstream`:

   ```bash
   git remote add upstream https://github.com/kalebhenrique/sarue-unb.git
   ```

4. Instale as dependências:

   ```bash
   pnpm install
   ```

---

## 💻 Executando o Projeto

O Saruê UnB oferece dois modos principais de desenvolvimento:

- **Modo Navegador (Frontend Rápido)**:
  Para prototipar interfaces e componentes sem precisar compilar o backend Rust, utilizando dados mockados e adapters em memória:

  ```bash
  pnpm dev
  ```

- **Modo Desktop Completo (Tauri + Rust)**:
  Para testar integrações com o cofre criptográfico, banco SQLite e comandos nativos em Rust:

  ```bash
  pnpm tauri dev
  ```

- **Popular Banco de Dados de Desenvolvimento**:
  Para preencher turmas, feed e histórico acadêmico fictício no SQLite de desenvolvimento:

  ```bash
  pnpm seeds
  ```

---

## 🏛️ Diretrizes de Código & Arquitetura

- **Clean Architecture**: Consulte o [ARCHITECTURE.md](ARCHITECTURE.md). As regras de fronteira são estritas e checadas pelo linter: use cases e UI dependem de contratos e do container de dependências, nunca importe arquivos internos de `infrastructure` diretamente fora de `src/core`.
- **Identidade Visual**: Siga o estilo visual neobrutalista amigável documentado no [DESIGN.md](DESIGN.md).

---

## 🚀 Fluxo de Pull Request

1. Garanta que sua branch `main` local esteja sincronizada com o `upstream`:

   ```bash
   git checkout main
   git pull upstream main
   ```

2. Crie uma branch para o seu trabalho:
   - Novas funcionalidades: `git checkout -b feat/nome-da-feature`
   - Correções de bugs: `git checkout -b fix/nome-do-bug`
   - Manutenção/docs/infra: `git checkout -b chore/descricao`
3. Faça commits atômicos seguindo o padrão **Conventional Commits**:
   - `feat: adiciona filtro por departamento no solver de grade`
   - `fix: corrige cálculo de peso de trancamento no IRA`
   - `docs: atualiza instruções de contribuição`
4. **Validação Obrigatória antes de enviar (Checagem de CI)**:
   Antes de abrir o PR, execute a suíte de verificação local para garantir que os testes e linters passem verde no GitHub Actions:

   ```bash
   pnpm check:all
   ```

   _(Ou execute `pnpm test:all` e `pnpm lint:all` separadamente)._
5. Envie a branch para o seu fork:

   ```bash
   git push origin feat/nome-da-feature
   ```

6. Abra o **Pull Request** no GitHub:
   - Descreva com clareza o que foi alterado e o porquê.
   - Para mudanças visuais na interface, inclua **prints ou GIFs** de antes e depois.
   - Vincule a Issue correspondente na descrição (ex: `Closes #42`).

---

## 🔒 Privacidade e Segurança Acadêmica

- **Nunca faça commit de dados reais**: credenciais de acesso, cookies de sessão, arquivos `.env` ou matrículas de alunos reais.
- Em prints de Pull Requests ou discussões de Issues, **anonimize qualquer dado pessoal ou nota**.
- O projeto não aceita telemetria, cookies de rastreamento ou bibliotecas de analytics externos.

---

## 💬 Dúvidas ou Ajuda?

Precisa de ajuda para configurar o ambiente ou discutir uma ideia de implementação?
Abra uma [Issue](../../issues) ou participe das discussões com os mantenedores. Toda contribuição é bem-vinda!
