# Política de Privacidade — Saruê UnB

**Última atualização:** 03 de novembro de 2026  
**Versão:** 1.0.0  
**Repositório Oficial:** [https://github.com/kalebhenrique/sarue-unb](https://github.com/kalebhenrique/sarue-unb)

---

## 1. Visão Geral e Compromisso com a Privacidade

O **Saruê UnB** é um agregador acadêmico desktop de código aberto desenvolvido para estudantes da Universidade de Brasília (UnB). O projeto foi concebido sob o princípio de **arquitetura local-first** (*Local-First Architecture*), priorizando a privacidade, a soberania e a segurança dos dados do usuário.

**Nenhum dado pessoal, acadêmico ou credencial de acesso é enviado, coletado ou armazenado em servidores externos controlados pelos desenvolvedores do Saruê UnB ou por terceiros.**

---

## 2. Dados Manipulados e Armazenamento Local

### 2.1 Credenciais de Acesso (SIGAA, Aprender 3 e Microsoft Teams)
- Para viabilizar a sincronização de turmas, notas, tarefas e calendários, o usuário pode opcionalmente fornecer suas credenciais acadêmicas (matrícula, CPF e senhas institucionais).
- **Armazenamento Seguro:** Todas as senhas e tokens são salvos exclusivamente no dispositivo local do usuário dentro de um cofre criptográfico forte (**Stronghold/OS Keyring**), utilizando padrões modernos de criptografia autenticada (Argon2id, ChaCha20-Poly1305).
- **Sem Intermediários:** As credenciais nunca trafegam por servidores externos, proxies ou APIs de terceiros.

### 2.2 Dados Acadêmicos e Histórico
- Notas, menções, faltas, horários de aula, fluxos de matérias e simulações de IRA são salvos em um banco de dados **SQLite local** no computador do usuário.
- O usuário possui controle total para apagar ou reiniciar todos os dados salvos a qualquer momento através da opção "Zerar dados locais" na aba de Configurações do aplicativo.

---

## 3. Comunicação de Rede e Conexões Externas

O aplicativo realiza requisições de rede **diretas e exclusivas** entre a máquina do usuário e as plataformas institucionais integradas:

1. **SIGAA UnB:** `https://sigaa.unb.br`
2. **Aprender 3 (Moodle UnB):** `https://aprender3.unb.br`
3. **Microsoft Teams:** `https://teams.microsoft.com`

Nenhuma outra conexão de rede é realizada para coleta de telemetria ou analytics.

---

## 4. Telemetria, Rastreamento e Publicidade

- **Zero Telemetria:** O aplicativo não utiliza Google Analytics, Mixpanel, Sentry, PostHog ou qualquer ferramenta similar de análise de comportamento.
- **Zero Anúncios:** O Saruê UnB é totalmente gratuito, sem propagandas ou monetização.
- **Zero Compartilhamento com Terceiros:** Não há venda, repasse ou licenciamento de dados para quaisquer terceiros.

---

## 5. Distribuição e Atualizações

- **Microsoft Store:** Na versão distribuída através da Microsoft Store, as atualizações de versão e verificação de integridade dos pacotes são gerenciadas exclusivamente pela infraestrutura oficial da Microsoft Store.
- **GitHub Releases:** Na versão avulsa para desktop, o aplicativo consulta os lançamentos públicos do GitHub para sinalizar atualizações opcionais assinadas criptograficamente.

---

## 6. Direitos do Usuário (LGPD)

Em total conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD):
- Como os dados residem integralmente no seu dispositivo, você tem total acesso, portabilidade e exclusão imediata dos mesmos simplesmente excluindo o banco de dados local ou desinstalando o software.

---

## 7. Contato e Suporte

Caso tenha dúvidas sobre a segurança, privacidade ou código do projeto, entre em contato através do repositório oficial:
- **GitHub Issues:** [https://github.com/kalebhenrique/sarue-unb/issues](https://github.com/kalebhenrique/sarue-unb/issues)

---

## English Summary

*Saruê UnB is a local-first desktop application for University of Brasília students. It does not collect, track, or share any personal data. All student credentials and academic records remain encrypted and stored locally on your device. Network requests are made strictly and directly to official university servers (sigaa.unb.br, aprender3.unb.br, teams.microsoft.com).*
