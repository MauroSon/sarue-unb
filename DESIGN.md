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
  scroll-thumb: "#A3A3A3"
  scroll-thumb-active: "#737373"
  discipline-ink-blue: "#2563EB"
  discipline-ink-green: "#15803D"
  discipline-ink-yellow: "#EAB308"
  discipline-ink-purple: "#A855F7"
  discipline-ink-orange: "#F97316"
  discipline-ink-sky: "#0EA5E9"
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
rounded:
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
  card-default:
    backgroundColor: "#ffffff"
    textColor: "#000000"
    rounded: "{rounded.sm}"
    padding: "24px"
  card-pastel-blue:
    backgroundColor: "{colors.pastel-blue}"
    textColor: "#000000"
    rounded: "{rounded.sm}"
    padding: "24px"
  input-default:
    backgroundColor: "#ffffff"
    textColor: "#000000"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  badge-sticker:
    backgroundColor: "#ffffff"
    textColor: "#000000"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 12px"
  skeleton-block:
    backgroundColor: "#E5E5E5"
    rounded: "4px"
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
- Hierarquia por peso de fonte, não por cinza
- Raio como affordance (A Regra dos Dois Adesivos): ação 12–16px, conteúdo 8px — clique se distingue de leitura à primeira vista
- Tudo em 150ms ease-out

## Colors

Paleta de material escolar: uma cor de ação por intenção, versões pastel das mesmas cores para superfícies de apoio, tudo costurado por preto de tinta.

