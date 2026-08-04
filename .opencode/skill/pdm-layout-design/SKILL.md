---
name: pdm-layout-design
description: Design de layout e UI para o PDM Pro Têxtil (dashboard B2B SaaS, Tailwind + shadcn). Use ao criar ou ajustar telas, componentes visuais, tabelas, cards, densidade, tipografia, espaçamento, dark mode e responsividade.
---

# PDM Pro Têxtil — Skill de Design de Layout/UI

Base: princípios de design de interface (identidade consistente, clean typography, densidade de dashboard SaaS, minimalismo) adaptados às convenções visuais reais do repositório. O PDM é um **sistema interno B2B** — design opinioso porém conservador: prioridade é clareza e densidade de informação, não espetáculo.

## 1. Princípios

- **Consistência > criatividade**: sempre reutilizar os tokens e componentes existentes do projeto antes de criar algo novo.
- **Denso mas respirável**: o usuário consulta muitos dados (tabelas, grades) — compacto, mas com hierarquia clara.
- **Uma coisa por tela**: cada tela tem um objetivo; título + ações claras.
- **Dark mode é cidadão de primeira classe**: toda tela nova DEVE funcionar bem nos dois temas.
- **Sem elementos decorativos gratuitos**: sombras pesadas, gradientes e ícones gigantes não agregam a um dashboard interno.

## 2. Sistema Visual Atual (fatos do repo)

- Tailwind (classes utilitárias diretas no JSX) + componentes shadcn/Radix em `@/components/ui/*` (Button, Input, Select, Dialog, DropdownMenu, Tabs, Table, Card, Badge, Label, EmptyState, PageSkeleton, ConfirmModal).
- Tokens de cor em uso: textos `slate-900`/`slate-600`/`slate-400` (light) e `slate-100`/`slate-400` (dark); bordas `slate-200` (light) / `slate-800` (dark); fundos `white` (light) / `slate-900` (dark); superfícies `slate-50` (light) / `slate-800`/`slate-700` (dark); primária `blue-600`/`blue-500` hover.
- Radicais do projeto: `rounded-xl` em cards, `h-9` em inputs, `text-xs`/`text-sm` em conteúdo denso, `text-sm font-semibold` em cabeçalhos, `text-2xl font-bold` em títulos de página (ex. fornecedores/kanban), `space-y-6` entre seções.
- Padrões visuais existentes: Badge de status (`green`/`yellow`/`red`/`slate`), avatar com iniciais + cor, lista de itens com ícone circular, `page-skeleton`, barra de progresso, `grid` de cards responsivo, `Table` compacta com header sticky.
- Tema via `next-themes` (`providers.tsx`); `@tailwindcss/typography` disponível.

## 3. Estrutura de Página Padrão

```
<div className="space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <h1 className="text-2xl font-bold">{título}</h1>
      <InfoButton texto="..." />          {/* explicação, sem tooltip custom */}
    </div>
    <div className="flex items-center gap-2">{ações}</div>
  </div>
  {/* Filtros + conteúdo */}
</div>
```

- Título `text-2xl font-bold` no topo; ações (Novo/Editar/Exportar) à direita no header, não espalhadas.
- Filtros (`ListFilters`) entre header e conteúdo, em uma linha.
- Conteúdo em cards `rounded-xl border bg-white dark:bg-slate-900`.

## 4. Componentes Visuais — Regras

- **Cards**: `rounded-xl border bg-white p-6 dark:bg-slate-900`; títulos de seção `text-sm font-semibold`. Usar `Card`/`CardHeader`/`CardContent` do shadcn quando houver mais de um card na tela.
- **Tabelas**: `Table` do shadcn; célula de cabeçalho `text-xs text-slate-500`; linha com `border-b`; hover sutil. Manter densidade (padding `py-3`/`px-4`). Ações de linha em `DropdownMenu` no fim da linha (Menu icon) — nunca empilhar botões por linha.
- **Badges**: usar `Badge` para status; cores semânticas do padrão do repo (success/warning/danger/info). Não inventar paleta nova.
- **Botões**: `Button size="default"|"sm"` com `h-9`; ação primária `bg-blue-600 hover:bg-blue-500 text-white`; secundária `variant="outline"`; destrutiva `variant="destructive"`. Ícone + texto em ações importantes; ícone-só em ações de linha.
- **Formulários**: `space-y-4`; Label acima do input; grids de 2–3 colunas em telas largas (`sm:grid-cols-2`, `lg:grid-cols-3`); largura de input consistente (não esticar ao infinito).
- **Empty state**: `EmptyState` existente (ícone + título + descrição) — nunca tela em branco quando lista vazia.
- **Loading**: `PageSkeleton` ou `Loader2` em botões; evitar "flash" de vazio/erro.
- **Gráficos**: `recharts` + `ChartCard` existente; sempre legenda e eixo claro.

## 5. Tipografia e Espaçamento

- Hierarquia: título de página `text-2xl font-bold` → seção `text-sm font-semibold` → texto `text-sm` → secundário/caption `text-xs text-slate-500`.
- Numeração/labels técnicos podem ser `text-xs` com `tabular-nums` quando forem colunas numéricas.
- Escala: `space-y-6` entre blocos, `gap-2` entre botões do header, `space-y-4` dentro de forms.
- Não usar fontes novas/serifadas; sistema usa fonte padrão do Tailwind (`system-ui` stack) — manter.

## 6. Copy (pt-BR)

- Textos curtos e de ação real: `Novo fornecedor`, `Exportar`, `Salvar`, `Cancelar`, `Editar`, `Excluir`.
- Descrições de apoio em uma frase clara (`InfoButton`), sem jargão.
- Confirmação de exclusão: `ConfirmModal` com título de risco e botão destrutivo — sempre perguntar antes de destruir.

## 7. Dark Mode

- Toda classe de cor: **par light + dark** (`bg-white dark:bg-slate-900`, `text-slate-900 dark:text-slate-100`, `border-slate-200 dark:border-slate-800`).
- Sombras: quase nenhuma em dark; usar bordas para separar superfícies.
- Testar a tela nos dois temas ANTES de entregar.

## 8. Responsividade

- Breakpoints padrão do projeto (`sm`/`md`/`lg`). Grades: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
- Tabelas em mobile: rolar horizontalmente dentro do card (`overflow-x-auto`) ou usar layout de cards; header da página continua com ações acessíveis.
- Botões de ação do header: empilhar/colapsar em telas pequenas (ícone-só com `title`/`aria-label`).

## 9. Checklists

- [ ] Reutiliza tokens/componentes existentes (nada de cor/fonte nova)
- [ ] Header com título + ações à direita
- [ ] Hierarquia tipográfica correta; `text-xs` para captions
- [ ] Tabela densa com header claro e actions em DropdownMenu
- [ ] Funciona em light e dark
- [ ] Responsivo (mobile ok, sem overflow quebrado)
- [ ] Empty state e loading tratados
- [ ] Copy pt-BR, ação real nos botões, confirmação em destrutivas
