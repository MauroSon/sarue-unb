---
name: Saruê UnB
description: Feed acadêmico unificado da UnB com visual de mural de adesivos — borda preta declarada, sombra dura sem blur, cores de material escolar
colors:
  pen-blue: "#2563EB"
  pen-blue-deep: "#1D4ED8"
  pen-blue-brand: "#468AFB"
  highlighter-yellow: "#FFE600"
  highlighter-yellow-hover: "#F2DA00"
  chalk-green: "#46E297"
  chalk-green-hover: "#39D68A"
  correction-red: "#FF6B6B"
  correction-red-strong: "#DC2626"
  notebook-purple: "#C084FC"
  pencil-orange: "#FB923C"
  sky-blue: "#60A5FA"
  institutional-green: "#006633"
  grid-paper: "#E8EFF8"
  paper-cream: "#FAF7EE"
  paper-gray: "#F5F5F5"
  pastel-blue: "#EBF3FF"
  pastel-green: "#E6F8EE"
  pastel-yellow: "#FFF9D2"
  pastel-purple: "#F3E8FF"
  pastel-red: "#FFEBEB"
  pastel-orange: "#FFEDD5"
  pastel-sky: "#E0F2FE"
  success-ink: "#15803D"
  error-ink: "#B91C1C"
  ink-black: "#000000"
  ink-soft: "#525252"
  ink: "#000000"
  blue-ink: "#2563EB"
  grid-line: "rgba(0, 0, 0, 0.06)"
  scroll-thumb: "#A3A3A3"
  scroll-thumb-active: "#737373"
  discipline-ink-blue: "#2563EB"
  discipline-ink-green: "#15803D"
  discipline-ink-yellow: "#EAB308"
  discipline-ink-purple: "#A855F7"
  discipline-ink-orange: "#F97316"
  discipline-ink-sky: "#0EA5E9"
  platform-sigaa: "#468AFB"
  platform-aprender3: "#F98012"
  platform-teams: "#5B5FC7"
  platform-sigaa-dark: "#7FA9FF"
  platform-aprender3-dark: "#FFA45B"
  platform-teams-dark: "#8E93E0"
  # ── Modo escuro — Dark Stickerbook / Cutting Mat (bloco .dark em src/index.css) ──
  ink-black-dark: "#F2F0E7"
  ink-edge-dark: "#4A5A7A"
  neo-shadow-dark: "#000000"
  grid-paper-dark: "#111622"
  paper-dark: "#1E2638"
  cream-dark: "#2A2416"
  paper-gray-dark: "#232B3D"
  neutral-50-dark: "#1A2130"
  neutral-200-dark: "#2E3850"
  neutral-300-dark: "#334155"
  neutral-400-dark: "#6B7891"
  neutral-500-dark: "#8B96AB"
  neutral-600-dark: "#B3BCCD"
  neutral-700-dark: "#CBD2DF"
  neutral-800-dark: "#E5E9F1"
  neutral-900-dark: "#F0F3F8"
  neutral-950-dark: "#0B0F18"
  slate-200-dark: "#2B3550"
  pastel-blue-dark: "#17294A"
  pastel-green-dark: "#0D281E"
  pastel-yellow-dark: "#362813"
  pastel-purple-dark: "#2B1F45"
  pastel-red-dark: "#3A1620"
  pastel-orange-dark: "#33220F"
  pastel-sky-dark: "#123040"
  neo-green-dark: "#34D399"
  neo-green-hover-dark: "#6EE7B7"
  neo-yellow-dark: "#FDE047"
  neo-yellow-hover-dark: "#FDE68A"
  neo-danger-hover-dark: "#EF4444"
  ink-disc-blue-dark: "#BFDBFE"
  ink-disc-green-dark: "#BBF7D0"
  ink-disc-yellow-dark: "#FEF08A"
  ink-disc-purple-dark: "#E9D5FF"
  ink-disc-orange-dark: "#FED7AA"
  ink-disc-sky-dark: "#A5F3FC"
  ink-success-dark: "#4ADE80"
  ink-error-dark: "#F87171"
  blue-ink-dark: "#8FB3FF"
  scroll-thumb-dark: "#4A5568"
  scroll-thumb-active-dark: "#5F6C85"
  scroll-thumb-border-dark: "#05070B"
  card-inset-highlight-dark: "rgba(255, 255, 255, 0.08)"
  sticker-blue-dark: "#60A5FA"
  btn-raise-dark: "#263044"
  filter-hover-dark: "#1E293B"
  ink-deep-dark: "#090D16"
  grid-line-dark: "rgba(255, 255, 255, 0.06)"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  heading:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.05em"
  micro:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.4
  mono-code:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.6875rem"
    fontWeight: 800
    lineHeight: 1.4
rounded:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "9999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.pen-blue}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    height: "40px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.pen-blue-deep}"
  button-accent:
    backgroundColor: "{colors.chalk-green}"
    textColor: "#000000"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    height: "40px"
    padding: "0 20px"
  button-accent-hover:
    backgroundColor: "{colors.chalk-green-hover}"
  button-yellow:
    backgroundColor: "{colors.highlighter-yellow}"
    textColor: "#000000"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    height: "40px"
    padding: "0 20px"
  button-yellow-hover:
    backgroundColor: "{colors.highlighter-yellow-hover}"
  button-focus-visible:
    outline: "none"
    ring: "2px {colors.pen-blue}, offset 2px branco"
  button-destructive:
    backgroundColor: "{colors.correction-red-strong}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    height: "40px"
    padding: "0 20px"
  button-destructive-hover:
    backgroundColor: "{colors.error-ink}"
  button-outline:
    backgroundColor: "#ffffff"
    textColor: "#000000"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    height: "40px"
    padding: "0 20px"
  button-sm:
    backgroundColor: "{colors.pen-blue}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 14px"
  select-trigger:
    backgroundColor: "#ffffff"
    textColor: "#000000"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 12px"
  select-trigger-active:
    backgroundColor: "{colors.pen-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    height: "34px"
    padding: "0 12px"
  input-default:
    backgroundColor: "#ffffff"
    textColor: "#000000"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  input-search:
    backgroundColor: "#ffffff"
    textColor: "#000000"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  input-search-engaged:
    backgroundColor: "{colors.pastel-blue}"
  checkbox:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.xs}"
    width: "20px"
    height: "20px"
  checkbox-selected:
    backgroundColor: "{colors.pen-blue}"
    textColor: "#ffffff"
  badge-sticker:
    backgroundColor: "#ffffff"
    textColor: "#000000"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 12px"
  skeleton-block:
    backgroundColor: "#E5E5E5"
    rounded: "4px"
  toast-popup:
    backgroundColor: "{colors.grid-paper}"
    textColor: "#000000"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  tooltip-popup:
    backgroundColor: "{colors.grid-paper}"
    textColor: "#000000"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  didatica-badge-high:
    backgroundColor: "{colors.chalk-green}"
    textColor: "#000000"
    typography: "{typography.micro}"
    rounded: "{rounded.xs}"
    padding: "2px 10px"
  didatica-badge-mid:
    backgroundColor: "{colors.highlighter-yellow}"
    textColor: "#000000"
    typography: "{typography.micro}"
    rounded: "{rounded.xs}"
    padding: "2px 10px"
  didatica-badge-low:
    backgroundColor: "{colors.correction-red-strong}"
    textColor: "#ffffff"
    typography: "{typography.micro}"
    rounded: "{rounded.xs}"
    padding: "2px 10px"
  didatica-badge-none:
    backgroundColor: "{colors.paper-gray}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.micro}"
    rounded: "{rounded.xs}"
    padding: "2px 10px"
  stat-card:
    backgroundColor: "#ffffff"
    textColor: "#000000"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Design System: Saruê UnB

## Overview

**Creative North Star: "Mural de Adesivos"**

Todo o sistema se comporta como uma muralha de papel quadriculado onde adesivos grossos foram pressionados à mão: cards, badges, botões e campos são adesivos com borda preta declarada (2px sólida) e sombra dura deslocada, sem um pixel de blur. Nada flutua no ar — tudo está *colado* na superfície. Quando o usuário clica, o adesivo afunda fisicamente: a sombra desaparece e o elemento se desloca na direção dela. A interface responde ao toque como objeto, não como holograma.

A personalidade é de app de estudante, não de empresa: cores de material escolar (caneta azul, marca-texto amarelo, giz verde, caneta corretora vermelha) sobre papel quadriculado sutil, com hierarquia construída por peso tipográfico (black/extrabold/bold) em vez de tons de cinza apagados. Por baixo da brincadeira existe um produto de trabalho sério: densidade organizada, grid discreto, ritmo consistente de 150ms em todas as transições.

O mundo é opaco e de alto contraste. Sombras suaves difusas, vidro fosco, gradiente e translucidez são a anti-referência declarada — nunca entram.

**Key Characteristics:**