### Primary
- **Azul Caneta Ação** (#2563EB): a cor de ação do produto. Todo fundo interativo sob texto branco e todo texto/ícone informativo sobre branco: botões primários, tabs ativas, item de navegação ativo, foco de inputs (ring), links de marca ("Aggregator" no logo), ícones de cabeçalho de página. Branco sobre ela = 5.17:1 (AA). Hover escurece para **Azul Caneta Pressionado** (#1D4ED8, 6.70:1 com branco).

### Brand
- **Azul Caneta** (#468AFB): cor de marca — logo-bloco "UnB", wordmark e blocos decorativos. Isenta de contraste WCAG como logotipo; nenhum texto pequeno branco sobre ela. Nunca como fundo interativo.

### Secondary
- **Amarelo Marca-Texto** (#FFE600): ação de destaque e badge de tarefa/entrega — o amarelo de grifo em cima da leitura. Sempre com texto preto.
- **Verde Giz** (#46E297): sucesso e plataforma SIGAA. Botão accent, badges de confirmado, badges de plataforma. Texto preto.
- **Vermelho Correção** (#FF6B6B): tinta de borda/acento destrutiva — contornos, ícones e acentos sempre com TEXTO PRETO (7.57:1). Nunca fundo sob texto branco.
- **Vermelho Correção Forte** (#DC2626): destrutivo e urgente com texto branco. Botão destructive, badge urgent (4.83:1), prazos vencidos ou < 24h. Hover escurece para **Vermelho Erro** (#B91C1C, 6.47:1).

### Tertiary
- **Lápis Laranja** (#FB923C): identidade da plataforma Aprender 3, texto preto.
- **Lilás Caderno** (#C084FC): variante purple de card, texto preto.
- **Azul Céu** (#60A5FA): identidade da plataforma Teams (reservado — plataforma em revisão no produto).
- **Verde Institucional** (#006633): verde oficial UnB, definido no tema; uso pontual institucional.

### Neutral
- **Papel Quadriculado** (#E8EFF8): fundo do canvas do app, sempre com o grid de 32px por cima.
- **Creme Papel** (#FAF7EE): superfície alternativa quente, uso pontual.
- **Branco** (#FFFFFF): superfície padrão de cards, inputs, sidebar e botão outline.
- **Tinta Preta** (#000000): todas as bordas (2px), todas as sombras, texto primário, ícones.
- **Tinta Suave** (#525252, escala neutral-400–800 do Tailwind): texto secundário e descrições — sempre font-medium no mínimo, nunca cinza de baixo contraste em peso leve.
- **Cinza Papel** (#F5F5F5, neutral-100): preenchimentos de hover, itens desabilitados, card de item concluído.

### Tintas de apoio
- **Verde OK** (#15803D): texto de confirmação dentro de superfícies pastel (checkmarks, selo "Zero Telemetria"). 5.02:1 sobre branco.
- **Vermelho Erro** (#B91C1C): texto de erro sobre branco (mensagem de input); também é o hover do destrutivo. Bordas/rings de erro usam #DC2626 (não-texto).

### Tintas de Grade e Scrollbar
Inks escuras da mesma família das cores de ação, usadas como TEXTO e borda interna das células da Grade Horária sobre os pastéis, e no thumb da scrollbar. Texto da tinta sobre o pastel correspondente passa AA.

- **Tinta Azul** (#2563EB) / **Tinta Verde** (#15803D) / **Tinta Amarela** (#EAB308) / **Tinta Roxa** (#A855F7) / **Tinta Laranja** (#F97316) / **Tinta Céu** (#0EA5E9): par tinta+pastel da disciplina (Azul Pastel, Verde Pastel, Amarelo Pastel, Lilás Pastel, Laranja sobre #FFEDD5, Céu sobre #E0F2FE).
- **Thumb de Scroll** (#A3A3A3, hover #737373): scrollbar com borda preta de 2px, mantendo o estilo adesivo.

### Pastéis (superfícies, nunca texto)
Versões lavadas das cores de ação, usadas como fundo de cards variante, alerts, blocos de ícone e filtros — sempre com texto preto e borda preta: **Azul Pastel** (#EBF3FF), **Verde Pastel** (#E6F8EE), **Amarelo Pastel** (#FFF9D2), **Lilás Pastel** (#F3E8FF), **Vermelho Pastel** (#FFEBEB), **Laranja Pastel** (#FFEDD5), **Céu Pastel** (#E0F2FE).

### Named Rules
**A Regra do Risco Preto.** Nenhuma superfície ou elemento interativo existe sem borda preta de 2px. A borda é o contorno do adesivo; sem ela o elemento cai fora do mundo.

**A Regra do Pastel como Papel.** Cores de ação (caneta, giz, correção) marcam interação e identidade; as versões pastel servem de papel de fundo. Uma nunca faz o trabalho da outra: pastel nunca é botão, cor cheia nunca é fundo de seção inteira.

## Typography

**Display Font:** Plus Jakarta Sans (fallback system-ui, -apple-system, sans-serif)
**Body Font:** Plus Jakarta Sans (fallback system-ui, -apple-system, sans-serif)

**Character:** Geométrica e arredondada, com personalidade de app jovem — o peso extremo (800, teto real da família Plus Jakarta Sans, variable 200–800; usos `font-black` renderizam 800) dá voz de marcador grosso, enquanto 500/600 mantêm corpo de produto legível.

### Hierarchy
- **Display** (800, clamp(2.25rem, 5vw, 3rem), 1.1, tracking -0.02em): título de boas-vindas no onboarding ("Saruê UnB"). Único momento de hero.
- **Title** (800, 1.5rem, 1.25, tracking -0.01em): cabeçalho de página (PageHeader), com ícone azul de 24px ao lado.
- **Heading** (700, 1.125rem, 1.4, tracking -0.01em): título de card (CardTitle).
- **Body** (500, 0.875rem, 1.5): conteúdo de cards, descrições, itens de lista. Texto secundário em neutral-600/700 mesma faixa de tamanho.
- **Label** (700, 0.75rem, 1.4): labels de input, badges, botões, tabs. Versão uppercase com tracking 0.05em para rótulos de grupo (SelectLabel, cabeçalhos da grade).
- **Micro** (700, 0.6875rem/11px, 1.4): rótulos mínimos — contadores, badges sm, micro-etiquetas. 10px está banido do sistema.

### Named Rules
**A Regra do Marcador Grosso.** Hierarquia vem de peso (800 → 700 → 600 → 500), não de esmaecer cinza. Nunca enfraqueça texto baixando o peso para abaixo de 500 — baixe o tom (neutral-600) mantendo o peso.

**A Regra do Rótulo Gritado.** Rótulos estruturais (grupos, cabeçalhos de tabela, micro-cabeçalhos) são uppercase, font-black ou font-bold, 11–12px. Dá o tom de etiqueta de fichário.

## Layout

App desktop (janela Tauri), desktop-first. Estrutura permanente: sidebar branca à esquerda com borda direita preta de 2px, expandida em 264px (w-64) ou recolhida em 80px (w-20), contendo logo-bloco, navegação ledger e ações de sync na base. O conteúdo vive sobre o **Papel Quadriculado** (#E8EFF8 com grid de 32px em rgba(0,0,0,0.05)) e é centrado em container de no máximo 1152px (max-w-6xl) com ritmo vertical de 24px entre blocos (space-y-6) e respiro inferior de 48px.

Densidade: cards com padding interno de 24px, gaps de 8–16px entre controles, listas com cards empilhados. Grids internos usam gap de 6px (grade horária) a 10px (tabs). Breakpoints Tailwind padrão existem para janelas estreitas (sm 640px, md 768px, lg 1024px), mas o alvo é janela de desktop; nada de layout de mobile.

## Elevation & Depth

Profundidade é **física e estrutural**: sombras são deslocamentos sólidos de tinta preta, sem blur, sem cor ambiente. Um elemento "senta" sobre o papel e sua sombra diz quanto peso ele tem. A interação muda a física: hover afunda com snap inteiro (o elemento translada o maior número inteiro de pixels da direção da sombra e ela encolhe o equivalente — em sombra de 3px, translate 2px e sombra 1px, ficando a 1px do papel), active afunda tudo (translada o offset completo e a sombra some — a superfície toca o papel), disabled desmira (opacity 50%, sem movimento).

### Shadow Vocabulary
- **Sticker micro / Adesivo de ação** (`2px 2px 0 0 #000`, token `neo-sm`): todo botão, tab/chip e micro-ação permanente em repouso; logo-bloco, ícones de collapse.
- **Micro-adesivo** (`1px 1px 0 0 #000`, token `neo-xs`): o que pesa menos que um adesivo de ação em repouso — blocos de ícone pastel, pills de resultado inline, barra de progresso, micro-ações flutuantes de ferramenta; também é a sombra do estágio hover da escala 2px.
- **Adesivo de card** (`4px 4px 0 0 #000`, token `neo`): cards, alerts, painéis e popups de conteúdo.
- **Ênfase máxima** (`6px 6px 0 0 #000`, token `neo-lg`): diálogo modal — a única superfície acima de todo o app.
- **Sombra tingida de perigo** (`4px 4px 0 0 #DC2626`): exclusiva do Card da Zona de Perigo em Settings — a única sombra colorida do sistema.
- **Quase-afundado** (`1px 1px 0 0 #000`): estado hover — o elemento translada em snap inteiro o quanto a sombra encolheu (ação 2px: +1px e sombra 1px; card clicável 4px: +2px e sombra 2px).
- **Pressionado** (`shadow-none` + translate do offset completo): estado active de qualquer elemento interativo — a superfície toca o papel.
- **Divisores internos**: bordas de 2px pretas entre seções da sidebar; linhas internas de card em black/10–15%.

### Named Rules
**A Regra da Sombra Dura.** Sombra é deslocamento sólido preto, nunca blur, nunca rgba difusa, nunca cor. Se precisar de menos profundidade, diminua o deslocamento — não amacie. Única exceção declarada: a Zona de Perigo usa a sombra na própria cor do risco (#DC2626) — perigo tinge a própria física, e nenhum outro elemento.

**A Regra do Afundar.** Todo elemento interativo em repouso com sombra dura afunda em dois tempos: no hover, com snap inteiro (ação de sombra 2px: translate +1px na direção da sombra, sombra reduzida a 1px — fica a 1px do papel; card clicável de sombra 4px: +2px e sombra 2px); no active, tudo (translate +offset completo, shadow-none — a superfície toca o papel). Ghost sem sombra mantém micro-afundar de 1px no active. Elemento que levanta no hover (translate negativo ou sombra crescendo) é bug físico.

**A Regra do Snap Inteiro.** Todo translate de press é número inteiro de pixels — nunca meia-pixel (1.5px), que antialiasa a borda preta em telas de escala não-inteira e borra o adesivo. Se a metade do offset não é inteira, afunde para o inteiro imediato (metade de 3px vira 2px) e dê o resto à sombra; meia-pixel é bug de render, não refinamento.

## Shapes

**A Regra dos Dois Adesivos.** Raio e sombra dizem o que o adesivo faz — informação nunca se veste de botão, e botão nunca se veste de informação:

- **Adesivo de conteúdo** (cards, alerts, diálogos, painéis, popups, blocos decorativos): raio pequeno **8px (rounded-lg)** + sombra funda de card **4px 4px**. Canto mais reto, peso maior — papel de leitura.
- **Adesivo de ação** (botões, tabs/chips, micro-ações): raio generoso **16px (rounded-2xl)** em md/lg, **12px (rounded-xl)** em sm e ícones, **8px** em micro-ação (h-7 ou menor) + sombra leve de ação **2px 2px**. Redondo e leve — convite ao clique.
- **Campos** (inputs, selects, textareas): raio médio **12px (rounded-xl)**, sem sombra em repouso — cavidade no papel, nem conteúdo nem ação.
- **Diálogo modal**: raio de conteúdo **8px** com **Ênfase máxima 6px** — a única superfície que usa neo-lg.
- **Badges**: círculo completo (9999px), sem sombra — etiqueta de tinta, não adesivo; pills de resultado inline (fora do componente Badge) levam Micro-adesivo 1px.
- **Micro-ações flutuantes de ferramenta** (aparecem no hover do grupo, ex. "Enviar para o Monte sua Grade"): raio 6px (rounded-md), borda de 1px, Micro-adesivo 1px — adesivo menor e mais leve; o que vive permanentemente na tela usa o adesivo de ação padrão (borda 2px, sombra 2px).

A distinção se lê de longe: o que tem sombra 2px e raio 16px afunda quando clica; o que tem sombra 4px e raio 8px fica. Elementos pequenos de conteúdo (células da grade, cabeçalhos de dia, blocos de ícone) seguem o raio de conteúdo 8px. A borda-preta-2px continua universal (A Regra do Risco Preto).

Ícones são Lucide com stroke 2.5 (mais grossos que o padrão) — combinando com a espessura das bordas. O logo é um bloco quadrado de 36px, **Azul Caneta**, texto "UnB" branco font-black, borda e sombra de sticker.

## Components

### Buttons
- **Shape:** raio 16px (md e lg), 12px (sm e icon), 8px (micro-ação h-7); borda preta 2px; altura 40px (md).
- **Primary:** fundo **Azul Caneta Ação**, texto branco, fonte 700; hover **Azul Caneta Pressionado**. Variantes: accent (**Verde Giz**, texto preto; hover **Verde Giz Pressionado** #39D68A), yellow (**Amarelo Marca-Texto**, texto preto; hover #F2DA00), destructive (**Vermelho Correção Forte**, texto branco; hover **Vermelho Erro**), outline (branco, texto preto), ghost (transparente, sem borda visível, sem sombra, hover black/5).
- **Hover / Focus:** hover afunda com snap inteiro (translate +1px,+1px, sombra 2px→1px — fica a 1px do papel); active afunda tudo (translate +2px,+2px, sombra none — a superfície toca o papel). Ghost, sem sombra, micro-afunda 1px só no active. Transição 150ms ease-out. **Focus via teclado:** ring 2px **Azul Caneta Ação** com offset branco 2px, sem glow — mesmo token do Input. Disabled: opacity 50%, congela a física.
- **Loading:** spinner circular de borda 2px corrente no lugar do conteúdo.
- **Som:** clique mecânico opcional no clique de botão, link e checkbox — A Regra do Clique Mecânico (abaixo).

**A Regra do Clique Mecânico.** O som é feedback de objeto, não enfeite: opt-in, desligado por padrão (Switch "Efeito sonoro de botão" em Settings), sample de switch mecânico via Web Audio com pitch jitter de ±3% e ganho a 25% para nunca soar robótico, disparado por um listener global. A encadernação é muda: navegação da sidebar e logo-bloco levam `data-no-sound="true"`. Elemento desabilitado não faz barulho.

### Chips (tabs e filtros)
- **Style:** pill retangular raio 12px, borda preta 2px, branco com texto preto; ativa vira **Azul Caneta Ação** com texto branco; contador em sub-pill (Micro, 11px, bold) com cores invertidas.
- **State:** mesma física de botão na escala 2px, já em snap inteiro (hover +1px,+1px com sombra 2px→1px; active +2px,+2px com sombra none); mesmo ring de foco via teclado.
- **Filtros de estado (Disciplinas):** Buttons outline `sm` tintados com o pastel da própria família em repouso (Cursando **Azul Pastel**, Disponíveis **Amarelo Pastel**, hover lavado a 40%) e cor cheia da família quando ativos (primary, accent, yellow); rótulo carrega o contador entre parênteses e `title` explica o filtro. Marcador de obrigatória nas listas: asterisco font-black **Vermelho Correção Forte** ao lado do nome.

### Segmented Control (Lista | Mapa)
- **Container:** cavidade do fichário — branco, borda preta 2px, raio 12px, **sem sombra**; padding interno 2px, duas colunas iguais.
- **Thumb-adesivo:** o segmento ativo é o adesivo de ação — pill **Azul Caneta Ação** (raio 8px) que desliza de cavidade em cavidade em 150ms ease-out, sempre via `transform` (nunca `left`/`top`); reduced-motion já pula direto pelas transições globais de 1ms. O adesivo é `aria-hidden` e `pointer-events-none` — quem carrega o estado é o botão.
- **Segmento:** botão interno raio 8px, altura 32px, font-black com ícone Lucide 14px, transparente sobre a cavidade (inativo ganha Cinza Papel no hover, texto vira branco sobre o thumb); micro-afundar de 1px no active; `aria-pressed` marca o estado; ring de foco padrão via teclado.

### Switch
- **Style:** pill 44×24px, borda preta 2px; trilho Cinza (neutral-200) desligado, **Azul Caneta Ação** ligado; thumb branco 18px com borda preta 2px, deslizando em 150ms ease-out.
- **State:** sem física de afundar — o gesto é o deslize do thumb; ring de foco padrão via teclado. Usado em Settings (autostart, efeito sonoro).

### Cards / Containers
- **Corner Style:** 8px (rounded-lg) — adesivo de conteúdo, distinto do botão de ação (16px).
- **Background:** branco padrão; variantes pastel (Azul/Verde/Amarelo/Lilás Pastel) para destaque de seção; concluído usa Cinza Papel com opacity 75%.
- **Shadow Strategy:** Adesivo de card (4px 4px #000).
- **Card clicável** (ex.: disciplina na lista de Disciplinas): corpo de conteúdo (raio 8px, sombra 4px) com comportamento de ação — cursor, foco visível, física de afundar na escala 4px (hover +2px/sombra 2px, active +4px/shadow-none) e semântica de botão (`role="button"`, `tabIndex`, Enter/Espaço).
- **Border:** preta, 2px.
- **Internal Padding:** 24px (p-6) no card padrão; cards de trabalho da Grade (filtros, Minha Grade, Catálogo) usam 16px (p-4) — densidade de ferramenta, decisão válida onde a tela é o buffer de trabalho; footer de card com borda superior black/10.

### Inputs / Fields
- **Style:** fundo branco, borda preta 2px, raio 12px, padding 10px 16px, texto 0.875rem/500; label acima em 0.75rem/700.
- **Focus:** ring de 2px **Azul Caneta Ação**, sem glow.
- **Error:** borda e ring **Vermelho Correção Forte** (#DC2626, não-texto), mensagem abaixo em 0.75rem/700 **Vermelho Erro** (#B91C1C).
- **Disabled:** opacity 50%, fundo Cinza Papel.

### Navigation (Sidebar Ledger)
- **Style:** coluna full-bleed: cada item é uma faixa inteira separada por borda preta 2px (estilo fichário). Item ativo: fundo **Azul Caneta Ação** cheio, texto branco, font-black. Inativo: branco, font-bold, hover Cinza Papel.
- **States:** sem sombra e sem física de pressionar — a navegação é a encadernação, não um adesivo. Colapsável (264px ↔ 80px); recolhida mostra só ícones centralizados; botões de expandir/recolher aparecem no hover do grupo.

### Badge (etiqueta de plataforma/tipo)
- **Style:** pill (9999px), borda preta 2px, **sem sombra** — etiqueta de tinta colada no papel, não adesivo; padding 2px 12px (md) / 2px 8px (sm), texto 0.75rem/700. Cor por identidade: Sigaa **Verde Giz**, Aprender 3 **Lápis Laranja**, Teams **Azul Céu**, tarefa **Amarelo Marca-Texto**, urgente **Vermelho Correção Forte** (texto branco), primária **Azul Caneta Ação** (texto branco), aviso Cinza Nota (slate-200), neutra/outline branca.
- **Icon:** Lucide 14–16px, stroke 2.5, opcional à esquerda.

### Alert
- **Style:** fundo pastel por variante, borda preta 2px, raio 8px, sombra 4px; ícone em bloco branco próprio (borda 2px, raio 8px, sombra micro 2px); título 0.875rem/700, descrição 0.75rem/600.

### Feed List (edição, não planilha)
- **Formato:** lista de linhas gordas de duas alturas, **sem cabeçalho de coluna** — título bold em cima, meta inline embaixo (badge de plataforma, chip da disciplina, "Enviado em…", "Entrega…"). A clareza vem dos rótulos inline, não de colunas.
- **Corpo de conteúdo:** vive dentro de um Card `p-0` (borda, raio 8px, sombra 4px); divisor preto de 2px em black/10 entre linhas; ícone do tipo à esquerda (ClipboardList trabalho, FileText aviso) como o ícone de PR do GitHub.
- **Densidade:** padding vertical 16px; título em 1 linha truncada com tooltip nativo do browser (`title`) ancorado nele. Ações (abrir na plataforma, concluir, arquivar/desarquivar) moram no menu de reticências que fecha a linha.
- **Direita:** pill curto de prazo (Encerrado / <24h / 2 dias) com a data completa embaixo, alinhado à direita.
- **Estado na linha:** concluído lê mais forte que arquivado — concluído em Cinza Papel presente (neutral-100) com título riscado em neutral-600; arquivado no neutral-50 com título esmaecido. No hover a linha afunda um tom a partir do próprio repouso (normal → neutral-50, arquivada → neutral-100/70, concluída → neutral-200/70) em 150ms — localizador de mouse, não adesivo.
- **Chip da disciplina:** mostra o **nome oficial da disciplina no SIGAA**, resolvido pela associação de turmas — nunca o nome da turma do Aprender 3 nem o código de turma; no feed de uma disciplina específica (drill-down) o chip não existe — repetiria o contexto da tela.

### Dropdown Menu
- **Trigger:** micro-ação ghost de reticências (MoreHorizontal), raio 8px, física 2px.
- **Popup:** fundo **Papel Quadriculado** (`bg-canvas`) — o mesmo papel dos tooltips e do popup do Select na Grade. Raio 8px, borda preta 2px, padding 4px, **sem sombra**: o contorno preto faz o destaque, não a elevação.
- **Item:** raio 8px, texto preto; hover e teclado acendem **Azul Caneta Ação** com texto branco — mesmo tratamento do SelectItem, um azul só de seleção no app.

### Pagination
- **Números:** micro-ação 32px, raio 8px, física 2px; página atual vira **Azul Caneta Ação** travada (`aria-current="page"`). Setas são Button outline icon 32px. Janela compacta: primeira, última, vizinhas da atual, reticências no meio.

### Skeleton (conteúdo sem tinta)
- **Style:** bloco neutro (#E5E5E5, neutral-200), raio pequeno de conteúdo (4px), pulso lento (`animate-pulse`); desligado com `prefers-reduced-motion`.
- **Border:** nenhuma — ver A Regra do Bloco Sem Borda.
- **FeedListSkeleton:** espelha a geometria exata das linhas do feed (ícone à esquerda, duas alturas, meta em pills de 24px, prazo à direita em sm+) dentro do mesmo Card `p-0`, com larguras variadas por linha — a troca skeleton → conteúdo acontece sem salto de layout.
- **Quando existe:** só na primeira carga do feed (`isLoading` sem carga concluída). Refetch local (SQLite) troca o conteúdo no lugar, sem skeleton, dim ou spinner intermediário — piscar é shift, não feedback.

**A Regra do Bloco Sem Borda.** Skeleton é conteúdo à espera de tinta: bloco neutro pulsante, nunca adesivo — borda e sombra pertencem ao Card que o contém. Bloco de loading com risco preto finge ser conteúdo.

### Signature: Grade Horária (ScheduleTimetable)
O componente mais identitário: tabela de 7 colunas (Seg–Sáb) × 15 linhas de horário (turnos M/T/N), cabeçalhos de dia como mini-adesivos (Cinza Papel, borda preta 2px, sem sombra), células de aula em uma de 6 cores de disciplina (par fundo-pastel + borda de tinta + texto escuro da mesma família: azul, verde, amarelo, roxo, laranja, céu). Célula vazia é cavidade tracejada (`border-dashed` black/15 sobre Cinza Papel); conflito é borda **Vermelho Correção Forte** + **Vermelho Pastel** com texto **Vermelho Erro** e sombra micro. Cabeçalho institucional em uppercase font-black **Azul Caneta Ação**. Container rolável é região focável por teclado; células de aula e conflito são focáveis com `aria-label` (mesmo conteúdo do `title`). Exporta como PNG.

## Do's and Don'ts

### Do:
- **Do** dar borda preta de 2px a toda superfície e elemento interativo (A Regra do Risco Preto).
- **Do** usar sombra dura deslocada preta (`Xpx Xpx 0 0 #000`) e física completa: hover afunda com snap inteiro, active afunda tudo, disabled congela.
- **Do** construir hierarquia com peso de fonte (800/700/600/500) e usar pastéis como fundo, nunca como cor de ação.
- **Do** usar Plus Jakarta Sans e ícones Lucide com stroke 2.5; rótulos estruturais em uppercase bold 11–12px (Micro, 11px, para rótulos mínimos).
- **Do** usar as cores de plataforma como identidade fixa (Sigaa verde, Aprender 3 laranja) em badges e filtros.
- **Do** usar raio e sombra como affordance (A Regra dos Dois Adesivos): ação 12–16px + sombra 2px; conteúdo 8px + sombra 4px; campo 12px sem sombra.
- **Do** usar Micro-adesivo 1px (`neo-xs`) em blocos de ícone, pills inline e micro-ações flutuantes; badge fica sem sombra.
- **Do** dar som mecânico só com opt-in, nunca na navegação nem em elemento desabilitado (A Regra do Clique Mecânico).
- **Do** usar #2563EB/#DC2626 como fundo sob texto branco; #468AFB/#FF6B6B ficam para marca/bordas.

### Don't:
- **Don't** usar sombra com blur, box-shadow difusa, rgba ambiente ou elevação estilo Material — sombra dura ou nenhuma.
- **Don't** usar glassmorphism, backdrop-blur, gradientes ou superfícies translúcidas — o mundo é opaco.
- **Don't** criar elemento interativo com sombra que não afunde no active (A Regra do Afundar).
- **Don't** fazer hover levantar o adesivo (translate negativo ou sombra crescendo) — o adesivo só afunda, com snap inteiro, e fica a 1px do papel em sombra de 3px (A Regra do Afundar).
- **Don't** transladar press em meia-pixel (1.5px) — antialiasa a borda e borra o adesivo; snap para inteiro (A Regra do Snap Inteiro).
- **Don't** enfraquecer texto reduzindo peso abaixo de font-medium; baixe o tom, mantenha o peso (A Regra do Marcador Grosso).
- **Don't** usar cor de ação cheia como fundo de seção, ou pastel como cor de botão (A Regra do Pastel como Papel).
- **Don't** tingir sombra de cor fora da Zona de Perigo — a sombra #DC2626 é exclusiva dela (A Regra da Sombra Dura).
- **Don't** colocar texto pequeno branco sobre **Azul Caneta** (#468AFB) ou **Vermelho Correção** (#FF6B6B) — são marca/borda/acento; fundo interativo sob texto branco é **Azul Caneta Ação** (#2563EB) ou **Vermelho Correção Forte** (#DC2626).
- **Don't** vestir conteúdo de botão (raio grande + sombra leve) ou botão de conteúdo (raio reto + sombra funda) — e hover nunca levanta o adesivo: sombra só cresce se o elemento for card clicável seguindo a escala 4px.
