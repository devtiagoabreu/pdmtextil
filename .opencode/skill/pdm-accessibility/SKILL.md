---
name: pdm-accessibility
description: Acessibilidade (WCAG 2.2 AA) para o PDM Pro Têxtil. Use ao criar ou revisar telas, formulários, modais, dropdowns, toasts, drag-and-drop, tabelas e componentes interativos. Cobre foco, teclado, ARIA, labels, contraste e dark mode.
---

# PDM Pro Têxtil — Skill de Acessibilidade

Base: WCAG 2.2 (princípios POUR — Perceivable, Operable, Understandable, Robust) adaptada ao repositório. Regra geral: **90% vem de usar os componentes existentes do projeto** (Radix/shadcn já implementam foco, ARIA e teclado) — o que sobra é cuidado com conteúdo e interações custom.

## 1. Fatos do Projeto (ponto de partida)

- Componentes base em **Radix/shadcn** (`@/components/ui/*`): `dialog`, `dropdown-menu`, `select`, `tabs`, `popover`, `label`, `checkbox`, `radio-group`, `alert-dialog` — **já acessíveis por padrão** (focus trap, `aria-*`, navegação por teclado). Não reimplemente essas interações.
- Formulários usam react-hook-form + zod; campos do `@/components/ui/*` já têm `Label`.
- Toast via `sonner` (role/status acessíveis por padrão).
- Kanban usa `@dnd-kit` (drag & drop) — **drag sozinho não é acessível** (WCAG 2.2.7); precisa de alternativa por teclado ou botões de mover.
- Dark mode por `next-themes` — obrigatório manter contraste nos dois temas.
- Testes: vitest + Testing Library (possível usar `getByRole`, `toBeInTheDocument`, etc.).

## 2. Regras Obrigatórias

### Forms
- **Todo campo tem `<Label>`** associado (`htmlFor` = `id` do input) ou `aria-label` se for ícone-só. Nunca deixar input sem nome acessível.
- Erro de validação: exibir junto ao campo com `aria-describedby`; mensagem em pt-BR, ação de corrigir clara.
- `required`/estado de erro também sinalizados por texto (não só por cor).
- Inputs com placeholder não contam como label — sempre rotular.

### Interação custom
- **Foco visível**: estados `focus-visible` visíveis em botões, links, inputs (Tailwind/shadcn já aplicam `focus-visible:ring` — não remover).
- **Teclado**: tudo que é clicável é focável e operável por Enter/Espaço. Ordem de foco (DOM/tab) segue a leitura visual.
- **Modais/Dialogs**: usar `Dialog`/`ConfirmModal` existentes (trap de foco + `aria-labelledby`). Nunca criar modal com `div` pura.
- **Dropdown/Menu**: usar `DropdownMenu`/`Select` existentes (seta opera por teclado). Não criar menu com `onClick` em `div`.
- **Drag & drop (kanban)**: além do drag, fornecer alternativa por teclado (ex. botões de mover / menu) — ou registrar limitação conhecida.

### Ícones
- Ícone decorativo → `aria-hidden="true"` (ou elemento de ícone sem conteúdo de a11y).
- Botão com só ícone → `aria-label` (pt-BR) ou texto visível. Nunca botão de ícone mudo.
- Avatar com iniciais: se for informativo, `aria-label` com o nome; se decorativo, esconder.

### Conteúdo
- `alt` descritivo em toda `<img>` que tenha significado; `alt=""` para decorativas.
- Tabelas: `<Table>` com header de coluna real (`th`/`scope="col"`); não usar divs para dados tabulares.
- Título de página via `<h1>` único; seções com headings hierárquicos.
- Cores não são o único sinal (status): badges devem incluir texto (ex. `Ativo`/`Pendente`), não apenas cor.
- Link/CTAs: texto do link descreve o destino (não "clique aqui").

### Toasts / feedback
- `toast.success`/`error` do sonner (anunciado por leitor de tela). Para sucesso/erro crítico sem toast, garantir região `aria-live`.

## 3. Contraste e Dark Mode (Perceivable)

- Contraste de texto ≥ 4.5:1; texto grande (≥ 24px / 18px bold) ≥ 3:1; UI components ≥ 3:1 (WCAG 1.4.3 / 1.4.11).
- Mantendo os tokens do repo: `slate-600` sobre `white` e `slate-400` sobre `slate-900` **passam** para texto normal — não usar `slate-300`/cinza muito claro em texto sobre fundo claro.
- Não usar `text-slate-400` em placeholder/uso crítico sem conferir contraste.
- **Testar sempre nos dois temas** (uma cor que passa no light pode falhar no dark).

## 4. Foco e Navegação (Operable)

- Nada de `outline: none` sem substituto de `focus-visible`.
- Nada de focar elementos escondidos; nada de `tabindex` positivo.
- Páginas com muito conteúdo: header da página em `<h1>`, navegação por links "Pular para conteúdo" apenas se necessário (shell existente não tem — só adicionar se a página exigir).
- Scrolls/âncoras devem manter foco na região (ex. ao abrir dialog, foco vai para o dialog).

## 5. Como Auditar (checklist)

### Manual — rápido (fazer em toda tela nova)
- [ ] Tab percorre a tela em ordem lógica; foco visível em todos os passos
- [ ] Todo input tem label associado
- [ ] Todo botão de ícone tem `aria-label` em pt-BR
- [ ] Drag & drop tem alternativa por teclado (ou limitação documentada)
- [ ] Contraste ok em light e dark
- [ ] Estado de erro é texto + cor, não só cor
- [ ] `alt` presente em imagens com significado

### Testes automatizados (quando adicionar testes)
- Usar Testing Library com `getByRole`/`getByLabelText` em vez de query por classe.
- Testar interação essencial por teclado (abrir/fechar dialog, navegar tabs).
- Se houver axe (`@axe-core/react`), rodar em páginas principais — se não estiver no projeto, sugerir ao usuário antes de instalar.

### Revisão por IA (quando relevante)
- Perguntar sobre estados de foco, labels ausentes e contraste de classes novas — integrar com o padrão de revisão das outras skills.

## 6. Nunca Fazer

- Remover `focus-visible:ring` para "estética".
- Modal com `div`/`position:fixed` puro sem Radix.
- Ícone-só sem `aria-label`/`title`.
- Cor como único indicador de status/erro.
- Input sem label com placeholder como "etiqueta".
- Bloquear zoom (`user-scalable=no`), animação com `prefers-reduced-motion` ignorada (animar só transições de UI; respeitar `motion-reduce`).