- Borda preta de 2px em toda superfície e elemento interativo
- Sombra dura deslocada, cor preta sólida, blur zero
- Física de pressionar: hover afunda com snap inteiro, active afunda tudo até a superfície tocar o papel
- Clique mecânico opcional: som tátil de switch no clique (opt-in em Settings; a navegação é muda)
- Cores candy de material escolar sobre papel quadriculado (#E8EFF8, grid de 32px)
- Uma cor por significado: azul = ação e seleção, verde giz = conclusão — nunca cruzam
- Hierarquia por peso de fonte, não por cinza
- Raio como affordance (A Regra dos Dois Adesivos): ação 12–16px, conteúdo 8px — clique se distingue de leitura à primeira vista
- Popups de leitura e seleção (Select, Dropdown, Tooltip, Toast) são papel, não adesivo: Papel Quadriculado, sem sombra
- Nota de didática veste cor de ação por faixa, sem escala contínua (A Regra da Nota por Faixa)
- Duas superfícies assinatura: a Grade Horária e o mapa do Fluxograma — mural de adesivos de status sobre papel quadriculado, com arestas desenhadas à caneta
- Tudo em 150ms ease-out

## Colors

Paleta de material escolar: uma cor de ação por intenção, versões pastel das mesmas cores para superfícies de apoio, tudo costurado por preto de tinta.

### Primary
- **Azul Caneta Ação** (#2563EB): a cor de ação do produto. Todo fundo interativo sob texto branco e todo texto/ícone informativo sobre branco: botões primários, tabs ativas, item de navegação ativo, checkbox de seleção, filtro Select engajado, foco de inputs (ring), links de marca ("Aggregator" no logo), ícones de cabeçalho de página, thumb do Slider e preenchimento da barra de progresso de ferramentas. Branco sobre ela = 5.17:1 (AA). Hover escurece para **Azul Caneta Pressionado** (#1D4ED8, 6.70:1 com branco). No Fluxograma é também o status "cursando".

### Brand
- **Azul Caneta** (#468AFB): cor de marca — logo-bloco "UnB", wordmark e blocos decorativos. Isenta de contraste WCAG como logotipo; nenhum texto pequeno branco sobre ela. Nunca como fundo interativo.

### Secondary
- **Amarelo Marca-Texto** (#FFE600): ação de destaque e badge de tarefa/entrega/prazo próximo — o amarelo de grifo em cima da leitura. Sempre com texto preto. No Fluxograma é o status "disponível"; na Escala de Didática é a faixa 6–7,9.
- **Verde Giz** (#46E297): sucesso e plataforma SIGAA. Botão accent, badges de confirmado, badges de plataforma, checkbox de conclusão, preenchimento da barra de progresso de integralização. Texto preto. No Fluxograma é o status "concluída"; na Escala de Didática, faixa ≥ 8.
- **Vermelho Correção** (#FF6B6B): tinta de borda/acento destrutiva — contornos, ícones e acentos sempre com TEXTO PRETO (7.57:1). Nunca fundo sob texto branco.
- **Vermelho Correção Forte** (#DC2626): destrutivo e urgente com texto branco. Botão destructive, badge urgent (4.83:1), prazos vencidos ou < 24h, badge de contagem do sino, asterisco de obrigatória, conflito de grade. Hover escurece para **Vermelho Erro** (#B91C1C, 6.47:1). Na Escala de Didática é a faixa < 6 — a única cor da escala sob texto branco.

### Tertiary
- **Laranja Moodle** (#F98012): identidade da plataforma Aprender 3 (laranja oficial da marca Moodle), texto preto. **Lápis Laranja** (#FB923C) segue como tinta de apoio genérica.
- **Lilás Caderno** (#C084FC): variante purple de card, texto preto. No Fluxograma identifica optativa disponível (cheia) e optativa bloqueada/concluída (pastel).
- **Roxo Fluent** (#5B5FC7): identidade da plataforma Microsoft Teams (roxo oficial da marca), texto branco.
- **Verde Institucional** (#006633): verde oficial UnB, definido no tema; uso pontual institucional.

### Neutral
- **Papel Quadriculado** (#E8EFF8): fundo do canvas do app, sempre com o grid de 32px por cima — e também o fundo de todos os popups (Select, Dropdown, Tooltip, Toast).
- **Creme Papel** (#FAF7EE): superfície alternativa quente; no catálogo de relatos é o papel do bloco "Feedback Sincero".
- **Branco** (#FFFFFF): superfície padrão de cards, inputs, sidebar e botão outline.
- **Tinta Preta** (#000000): todas as bordas (2px), todas as sombras, texto primário, ícones, arestas do Fluxograma e pinos (handles).
- **Tinta Suave** (#525252, escala neutral-400–800 do Tailwind): texto secundário e descrições — sempre font-medium no mínimo, nunca cinza de baixo contraste em peso leve. neutral-800 (#262626) também serve de fundo do alternador Arquivados ativo.
- **Cinza Papel** (#F5F5F5, neutral-100): preenchimentos de hover, itens desabilitados, card de item concluído, nó bloqueado do Fluxograma, nota de didática sem relato.
- **Cinza Nota** (slate-200): badge de aviso (post), texto preto.

### Tintas de apoio
- **Verde OK** (#15803D): texto de confirmação dentro de superfícies pastel (checkmarks, selo "Zero Telemetria"). 5.02:1 sobre branco.
- **Vermelho Erro** (#B91C1C): texto de erro sobre branco (mensagem de input); também é o hover do destrutivo. Bordas/rings de erro usam #DC2626 (não-texto).

### Escala de Didática (nota por faixa)
Nas Avaliações de Professores, a nota de didática (0–10) veste a cor **cheia** da família de ação por faixa — nunca tom contínuo, nunca degradê:
- **≥ 8**: **Verde Giz** com texto preto (estrela preenchida).
- **6 a 7,9**: **Amarelo Marca-Texto** com texto preto.
- **< 6**: **Vermelho Correção Forte** com texto branco.
- **Sem nota**: **Cinza Papel** (#F5F5F5) com texto **Tinta Suave**.
No escuro, a mesma receita das badges noturnas: fundo lavado da família (Verde/Amarelo/Vermelho Pastel) e a tinta clara da própria família como texto (Verde Giz, Amarelo Marca-Texto, **Vermelho Erro** #F87171). Faixas e ordem nunca mudam.

### Tintas de Grade e Scrollbar
Inks escuras da mesma família das cores de ação, usadas como TEXTO e borda interna das células da Grade Horária sobre os pastéis, e no thumb da scrollbar. Texto da tinta sobre o pastel correspondente passa AA.

- **Tinta Azul** (#2563EB) / **Tinta Verde** (#15803D) / **Tinta Amarela** (#EAB308) / **Tinta Roxa** (#A855F7) / **Tinta Laranja** (#F97316) / **Tinta Céu** (#0EA5E9): par tinta+pastel da disciplina (Azul Pastel, Verde Pastel, Amarelo Pastel, Lilás Pastel, Laranja sobre #FFEDD5, Céu sobre #E0F2FE).
- **Thumb de Scroll** (#A3A3A3, hover #737373): scrollbar com borda preta de 2px, mantendo o estilo adesivo.

### Pastéis (superfícies, nunca texto)
Versões lavadas das cores de ação, usadas como fundo de cards variante, alerts, blocos de ícone, filtros e estado de seleção — sempre com texto preto e borda preta: **Azul Pastel** (#EBF3FF), **Verde Pastel** (#E6F8EE), **Amarelo Pastel** (#FFF9D2), **Lilás Pastel** (#F3E8FF), **Vermelho Pastel** (#FFEBEB), **Laranja Pastel** (#FFEDD5), **Céu Pastel** (#E0F2FE).

### Modo escuro — Dark Stickerbook / Cutting Mat
Extensão aprovada do mural, não um mundo novo: a mesma física neo-brutalista **com a base de trocada**. O papel quadriculado vira uma **base de corte grafite-azulada** (#111622, grid sutil claro) e os cards/sidebar viram **placas de papel grafite elevadas** (#1B2232) — mais claras que o fundo de propósito, para a **sombra dura PRETA pura** (`4px 4px 0 #000`) recortar de verdade. Nada de inversão preguiçosa: sombra não brilha, adesivo não vaza.

- **Sombra é tinta preta nos DOIS temas.** `--neo-shadow` fica `#000` também no escuro; a profundidade nasce do par placa-clara | sombra-preta, estilo cutting mat. Cards grandes sombreiam com `shadow-(--neo-card-shadow)`: a sombra preta externa **+ um fio de luz interno no topo** (`inset 0 1px 0 rgba(255,255,255,0.08)`) faz a placa saltar da base. A Zona de Perigo mantém a única sombra tingida (#DC2626); à noite a tinta escurece — sombra **Vermelho Profundo** (#450A0A) sob placa **Vermelho Sangue** (#7F1D1D), fundo mais rico que o pastel lavado para o degrau da sombra continuar lendo.
- **Bordas de tinta (`border-ink`) permanecem pretas** no escuro — o risco de tinta define o adesivo contra a placa; contorno nunca vira branco (brilho). `border-ink` e `text-black` são tokens distintos: **texto primário é GIZ** (#F2F0E7) e borda é TINTA (#000 via `--color-ink`, que nunca remapa).
- **Adesivos são adesivos nos dois temas.** Badges, notas de didática, pills de versão e pills de plataforma permanecem **CHEIOS** no escuro: fundo sólido vibrante + tinta preta fixa (`text-ink`, #000 nunca remapa) + borda de tinta. No escuro as tintas de ação usam versões vivas de noite: **Verde Menta** (#34D399), **Ouro** (#FDE047, hover #FDE68A) e Vermelho Correção com hover #EF4444. Cor vazada com contorno colorido é drift.
- **Etiquetas neutras seguem a receita única** (badge `neutral`, chip de disciplina do feed, pill de código mono, carga horária e `Pré-requisitos` do Meu Curso): no escuro, fundo **#334155** (`neutral-300`), texto **slate-50**, borda de tinta — **etiqueta nenhuma carrega sombra**, em nenhum tema.
- **Blocos de ícone dos cards de métrica viram adesivos vivos** no escuro (Meu Curso): Menta, Azul-claro (#60A5FA), Ouro e Lilás (#C084FC) com ícone preto fixo — mesma receita dos adesivos do onboarding.
- **Filtros de status guardam a identidade cromática** no escuro (Meu Curso): inativos vestem o pastel rico da família com **tinta clara da própria família como texto** (Faltam Cursar = outline #263044; Concluídas = verde-esmeralda + menta; Cursando = azul-marinho + azul-claro; Disponíveis = âmbar + ouro); ativos ficam **sólidos vibrantes com tinta preta** (menta/azul/ouro via remap). Filtros NEUTROS ("Todas", "Faltam Cursar") ativos: **preto #090D16 com texto branco e hover grafite #1E293B** no claro, **branco-gelo #F8FAFC com texto tinta e hover #E2E8F0** no escuro — nunca verde, que é do filtro Concluídas; cor de fundo claro leva SEMPRE tinta preta de texto/ícone.
- **Campos afundam, controles elevam.** Inputs de texto afundam para o poço #0F1420; SELECTS elevam no escuro (`dark:bg-neutral-200`, hover `neutral-300`, texto slate-50, sem sombra) para não sumirem dentro dos cards — vale para os selects de CR/MENÇÃO da Calculadora de IRA. A pílula de período no cabeçalho dos cards de semestre eleva com `dark:bg-neutral-300` + texto slate-50. Faixas de simulação (IRA) viram placa com **borda e ícone Ouro vivo** (`dark:border-neo-yellow dark:text-neo-yellow`), texto giz. O Creme (#FAF7EE no claro) vira **ardósia azulada #232D42** no escuro — é o papel do bloco "Feedback Sincero" nos relatos, nunca marrom.
- **Banners = placa com fita de ouro.** No escuro, o Alert amarelo vira **placa elevada** (superfície do papel) com **fita lateral esquerda grossa (6px) na tinta Ouro viva** (`dark:border-l-[6px] dark:border-l-neo-yellow`) e selo de ícone sólido Ouro — o destaque vem do detalhe vivo, nunca de fundo âmbar apagado. **Ações dentro do banner vestem o Ouro** (`dark:bg-neo-yellow dark:text-ink dark:hover:bg-neo-yellowHover` — "Ver Planilha", "Novo planejamento"): CTA da mesma tinta da fita. Card verde de status usa o **Verde Pastel esmeralda** (#0D281E). Transparência que vira marrom/oliva é proibida.
- **Base e placa:** Canvas **#111622** (grid rgba(255,255,255,0.06)), Papel **#1E2638**, Creme **#2A2416**. Superfícies usam `bg-paper` (nunca `bg-white`) exatamente para a placa poder elevar sobre a base. Botões secundários (outline) sobem um degrau: `dark:bg-[#263044]`; tags de campus viram etiquetas `dark:bg-neutral-300` (#334155) com **texto branco-gelo** (`dark:text-slate-50`, que não remapa) e **sem sombra** — badge não carrega sombra. Trilha do Switch desligado: `dark:bg-neutral-300` (#334155) com thumb claro `dark:bg-slate-300` (#CBD5E1).
- **Escala neutral grafite.** neutral-100 (#232B3D) é a superfície de conteúdo escura (hover, item concluído); neutral-500 sobe para #8B96AB; neutral-800/900 (#E5E9F1/#F0F3F8), que eram quase-preto, viram quase-giz.
- **Grade horária legível.** Células usam os pastéis ricos com **borda sólida viva da própria cor** e sombra preta curta; os códigos de disciplina (`text-ink-disc-*`) remapam para **pastéis claros >80% de luminosidade** (#BFDBFE, #BBF7D0, #FEF08A, #E9D5FF, #FED7AA, #A5F3FC) — nunca tinta escura sobre fundo escuro.
- **Onboarding: adesivos vivos e poço de entrada.** Nos cards dos passos 2–3, o bloco de ícone vira **adesivo sólido** no escuro (azul #60A5FA, Ouro, Menta, ícone preto), o card vira placa com **faixa superior da categoria (6px)**, os dots inativos ganham #334155 e as formas decorativas da tela 1 padronizam o contorno (tinta no claro, branco no escuro — nunca misto). **Inputs de credenciais afundam** para #0F1420 (poço contra a placa) com texto slate-50, placeholder slate-500 e foco de borda azul #3B82F6.
- **Tintas de TEXTO clareiam.** ink-success **#4ADE80**, ink-error **#F87171**, azul-caneta-como-TEXTO **#8FB3FF**.
- **Thumbs acompanham a placa.** Thumb do Switch/Slider: branco no claro, `dark:bg-neutral-50` no escuro, borda de tinta. `text-white` nunca remapa; backdrop do Dialog é tinta fixa (`bg-ink/60`). Ícones sociais têm variantes `*-dark.svg` trocadas por tema.
- **Caneta grafite.** Arestas e pinos do Fluxograma desenham em **grafite** (#4A5A7A) — nem preto (some na base), nem branco (brilha). Export PNG da Grade segue o tema (fundo #111622 no escuro). Scrollbar: thumb #4A5568 com borda de tinta.
- **Alternador:** header do onboarding (sol — switch — lua, canto superior esquerdo) e Configurações → **Preferências** ("Tema da interface", SegmentedControl `md`). Persiste em `localStorage` (`sarue_theme`), aplica `dark` no `<html>` **antes do primeiro paint**, acompanha o SO no modo Sistema e sincroniza o tema nativo da janela Tauri.

**A Regra da Física Intacta.** No escuro troca-se a BASE, nunca a física: sombra continua preta sólida deslocada, borda continua tinta, adesivo continua cheio com tinta preta de texto, post-it continua papel rico com detalhe vivo. O que muda são os valores de superfície e a intensidade das tintas — nunca o gesto.

### Named Rules
**A Regra do Risco Preto.** Nenhuma superfície ou elemento interativo existe sem borda preta de 2px. A borda é o contorno do adesivo; sem ela o elemento cai fora do mundo. Exceção confirmada: pill de código de disciplina (font-mono) usa borda de 1px.

**A Regra do Pastel como Papel.** Cores de ação (caneta, giz, correção) marcam interação e identidade; as versões pastel servem de papel de fundo. Uma nunca faz o trabalho da outra: pastel nunca é botão, cor cheia nunca é fundo de seção inteira. Exceção confirmada: filtro engajado e segmento ativo vestem a cor cheia da família — engajamento veste tinta de ação.

**A Regra da Cor por Significado.** Azul é de seleção e ação; Verde Giz é só de conclusão. O checkbox de selecionar é azul, o de concluir é verde, e nenhum contexto troca esse papel — quem procura o que já fez e o que marcou não pode trocar as duas tintas.

**A Regra da Nota por Faixa.** Nota de didática não tem escala contínua: três faixas de cor cheia (verde ≥ 8, amarelo ≥ 6, vermelho forte abaixo) + cinza sem nota. Verde aqui significa "ótimo", não "concluído" — contexto de avaliação, não de tarefa.

## Typography

**Display Font:** Plus Jakarta Sans (fallback system-ui, -apple-system, sans-serif)
**Body Font:** Plus Jakarta Sans (fallback system-ui, -apple-system, sans-serif)
**Mono Font:** stack mono nativa do Tailwind (font-mono) — exclusiva de códigos de disciplina (SIGAA) em pills e tooltips; nunca em texto corrido.

**Character:** Geométrica e arredondada, com personalidade de app jovem — o peso extremo (800, teto real da família Plus Jakarta Sans, variable 200–800; usos `font-black` renderizam 800) dá voz de marcador grosso, enquanto 500/600 mantêm corpo de produto legível.

### Hierarchy
- **Display** (800, clamp(2.25rem, 5vw, 3rem), 1.1, tracking -0.02em): título de boas-vindas no onboarding ("Saruê UnB"). Único momento de hero.
- **Title** (800, 1.5rem, 1.25, tracking -0.01em): cabeçalho de página (PageHeader), com ícone azul de 16px (stroke 2.5) ao lado. Aceita sufixo de contagem em 0.875rem/700 Tinta Suave — "(42 resultados)".
- **Heading** (700, 1.125rem, 1.4, tracking -0.01em): título de card (CardTitle).
- **Stat** (800, 2rem–3rem, tracking -0.02em; `tabular-nums` quando comparável): números de indicadores — IRA do resultado em 3rem (text-5xl), cards de métrica em 1.875rem (text-3xl), faixa de indicadores de drill-down em 1.5rem (text-2xl). Sempre com rótulo uppercase 11px/800 em cima e nota de rodapé 11px/700 Tinta Suave embaixo ("/10", "entre professores").
- **Body** (500, 0.875rem, 1.5): conteúdo de cards, descrições, itens de lista. Texto secundário em neutral-600/700 mesma faixa de tamanho.
- **Label** (700, 0.75rem, 1.4): labels de input, badges, botões, tabs, rótulos de filtro. Versão uppercase com tracking 0.05em para rótulos de grupo (SelectLabel, cabeçalhos da grade, labels de indicador).
- **Micro** (700, 0.6875rem/11px, 1.4): rótulos mínimos — contadores, badges sm, meta do feed, links de serviço, pills de código mono. 10px está banido do sistema (a única exceção é o rótulo interno do menu do nó do Fluxograma).

### Named Rules
**A Regra do Marcador Grosso.** Hierarquia vem de peso (800 → 700 → 600 → 500), não de esmaecer cinza. Nunca enfraqueça texto baixando o peso para abaixo de 500 — baixe o tom (neutral-600) mantendo o peso.

**A Regra do Rótulo Gritado.** Rótulos estruturais (grupos, cabeçalhos de tabela, micro-cabeçalhos, labels de indicador) são uppercase, font-black ou font-bold, 11–12px, com tracking largo. Dá o tom de etiqueta de fichário.

**A Regra do Código em Máquina.** Código de disciplina (ex. CIC0004) vive sempre em pill mono (font-mono, 11px, font-black, borda de 1px, fundo branco) — o código é carimbo de máquina, não título. O nome por extenso anda ao lado, em Plus Jakarta Sans.

## Layout

App desktop (janela Tauri), desktop-first. Estrutura permanente: sidebar branca à esquerda com borda direita preta de 2px, expandida em 264px (w-64) ou recolhida em 80px (w-20), contendo logo-bloco, navegação ledger e ações de sync na base. O conteúdo vive sobre o **Papel Quadriculado** (#E8EFF8 com grid de 32px em rgba(0,0,0,0.05)) e é centrado em container de no máximo 1152px (max-w-6xl) com ritmo vertical de 24px entre blocos (space-y-6) e respiro inferior de 48px.

Densidade: cards com padding interno de 24px (ferramentas de trabalho usam 16px), gaps de 8–16px entre controles, listas com cards empilhados. Grids internos usam gap de 6px (grade horária) a 10px (tabs). Catálogos de duas colunas (md:grid-cols-2, gap-4) para cards de professor/disciplina e métricas em quatro colunas no desktop (sm:2, lg:4). O canvas do Fluxograma tem 560px de altura fixa, com controles no canto superior direito, chip de reenquadrar no topo central e minimapa no canto inferior direito. Breakpoints Tailwind padrão existem para janelas estreitas (sm 640px, md 768px, lg 1024px), mas o alvo é janela de desktop; nada de layout de mobile. Painéis que se adaptam ao próprio espaço (Cofre em Settings) usam container query (`@container`): inputs de credencial ficam em duas colunas a partir de 580px de painel e empilham abaixo disso — o container manda, não a janela.

A contagem de resultados vive em dois lugares, nunca numa linha solta acima do card: a contagem **absoluta** vai no título da página como sufixo do PageHeader ("Início (42 resultados)"); a contagem **filtrada** ("N de M resultados") abre o card do feed numa barra interna (Papel Quadriculado, borda inferior preta a 10%, Micro bold, py-2) e só aparece quando há filtro ativo. Na toolbar do catálogo de Avaliações, a contagem filtrada é variante de rodapé: divisor superior black/10 e texto bold, sem faixa de papel — o card é a própria toolbar.

## Elevation & Depth

Profundidade é **física e estrutural**: sombras são deslocamentos sólidos de tinta preta, sem blur, sem cor ambiente. Um elemento "senta" sobre o papel e sua sombra diz quanto peso ele tem. A interação muda a física: hover afunda com snap inteiro (o elemento translada o maior número inteiro de pixels da direção da sombra e ela encolhe o equivalente — em sombra de 3px, translate 2px e sombra 1px, ficando a 1px do papel), active afunda tudo (translada o offset completo e a sombra some — a superfície toca o papel), disabled desmira (opacity 50%, sem movimento).

### Shadow Vocabulary
- **Sticker micro / Adesivo de ação** (`2px 2px 0 0 #000`, token `neo-sm`): todo botão, tab/chip e micro-ação permanente em repouso; logo-bloco, ícones de collapse; nó do Fluxograma em estágio hover; checkboxes grandes (24px) da lista do Fluxograma; diálogos internos de alerta.
- **Micro-adesivo** (`1px 1px 0 0 #000`, token `neo-xs`): o que pesa menos que um adesivo de ação em repouso — checkbox, blocos de ícone pastel, pills de resultado inline, barra de progresso, micro-ações flutuantes de ferramenta, badge de didática, pill de discrepância do IRA; também é a sombra do estágio hover da escala 2px.
- **Adesivo de card** (`4px 4px 0 0 #000`, token `neo`): cards, alerts, painéis, toolbars e popups de conteúdo; nó do Fluxograma em repouso; minimapa.
- **Ênfase máxima** (`6px 6px 0 0 #000`, token `neo-lg`): diálogo modal — a única superfície acima de todo o app.
- **Sombra tingida de perigo** (`4px 4px 0 0 #DC2626`): exclusiva do Card da Zona de Perigo em Settings — a única sombra colorida do sistema; no escuro vira `#450A0A` sobre placa `#7F1D1D`.
- **Quase-afundado** (`1px 1px 0 0 #000`): estado hover — o elemento translada em snap inteiro o quanto a sombra encolheu (ação 2px: +1px e sombra 1px; card clicável 4px: +2px e sombra 2px).
- **Pressionado** (`shadow-none` + translate do offset completo): estado active de qualquer elemento interativo — a superfície toca o papel.
- **Divisores internos**: bordas de 2px pretas entre seções da sidebar; linhas internas de card em black/10–15%.

### Named Rules
**A Regra da Sombra Dura.** Sombra é deslocamento sólido preto, nunca blur, nunca rgba difusa, nunca cor. Se precisar de menos profundidade, diminua o deslocamento — não amacie. Única exceção declarada: a Zona de Perigo usa a sombra na própria cor do risco (#DC2626) — perigo tinge a própria física, e nenhum outro elemento.

**A Regra do Afundar.** Todo elemento interativo em repouso com sombra dura afunda em dois tempos: no hover, com snap inteiro (ação de sombra 2px: translate +1px na direção da sombra, sombra reduzida a 1px — fica a 1px do papel; card clicável de sombra 4px: +2px e sombra 2px); no active, tudo (translate +offset completo, shadow-none — a superfície toca o papel). Ghost sem sombra mantém micro-afundar de 1px no active. Elemento que levanta no hover (translate negativo ou sombra crescendo) é bug físico.

**A Regra do Snap Inteiro.** Todo translate de press em elemento de sombra 2px ou mais é número inteiro de pixels — nunca meia-pixel (1.5px), que antialiasa a borda preta em telas de escala não-inteira e borra o adesivo. Se a metade do offset não é inteira, afunde para o inteiro imediato (metade de 3px vira 2px) e dê o resto à sombra. Única exceção confirmada: o checkbox de 20px (sombra micro 1px) afunda 0.5px no hover e 1px no active — metade de 1px não tem inteiro entre hover e active, e pular direto ao afundar total no hover apagaria o estágio de repouso do adesivo.

**A Regra do Popup de Papel.** Popup de leitura ou seleção (Select, Dropdown, Tooltip, Toast) é folha de **Papel Quadriculado** com contorno preto de 2px e **sem sombra** — o contorno faz o destaque, não a elevação. Popup que precisa de peso físico (o menu do nó do Fluxograma, ancorado a um adesivo) é a exceção declarada: branco, borda 2px, Adesivo de card 4px.

## Shapes

**A Regra dos Dois Adesivos.** Raio e sombra dizem o que o adesivo faz — informação nunca se veste de botão, e botão nunca se veste de informação:

- **Adesivo de conteúdo** (cards, alerts, diálogos, painéis, popups, blocos decorativos, nós do Fluxograma): raio pequeno **8px (rounded-lg)** + sombra funda de card **4px 4px**. Canto mais reto, peso maior — papel de leitura.
- **Adesivo de ação** (botões, tabs/chips, micro-ações): raio generoso **16px (rounded-2xl)** em md/lg, **12px (rounded-xl)** em sm e ícones, **8px** em micro-ação (h-7 ou menor) + sombra leve de ação **2px 2px**. Redondo e leve — convite ao clique.
- **Painel de pausa** (EmptyState, cards de métrica, minimapa do Fluxograma): raio **12px (rounded-xl)** — a página respira antes do número grande ou da pausa; sombra de card 4px (minimapa usa 2px).
- **Campos** (inputs, selects, textareas, busca): raio médio **12px (rounded-xl)**, sem sombra em repouso — cavidade no papel, nem conteúdo nem ação.
- **Checkbox** (seleção e conclusão): 20px, raio **6px (rounded-md)**, borda preta 2px, sombra micro **1px** — mini-adesivo de marcação; check em Lucide stroke 3. A lista do Fluxograma usa a versão grande de 24px com física de ação completa (sombra 2px, snap inteiro).
- **Diálogo modal**: raio de conteúdo **8px** com **Ênfase máxima 6px** — a única superfície que usa neo-lg.
- **Badges**: círculo completo (9999px), sem sombra — etiqueta de tinta, não adesivo; pills de resultado inline (fora do componente Badge) levam Micro-adesivo 1px. Badge de didática é a exceção retangular: raio 6px (catálogo) / 8px (bloco do relato), borda 2px, Micro-adesivo 1px.
- **Pills de código mono**: raio 4–6px, borda de **1px** (não 2px) — carimbo menor que etiqueta.
- **Micro-ações flutuantes de ferramenta** (aparecem no hover do grupo, ex. "Enviar para o Monte sua Grade"): raio 4–6px (rounded a rounded-md), borda de 1px, Micro-adesivo 1px — adesivo menor e mais leve; o que vive permanentemente na tela usa o adesivo de ação padrão (borda 2px, sombra 2px). Os controles de canvas do Fluxograma (zoom, enquadrar) são permanentes e usam o padrão de ação compacto: 28px, raio 12px, borda 2px, sombra 2px.
- **Estado vazio** (EmptyState): painel contentor amplo, raio **12px (rounded-xl)**, p-8 — pausa de página, não bloco de leitura densa.

A distinção se lê de longe: o que tem sombra 2px e raio 16px afunda quando clica; o que tem sombra 4px e raio 8px fica. Elementos pequenos de conteúdo (células da grade, cabeçalhos de dia, blocos de ícone) seguem o raio de conteúdo 8px. A borda-preta-2px continua universal (A Regra do Risco Preto).

Ícones são Lucide com stroke 2.5 (mais grossos que o padrão) — combinando com a espessura das bordas; check de checkbox usa stroke 3. O logo é um bloco quadrado de 36px, **Azul Caneta**, texto "UnB" branco font-black, borda e sombra de sticker.

## Components

### Buttons
- **Shape:** borda preta 2px. Tamanhos: md 40px raio 16px (padding 0 20px), lg 48px raio 16px, sm 32px raio 12px (padding 0 14px), icon 40px raio 12px; toolbar do feed usa sm na altura 34px.
- **Primary:** fundo **Azul Caneta Ação**, texto branco, fonte 700; hover **Azul Caneta Pressionado**. Variantes: accent (**Verde Giz**, texto preto; hover **Verde Giz Pressionado** #39D68A), yellow (**Amarelo Marca-Texto**, texto preto; hover #F2DA00), destructive (**Vermelho Correção Forte**, texto branco; hover **Vermelho Erro**), outline (branco, texto preto; hover Cinza Papel), ghost (transparente, sem borda visível, sem sombra, hover black/5).
- **Hover / Focus:** hover afunda com snap inteiro (translate +1px,+1px, sombra 2px→1px — fica a 1px do papel); active afunda tudo (translate +2px,+2px, sombra none — a superfície toca o papel). Ghost, sem sombra, micro-afunda 1px só no active. Transição 150ms ease-out. **Focus via teclado:** ring 2px **Azul Caneta Ação** com offset branco 2px, sem glow — mesmo token do Input. Disabled: opacity 50%, congela a física.
- **Loading:** spinner circular de borda 2px corrente no lugar do conteúdo.
- **Som:** clique mecânico opcional no clique de botão, link e checkbox — A Regra do Clique Mecânico (abaixo).

**A Regra do Clique Mecânico.** O som é feedback de objeto, não enfeite: opt-in, desligado por padrão (Switch "Efeito sonoro de botão" em Settings), sample de switch mecânico via Web Audio com pitch jitter de ±3% e ganho a 25% para nunca soar robótico, disparado por um listener global. A encadernação é muda: navegação da sidebar e logo-bloco levam `data-no-sound="true"`. Elemento desabilitado não faz barulho.

### Toolbar do Feed
Barra de busca e filtros do feed (Início e drill-down da disciplina), sempre em card próprio — nunca solta no papel.

- **Container:** card branco (borda 2px, raio 8px, sombra 4px), padding 16px (p-4).
- **Busca textual:** cavidade (raio 12px, borda 2px, sem sombra) com ícone Search à esquerda; quando engajada (há texto), acende **Azul Pastel** — a cavidade guarda tinta. Botão de limpar (X) aparece dentro da cavidade quando há texto, com tooltip.
- **Filtro Select (Plataformas / Categoria):** rótulo em cima (`text-xs font-bold` neutral-700) e trigger na altura dos botões sm do feed (34px), branco; filtro engajado (≠ "Todas"/"Tudo") vira **Azul Caneta Ação** cheio com texto branco e hover **Azul Caneta Pressionado** — mesmo padrão dos filtros de estado de Disciplinas: engajamento veste a cor cheia da família.
- **Link de serviço:** ações terciárias de barra ("Limpar filtros", "Selecionar tudo") são texto sublinhado (Micro, bold, neutral-500 → preto no hover, ring padrão), nunca adesivo.
- **Modo Selecionar:** o card expande para baixo (`grid-template-rows` 0fr→1fr, 150ms ease-out; `aria-hidden` + `inert` quando recolhido) e revela a barra de lote sob divisor black/10: contagem à esquerda (número em **Azul Caneta Ação**) + link "Selecionar tudo"; ações à direita, todas sm (accent **Concluir**, outline **Arquivar**/**Desarquivar** conforme a vista, ghost **Cancelar**). O botão **Selecionar** (outline sm, `aria-pressed`) entra e sai do modo; Esc sai.
- **Arquivados:** alternador-pill com `aria-pressed`: inativo outline branco; ativo fundo **Cinza Tinta** (neutral-800), texto branco, hover preto.

**A Regra do Link de Serviço.** Dentro de uma barra, ação que corrige ou auxilia (limpar, selecionar tudo) é texto sublinhado, não adesivo — o adesivo (borda + sombra) é a ação principal da linha; se tudo é botão, nada é.

### Toolbar do Catálogo (Avaliações)
Segunda barra de ferramentas do sistema, mesma gramática da Toolbar do Feed com dois acréscimos próprios:

- **Busca:** mesma cavidade (engajada = Azul Pastel, X de limpar com tooltip).
- **Segmented Control md** (Professores | Disciplinas) na mesma linha da busca.
- **Filtros com rótulo:** Campus e Dificuldade engajam em azul cheio; **Ordenar por** nunca engaja — ordenação não é filtro, trigger fica branco sempre.
- **Switch de contexto:** "Filtrar pelo meu curso" com rótulo bold à esquerda, à direita da linha de filtros.
- **Contagem filtrada:** rodapé da toolbar com divisor superior black/10 (`border-t-2 pt-2`), texto bold — variante da barra de papel do feed.

### Checkbox
- **Estilo:** 20px, raio 6px, borda preta 2px, sombra micro 1px; vazio branco (hover Cinza Papel), check Lucide stroke 3.
- **Cor por significado:** seleção veste **Azul Caneta Ação** com texto branco; conclusão veste **Verde Giz** com texto preto (A Regra da Cor por Significado).
- **Física micro:** hover afunda 0.5px e a sombra some; active afunda 1px sem sombra — a exceção confirmada ao Snap Inteiro (sombra de 1px não tem meio inteiro).
- **A11y:** `role="checkbox"` + `aria-checked`; ring de foco padrão via teclado.
- **Versão grande (24px, lista do Fluxograma):** mesma anatomia com sombra de ação 2px e física de snap inteiro (hover +1px/sombra 1px, active +2px/sombra none); vazia mostra ponto interno de 8px com contorno preto em vez de vazio absoluto.

### Chips (tabs e filtros)
- **Style:** pill retangular raio 12px, borda preta 2px, branco com texto preto; ativa vira **Azul Caneta Ação** com texto branco; contador em sub-pill (Micro, 11px, bold) com cores invertidas. Tabs-chip vivem hoje na Grade (lista de turmas selecionadas); o feed filtra por Filtro Select (Toolbar do Feed).
- **State:** mesma física de botão na escala 2px, já em snap inteiro (hover +1px,+1px com sombra 2px→1px; active +2px,+2px com sombra none); mesmo ring de foco via teclado.
- **Filtros de estado (Disciplinas):** Buttons outline `sm` tintados com o pastel da própria família em repouso (Cursando **Azul Pastel**, Disponíveis **Amarelo Pastel**, hover lavado a 40%) e cor cheia da família quando ativos (primary, accent, yellow); rótulo carrega o contador entre parênteses e `title` explica o filtro. Marcador de obrigatória nas listas: asterisco font-black **Vermelho Correção Forte** ao lado do nome.

### Segmented Control (Lista | Mapa)
- **Container:** cavidade do fichário — branco, borda preta 2px, raio 12px, **sem sombra**; padding interno 2px, duas colunas iguais.
- **Thumb-adesivo:** o segmento ativo é o adesivo de ação — pill **Azul Caneta Ação** (raio 8px) que desliza de cavidade em cavidade em 150ms ease-out, sempre via `transform` (nunca `left`/`top`); reduced-motion já pula direto pelas transições globais de 1ms. O adesivo é `aria-hidden` e `pointer-events-none` — quem carrega o estado é o botão.
- **Segmento:** botão interno raio 8px, altura 32px, font-black com ícone Lucide 14px, transparente sobre a cavidade (inativo ganha Cinza Papel no hover, texto vira branco sobre o thumb); micro-afundar de 1px no active; `aria-pressed` marca o estado; ring de foco padrão via teclado.
- **Tamanho:** 32px é o padrão (Lista | Mapa); a variante `md` (segmento de 36px, cavidade de 44px) existe para emparelhar o controle com um input de 44px na mesma linha (busca da Avaliação de Professores).

### Switch
- **Style:** pill 44×24px, borda preta 2px; trilho Cinza (neutral-200) desligado, **Azul Caneta Ação** ligado; thumb branco 18px com borda preta 2px, deslizando em 150ms ease-out.
- **State:** sem física de afundar — o gesto é o deslize do thumb; ring de foco padrão via teclado. Usado em Settings (autostart, efeito sonoro) e na toolbar do catálogo ("Filtrar pelo meu curso").

### Slider
- **Style:** trilho-cavidade pill de 12px de altura (h-3), fundo neutral-200, borda preta 2px; preenchimento **Azul Caneta Ação**; thumb-adesivo branco de 20px, borda 2px, Micro-adesivo 1px.
- **State:** o valor é a tinta que sobe no trilho — sem física de afundar; ring de foco padrão via teclado; disabled opacity 50%.

### Accordion
- **Item:** divisor de fichário — borda preta 2px. No Fluxograma a lista vive dentro de um card: itens sem bordas laterais, separados por `border-t-2` (o primeiro sem divisor).
- **Trigger:** linha inteira clicável, `text-[11px] font-black uppercase tracking-wider`, hover Cinza Papel; ChevronDown de 20px gira 180° em 200ms; badge de estado (ex. "Concluído" em Verde Giz) ao lado do rótulo; metadados à direita em 11px/700 Tinta Suave, sem uppercase.
- **Conteúdo:** fundo branco, padding 4 (p-4) ou p-0 quando a lista preenche; abre por altura em 200ms ease-out (`data-starting-style:h-0`).
- **Foco:** ring de 3px Azul Caneta Ação (variante própria do accordion; o resto do sistema usa ring de 2px).

### Cards / Containers
- **Corner Style:** 8px (rounded-lg) — adesivo de conteúdo, distinto do botão de ação (16px).
- **Background:** branco padrão; variantes pastel (Azul/Verde/Amarelo/Lilás Pastel) para destaque de seção; concluído usa Cinza Papel com opacity 75%.
- **Shadow Strategy:** Adesivo de card (4px 4px #000).
- **Card clicável** (ex.: disciplina na lista de Disciplinas, cards de professor/disciplina do catálogo, nó do Fluxograma): corpo de conteúdo (raio 8px, sombra 4px) com comportamento de ação — cursor, foco visível, física de afundar na escala 4px (hover +2px/sombra 2px, active +4px/shadow-none) e semântica de botão (`role="button"`, `tabIndex`, Enter/Espaço).
- **Border:** preta, 2px.
- **Internal Padding:** 24px (p-6) no card padrão; cards de trabalho da Grade, das toolbars e dos drill-downs compactos usam 16px (p-4) — densidade de ferramenta, decisão válida onde a tela é o buffer de trabalho; footer de card com borda superior black/10; card de lista (p-0) abre com a barra de contagem quando filtrado.

### Cards de Métrica (stat cards)
- **Corner Style:** 12px (rounded-xl) — painel de pausa; sombra de card 4px; padding 16px.
- **Anatomia:** cabeçalho com rótulo uppercase 12px/800 Tinta Suave + bloco-ícone de 32px (pastel da família, borda 2px, raio 8px, Micro-adesivo 1px); número em **Stat** 3rem/800 com unidade ("h", "%") e nota 12px/700 ao lado; rodapé 11px/700 Tinta Suave.
- **Barra de progresso:** trilho pill de 14px (h-3.5), fundo neutral-100, borda 2px, padding interno 2px, Micro-adesivo 1px; preenchimento **Verde Giz** com borda preta de 1px, pill, animado em 500ms; `role="progressbar"` com `aria-valuenow`.
- **Faixa de indicadores (drill-downs):** variante interna de card: `grid-cols-3` com divisores verticais `divide-x-2 divide-black/10`, cada célula centrada — rótulo uppercase 11px/800, número **Stat** 2rem/800, nota 11px/700 Tinta Suave.

### Inputs / Fields
- **Style:** fundo branco, borda preta 2px, raio 12px, padding 10px 16px, texto 0.875rem/500; label acima em 0.75rem/700.
- **Focus:** ring de 2px **Azul Caneta Ação**, sem glow.
- **Error:** borda e ring **Vermelho Correção Forte** (#DC2626, não-texto), mensagem abaixo em 0.75rem/700 **Vermelho Erro** (#B91C1C).
- **Disabled:** opacity 50%, fundo Cinza Papel.
- **Cofre (accordion de plataformas):** no painel de Settings (variante panel), matrícula/senha ficam lado a lado em duas colunas quando o painel tem ≥580px (container query), empilhados em janelas estreitas; no onboarding (variante stickers) ficam sempre em coluna.
- **Inputs mini (IRA):** linhas densas da calculadora usam inputs e selects de 28px (h-7) com texto 11px/800 tabular-nums — células de planilha, não formulário.

### Navigation (Sidebar Ledger)
- **Style:** coluna full-bleed: cada item é uma faixa inteira separada por borda preta 2px (estilo fichário). Item ativo: fundo **Azul Caneta Ação** cheio, texto branco, font-black. Inativo: branco, font-bold, hover Cinza Papel.
- **States:** sem sombra e sem física de pressionar — a navegação é a encadernação, não um adesivo. Colapsável (264px ↔ 80px); recolhida mostra só ícones centralizados; botões de expandir/recolher aparecem no hover do grupo.

### Badge (etiqueta de plataforma/tipo/prazo)
- **Style:** pill (9999px), borda preta 2px, **sem sombra** — etiqueta de tinta colada no papel, não adesivo; padding 2px 12px (md) / 2px 8px (sm), texto 0.75rem/700 (sm em 11px/700). Cor por identidade: Sigaa **Azul UnB** (#468AFB, texto preto), Aprender 3 **Laranja Moodle** (#F98012, texto preto), Teams **Roxo Fluent** (#5B5FC7, texto branco), tarefa **Amarelo Marca-Texto**, prazo urgente **Vermelho Correção Forte** (texto branco), prazo próximo **Amarelo Marca-Texto**, primária **Azul Caneta Ação** (texto branco), aviso **Cinza Nota** (slate-200), sucesso **Verde Giz**, roxa **Lilás Caderno**, neutra/outline branca. No escuro, badges de família viram noturnas: fundo lavado da família, tinta clara da própria família como texto e a MESMA borda de giz do sistema — contorno nunca vira preto em uma badge e claro na vizinha.
- **Truncamento:** badge de disciplina com texto longo usa `max-w` + truncate no conteúdo interno — a pílula segura a largura, o texto corta (sino de prazos: max-w-[118px]).
- **Icon:** Lucide 14–16px, stroke 2.5, opcional à esquerda.
- **Badge de contagem do sino:** 18px de altura mínima, **Vermelho Correção Forte** com texto branco, borda 2px, pill — colado no canto do ícone, `aria-hidden` (o `aria-label` do sino carrega o número).

### Alert
- **Style:** fundo pastel por variante, borda preta 2px, raio 8px, sombra 4px; ícone em bloco branco próprio (borda 2px, raio 8px, sombra micro 2px); título 0.875rem/700, descrição 0.75rem/600. Aceita ação de barra (`aside`) à direita — botão outline sm ("Ver Planilha").

### Toast
- **Style:** folha de **Papel Quadriculado** (bg-canvas), borda preta 2px, raio 8px, **sem sombra** — A Regra do Popup de Papel; padding 12px 16px; empilha no canto inferior direito (max-w-sm) com escala decrescente (−10% por profundidade) e peek de 12px.
- **Anatomia:** ícone Lucide de 16px por tipo (success CircleCheck, info Info, warning TriangleAlert, error OctagonX, loading Loader2 girando); título 0.875rem/800 tracking apertado; descrição 0.875rem/600 neutral-800; ação = botão outline sm; fechar = ghost icon 28px sem borda, sem sombra, hover opacity 70%.
- **Motion:** entra subindo (translateY 150%), sai deslizando na direção do swipe ou caindo; 500ms cubic-bezier(0.22,1,0.36,1) — física da pilha, não a de adesivo (não afunda: flutua por cima do app como pilha de papéis).

### Tooltip
- **Style:** folha de papel (bg-canvas), borda 2px, raio 8px, padding 8px 12px, texto 0.75rem/600, **sem sombra**; seta não existe — offset de 4px da âncora.
- **Rich tooltip:** variação de conteúdo com título font-black, meta mono 11px/700 e listas (`space-y-0.5`); max-w de 260–320px.
- **Trigger de ajuda:** elemento com `cursor-help` e ring de foco padrão via teclado (ex. Selo Consenso).

### Feed List (edição, não planilha)
- **Formato:** lista de linhas gordas de duas alturas, **sem cabeçalho de coluna** — título bold em cima, meta inline embaixo (badge de plataforma, chip da disciplina, "Enviado em…", "Entrega…"). A clareza vem dos rótulos inline, não de colunas.
- **Corpo de conteúdo:** vive dentro de um Card `p-0` (borda, raio 8px, sombra 4px); divisor preto de 2px em black/10 entre linhas; ícone do tipo à esquerda (ClipboardList trabalho, FileText aviso) como o ícone de PR do GitHub.
- **Densidade:** padding vertical 16px; título em 1 linha truncada com tooltip nativo do browser (`title`) ancorado nele. Ações (abrir na plataforma, concluir, arquivar/desarquivar) moram no menu de reticências que fecha a linha — e não propagam clique.
- **Direita:** Badge sm de prazo (urgente **Vermelho Correção Forte**, próximo **Amarelo Marca-Texto**), uma só, alinhada à direita (some em janela estreita); a data completa vive na meta ("Entrega…").
- **Estado na linha:** concluído lê mais forte que arquivado — concluído em Cinza Papel presente (neutral-100) com título riscado e **badges da linha esmaecidas a 50%** (a linha inteira lê "done"); arquivado no neutral-50 com título esmaecido. No hover a linha afunda um tom a partir do próprio repouso (normal → neutral-50, arquivada → neutral-100/70, concluída → neutral-200/70) em 150ms — localizador de mouse, não adesivo.
- **Modo Selecionar:** o checkbox de seleção ocupa o slot esquerdo (o de conclusão/tipo some); a linha inteira alterna a seleção (`cursor-pointer`, clique com Shift em cascata) e a linha selecionada acende **Azul Pastel**; controles internos não propagam o clique. Seleção vive por página/filtro: trocar filtro, página ou sair da vista derruba o modo.
- **Chip da disciplina:** mostra o **nome oficial da disciplina no SIGAA**, resolvido pela associação de turmas — nunca o nome da turma do Aprender 3 nem o código de turma; no feed de uma disciplina específica (drill-down) o chip não existe — repetiria o contexto da tela.
- **Detalhes da disciplina (drill-down):** card de contexto em p-4: badges sm das plataformas presentes + meta SIGAA (turma, Prof., Sala, horário, semestre) numa linha só, separada por " · " e por divisor vertical de 1px black/15 — item sem dado não entra na linha. Botões "Acessar na plataforma" não existem mais nesta tela; o acesso mora nas ações da linha.

### Sino de Prazos (DeadlineBell)
- **Trigger:** sino ghost icon 40px (rounded-xl) no cabeçalho; badge de contagem **Vermelho Correção Forte** colado no canto quando há pendências; `aria-label` anuncia o número.
- **Popup:** inbox de 380px, folha de **Papel Quadriculado** (A Regra do Popup de Papel), borda 2px, raio 8px, altura máx. 28rem; cabeçalho com sino azul + título 0.875rem/800 e Badge sm de total ("N pendências") ou "Em dia"; corpo rolável com `overscroll-contain`.
- **Seções de urgência:** rótulos uppercase 11px/800 — "Atrasadas" e "Vence hoje" em **Vermelho Erro**, "Amanhã" e "Próximos dias" em neutral-500; entre seções, divisores `divide-y-2 black/15`.
- **Linha:** check de conclusão de 20px (Verde Giz quando feito — mesma física micro do feed), título bold truncado, meta inline 11px/600 (badge de plataforma, badge de disciplina truncada, "Entrega dd/mm hh:mm" — "Encerrou em" quando atrasada, data em **Vermelho Erro**); linha atrasada em **Vermelho Pastel** (hover red-100), normal hover neutral-200/60; ação de abrir na plataforma = ícone ExternalLink fantasma à direita.
- **Comportamento:** snapshot congelado na abertura — item marcado fica na lista com check até o popup fechar, quando o refresh sincroniza lista e badge.
- **Estado vazio:** bloco-ícone de 48px branco (borda 2px, sombra de ação 2px) com BellOff azul, título 1rem/700 e explicação 0.75rem/500 máx. 260px.

### Dropdown Menu
- **Trigger:** micro-ação ghost de reticências (MoreHorizontal), raio 8px, física 2px.
- **Popup:** fundo **Papel Quadriculado** (`bg-canvas`) — o mesmo papel dos tooltips e do popup do Select na Grade. Raio 8px, borda preta 2px, padding 4px, **sem sombra**: o contorno preto faz o destaque, não a elevação. Exceção declarada: o menu do nó do Fluxograma é branco com Adesivo de card 4px, com cabeçalho interno (código mono + nome) sob divisor black/10.
- **Item:** raio 8px, texto preto; hover e teclado acendem **Azul Caneta Ação** com texto branco — mesmo tratamento do SelectItem, um azul só de seleção no app.

### Empty State (EmptyState)
- **Character:** pausa com rosto — o mascote **Saruê em dúvida** (`sarue-doubt.png`, 144–176px) é a ilustração; não leva ícone de Lucide (props de ícone foram aposentadas).
- **Style:** card branco raio 12px (rounded-xl), borda 2px, sombra 4px, p-8 centrado; título 1rem/800, descrição Micro bold neutral-600 em máx. 28rem, ação abaixo com respiro de 20px.

### Pagination
- **Números:** micro-ação 32px, raio 8px, física 2px; página atual vira **Azul Caneta Ação** travada (`aria-current="page"`). Setas são Button outline icon 32px. Janela compacta: primeira, última, vizinhas da atual, reticências no meio.

### Skeleton (conteúdo sem tinta)
- **Style:** bloco neutro (#E5E5E5, neutral-200), raio pequeno de conteúdo (4px), pulso lento (`animate-pulse`); desligado com `prefers-reduced-motion` e com o toggle "Reduzir animações" de Settings.
- **Border:** nenhuma — ver A Regra do Bloco Sem Borda.
- **FeedListSkeleton / MyCourseSkeleton:** espelham a geometria exata das seções reais (linhas de duas alturas com pill de prazo; banner, grade de métricas, "Cursando agora" pastel e accordion de semestres), com **larguras variadas e determinísticas** por linha — página viva, não fileira de blocos iguais; a troca skeleton → conteúdo acontece sem salto de layout.
- **Quando existe:** só na primeira carga (`isLoading` sem carga concluída). Refetch local (SQLite) troca o conteúdo no lugar, sem skeleton, dim ou spinner intermediário — piscar é shift, não feedback.

**A Regra do Bloco Sem Borda.** Skeleton é conteúdo à espera de tinta: bloco neutro pulsante, nunca adesivo — borda e sombra pertencem ao Card que o contém. Bloco de loading com risco preto finge ser conteúdo.

### Avaliações de Professores (catálogo e relatos)
- **Catálogo (ClickableCard):** card clicável padrão (raio 8px, sombra 4px, física de escala 4px, `role="button"`) em grade de 2 colunas; título do card em font-black **vira Azul Caneta Ação no hover do grupo** — mesmo efeito no link "Ver relatos →" (11px/800 sublinhado com decoration-2); rodapé com divisor black/10: "% recomendam" com ThumbsUp **Verde OK** + contagem de relatos.
- **Nota de didática no catálogo:** badge retangular (raio 6px, borda 2px, Micro-adesivo 1px) com estrela preenchida (fill-current) — cor pela Escala de Didática.
- **Selo Consenso:** Badge amarela com Medal **amber-700**, `cursor-help`, tooltip explica o critério ("a partir de N relatos com nível parecido"); focável por teclado com ring padrão. Só existe com consenso confirmado + mínimo de relatos.
- **Relato (ReviewCard):** card p-6; cabeçalho com badge de recomendação (sim = success, depende = yellow, não = urgent, sem resposta = outline) + badge de campus; linha de contexto com ícones neutral-500 (BookOpen, Building2) separada por "·"; **bloco da nota** à direita (raio 8px, borda 2px, Micro-adesivo 1px, cor por faixa). **Feedback Sincero** em bloco **Creme Papel** próprio (borda 2px, Micro-adesivo 1px, rótulo uppercase com ícone de citação azul); parâmetros inline separados por "·"; rodapé com método de avaliação, data e disclosure "Mais detalhes" (texto bold + chevron girando) que abre grade 2–4 colunas de curiosidades (dt uppercase 11px/800, dd bold).
- **Drill-down (professor ou disciplina):** PageHeader com botão outline sm "Voltar" (ArrowLeft); card-resumo p-6 com badges, Selo Consenso e faixa de indicadores 3 colunas; contagem de recomendação em três linhas coloridas (sim **Verde OK** com CheckCircle2, depende neutral-700 com HelpCircle, não **Vermelho Erro** com XCircle); disciplinas avaliadas como pills (neutral-100, borda 2px, raio 8px, 12px/700); lista de relatos com ReviewCard `detailed` + Pagination; botão "Voltar" redundante ao final da listagem.

### Calculadora de IRA
- **Painel de resultado:** card p-5 colado no topo; rótulos uppercase 11px/800; IRA calculado em **Stat** 3rem/800 com "escala 0–5" ao lado; IRA oficial do SIGAA em 1.5rem/800 neutral-600; pill de discrepância ≥ 0.05 (**Amarelo Pastel**, borda 2px, pill, Micro-adesivo 1px, título explicativo); contadores à direita (número preto extrabold + rótulo bold); restauração em dois cliques: outline sm "Restaurar histórico real" vira destructive sm "Confirmar restauração" por 4s; faixa de estado em **Amarelo Pastel** (simulação ativa ou margem de erro) com ícone Info stroke 2.5.
- **Card de semestre:** raio 8px, borda 2px, sombra 4px; cabeçalho pastel por tipo — histórico **Azul Pastel**, sem período **Amarelo Pastel**, atual **Verde Pastel**, futuro neutral-50 — com rótulo 12px/800, IRA do semestre em 11px/800 tabular-nums e pill de período (branca, borda 2px, 11px/800); **semestre futuro vazio é cavidade tracejada** (`border-dashed black/15`, sem sombra — o mesmo gesto da célula vazia da Grade); linhas de disciplina em `divide-y black/10` com input mini de créditos (w-14) e Select de menção (h-7, valor em font-black); remover = ícone fantasma com hover **Vermelho Pastel**; rodapé com ghost "Adicionar disciplina" 11px/800.

### Signature: Grade Horária (ScheduleTimetable)
O componente mais identitário: tabela de 7 colunas (Seg–Sáb) × 15 linhas de horário (turnos M/T/N), cabeçalhos de dia como mini-adesivos (Cinza Papel, borda preta 2px, sem sombra), células de aula em uma de 6 cores de disciplina (par fundo-pastel + borda de tinta + texto escuro da mesma família: azul, verde, amarelo, roxo, laranja, céu). Célula vazia é cavidade tracejada (`border-dashed` black/15 sobre Cinza Papel); conflito é borda **Vermelho Correção Forte** + **Vermelho Pastel** com texto **Vermelho Erro** e sombra micro. Cabeçalho institucional em uppercase font-black **Azul Caneta Ação**. Container rolável é região focável por teclado; células de aula e conflito são focáveis com `aria-label` (mesmo conteúdo do `title`). Exporta como PNG.

### Signature: Fluxograma (Meu Curso)
Segunda superfície assinatura: o curso como **mural de adesivos sobre papel** — grafo de pré-requisitos desenhado à caneta, em duas vistas (Segmented Control Lista | Mapa).

- **Vocabulário de status (fechado, 5 estados):** concluída **Verde Giz** (texto preto, check stroke 3), cursando **Azul Caneta Ação** (texto branco, ícone CircleDotDashed), disponível **Amarelo Marca-Texto** (texto preto, cadeado aberto), bloqueada **Cinza Papel** (texto neutral-600, cadeado), optativa em **Lilás Caderno** (cheia quando disponível, **Lilás Pastel** quando bloqueada/concluída). O mesmo idioma vale no mapa, na lista e no minimapa.
- **Nó-adesivo (mapa):** 212×78px, raio 8px, borda 2px, sombra de card 4px, física de card clicável (hover +2px/sombra 2px, active +4px/none); pill de código mono (borda 1px), pill de semestre ("3º"/"OPT"), badge "Optativa" pill lilás; nome em 11px/800 2 linhas, carga em 11px/700; esmaecimento por filtro = opacity 30%; tooltip rico explica status, nota, pré-requisitos que faltam.
- **Aresta-caneta:** traço ortogonal de caneta (smooth-step, raio 12) preto de **2px**; no hover do nó, a cadeia ancestral inteira acende (aresta **3px**) e o resto esmaece a 25% — a caneta repassa o caminho.
- **Papel do canvas:** grid de 32px (React Flow Background Lines, rgba(0,0,0,0.06)) que escala com o zoom; pan e zoom (0.1–1.6); nós não arrastam (layout dagre em faixas horizontais por cadeia, isoladas em grade compacta abaixo).
- **Pinos:** handles pretos de 6px onde a caneta encosta no adesivo.
- **Controles de canvas:** zoom−/zoom+/enquadrar como adesivos de ação compactos (28px, raio 12px, borda 2px, sombra 2px, física completa) no canto superior direito; chip **Amarelo Marca-Texto** "Mapa fora de vista — Reenquadrar" no topo central quando o watchdog detecta o grafo fora da tela.
- **Minimapa:** desenhado à mão (não o da lib) — painel branco 168×112, borda 2px, raio 12px, sombra 2px, com mini-retângulos por status (borda 1px, raio 2px); clicável para navegar.
- **Erro:** boundary própria — adesivo **Vermelho Pastel** (borda 2px, sombra 4px) com "Tentar de novo" outline; dados declarados intactos.
- **Lista:** accordion de semestres dentro de card (busca + filtros no cabeçalho com divisor de borda cheia); linha de disciplina com check de 24px, pill de código mono, nome truncado (riscado quando concluída), asterisco de obrigatória **Vermelho Correção Forte**, pill "Pré-requisitos" (hover **Amarelo Pastel**) com tooltip rico, carga à direita; micro-ação de hover "Enviar para o Montar Grade" (borda 1px, **Amarelo Pastel** no hover, Micro-adesivo 1px); semestre todo concluído ganha Badge success no trigger.
- **Cursando agora:** painel **Azul Pastel** (borda 2px, sombra 4px, `aria-live="polite"`) com grade de mini-cards brancos (min-h-28, pill de código + carga, nome 12px/800 2 linhas); itens fora da busca esmaecem a 40%.
- **Troca de matriz (dialog):** linhas de opção com borda 2px e sombra de ação 2px; matriz atual em **Verde Pastel** com selo "Atual" (Verde Giz, check stroke 3); código em pill mono; status "Ativa" em Verde Giz / inativa em neutral-200.

## Do's and Don'ts

### Do:
- **Do** dar borda preta de 2px a toda superfície e elemento interativo (A Regra do Risco Preto); pills de código mono usam borda de 1px.
- **Do** usar sombra dura deslocada preta (`Xpx Xpx 0 0 #000`) e física completa: hover afunda com snap inteiro, active afunda tudo, disabled congela.
- **Do** usar azul para seleção e **Verde Giz** só para conclusão — checkbox azul de selecionar, verde de concluir (A Regra da Cor por Significado).
- **Do** usar a Escala de Didática por faixa (≥ 8 verde, ≥ 6 amarelo, < 6 vermelho forte, sem nota cinza) — nunca tom contínuo nem degradê (A Regra da Nota por Faixa).
- **Do** usar folha de **Papel Quadriculado** sem sombra para todo popup de leitura/seleção — Select, Dropdown, Tooltip, Toast (A Regra do Popup de Papel).
- **Do** pôr a contagem absoluta no título da página e a contagem filtrada na barra interna do card (feed) ou no rodapé da toolbar (catálogo), sempre com o filtro visível.
- **Do** usar link sublinhado para ação terciária de barra ("Limpar filtros", "Selecionar tudo") (A Regra do Link de Serviço).
- **Do** vestir filtro engajado com a cor cheia da família (Filtro Select azul, filtros de Disciplinas com sua cor) e a cavidade de busca engajada com o pastel; ordenação nunca engaja.
- **Do** construir hierarquia com peso de fonte (800/700/600/500) e usar pastéis como fundo, nunca como cor de ação.
- **Do** usar Plus Jakarta Sans e ícones Lucide com stroke 2.5 (check de checkbox stroke 3); rótulos estruturais em uppercase bold 11–12px; códigos de disciplina em pills font-mono (A Regra do Código em Máquina).
- **Do** usar as cores de plataforma como identidade fixa (Sigaa azul UnB #468AFB, Aprender 3 laranja Moodle #F98012, Teams roxo Fluent #5B5FC7) em badges e filtros.
- **Do** usar raio e sombra como affordance (A Regra dos Dois Adesivos): ação 12–16px + sombra 2px; conteúdo 8px + sombra 4px; painel de pausa/métrica 12px; campo 12px sem sombra.
- **Do** usar Micro-adesivo 1px (`neo-xs`) em checkbox, blocos de ícone, pills inline, badge de didática e micro-ações flutuantes; badge fica sem sombra.
- **Do** usar o vocabulário fechado de status do Fluxograma (verde concluída, azul cursando, amarelo disponível, cinza bloqueada, lilás optativa) em mapa, lista e minimapa.
- **Do** dar som mecânico só com opt-in, nunca na navegação nem em elemento desabilitado (A Regra do Clique Mecânico).
- **Do** usar #2563EB/#DC2626 como fundo sob texto branco; #468AFB/#FF6B6B ficam para marca/bordas.

### Don't:
- **Don't** usar sombra com blur, box-shadow difusa, rgba ambiente ou elevação estilo Material — sombra dura ou nenhuma.
- **Don't** usar glassmorphism, backdrop-blur, gradientes ou superfícies translúcidas — o mundo é opaco.
- **Don't** usar verde para seleção ou azul para conclusão — as tintas não trocam de significado (A Regra da Cor por Significado).
- **Don't** inventar status ou cor nova para disciplina no Fluxograma — o vocabulário de 5 estados é fechado e compartilhado por mapa, lista e minimapa.
- **Don't** dar sombra a Tooltip, Toast ou popup de papel — o contorno preto faz o destaque (A Regra do Popup de Papel).
- **Don't** soltar linha de legenda de contagem acima do card — contagem vive no título (absoluta) ou na barra interna/rodapé da toolbar (filtrada).
- **Don't** dar adesivo (borda + sombra) a ação terciária de barra — é link de serviço.
- **Don't** criar elemento interativo com sombra que não afunde no active (A Regra do Afundar).
- **Don't** fazer hover levantar o adesivo (translate negativo ou sombra crescendo) — o adesivo só afunda, com snap inteiro, e fica a 1px do papel em sombra de 3px (A Regra do Afundar).
- **Don't** transladar press em meia-pixel em sombra de 2px+ — antialiasa a borda e borra o adesivo; a única exceção confirmada é o checkbox de 20px (0.5px/1px) (A Regra do Snap Inteiro).
- **Don't** enfraquecer texto reduzindo peso abaixo de font-medium; baixe o tom, mantenha o peso (A Regra do Marcador Grosso).
- **Don't** usar cor de ação cheia como fundo de seção, ou pastel como cor de botão (A Regra do Pastel como Papel).
- **Don't** tingir sombra de cor fora da Zona de Perigo — a sombra #DC2626 é exclusiva dela (A Regra da Sombra Dura).
- **Don't** colocar texto pequeno branco sobre **Azul Caneta** (#468AFB) ou **Vermelho Correção** (#FF6B6B) — são marca/borda/acento; fundo interativo sob texto branco é **Azul Caneta Ação** (#2563EB) ou **Vermelho Correção Forte** (#DC2626).
- **Don't** vestir conteúdo de botão (raio grande + sombra leve) ou botão de conteúdo (raio reto + sombra funda) — e hover nunca levanta o adesivo: sombra só cresce se o elemento for card clicável seguindo a escala 4px.
- **Don't** usar font-mono fora de códigos de disciplina e metadados de máquina — o código é carimbo, o nome é escrita à mão (A Regra do Código em Máquina).
