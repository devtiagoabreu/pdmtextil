---
name: pdm-frontend
description: Frontend React 19 / Next.js 15 para o PDM Pro Têxtil. Use ao criar ou refatorar componentes, telas, data fetching, estado, formulários, performance de bundle e interações. Complementa a skill pdm-dev com as regras de código de frontend.
---

# PDM Pro Têxtil — Skill de Frontend

Base: boas práticas React 19 + Next.js 15 (App Router) e a skill de referência `vercel-react-best-practices`, adaptadas ao que já existe no repositório. Leia junto com `pdm-dev`.

## 1. Modelo Mental (React 19 + Next 15)

- **Server Components por padrão** para dados e páginas; **`"use client"` apenas** para interatividade, hooks e browser APIs.
- **Dados no cliente**: sempre **TanStack Query** (`useQuery`) — nunca `fetch` direto no render de Client Component.
- **Mutações**: `fetch` para a API (métodos POST/PUT/DELETE) e `refetch()`/invalidação das queries afetadas.
- **Formulários**: react-hook-form + zod (padrão do projeto), com `sonner` para feedback.
- No PDM as APIs são dinâmicas (`force-dynamic`) e o cliente cuida do frescor — não adicione cache `fetch` sem necessidade.

## 2. Padrões Obrigatórios no Projeto

### Tela de lista (Client Component)
Modelo: `src/app/(dashboard)/cadastros/fornecedores/page.tsx`.
- `useQuery({ queryKey: ["<recurso>"], queryFn: fetch<recurso> })`.
- Busca em **todos os campos** com `matchesSearch` de `@/components/ui/list-filters`.
- Se houver status/período: `useListFilters` + `<ListFilters>`.
- Estados: loading (`Loader2`/`PageSkeleton`), vazio (`EmptyState`), erro (`toast.error`).
- Exclusão via `ConfirmModal`; tratar `fkError: true` (bloqueado).
- Ações: `ExportarDados`, importadores existentes quando fizer sentido.

### Formulário
- `react-hook-form` + `zodResolver` + schema do `validation.ts` (mesma fonte da API).
- Campos do `@/components/ui/*` (Input, Select, Checkbox, Textarea, RadioGroup, Tabs).
- Submissão com estado de loading no botão; `toast.success`/`toast.error`; redirecionar/refetch ao final.
- IDs/labels associados (`htmlFor`/`id`) — ver skill `pdm-accessibility`.

### Server Component (página de dados)
- `await params`/`await searchParams` (são Promise no Next 15).
- Prefira Server Component para páginas cujo conteúdo vem do servidor e não exige interação; mova apenas as partes interativas para client.

## 3. Performance e Bundle

- **Componentes pequenos e tipados.** Divida listas/tabelas/forms em subcomponentes quando passarem do confortável.
- **Menos JS no cliente**: mantenha Server Components para o que não precisa de estado. Cada `"use client"` puxa React para o bundle do navegador.
- **Importe nomes específicos** do `lucide-react` (também evita o falso negativo do tsc — ver `pdm-dev` §11). Não faça `import * as Icons from "lucide-react"`.
- **Cuidado com libs pesadas** (`recharts`, `jspdf`, `googleapis`, `dompurify`): importe no ponto de uso; use `next/dynamic` com `ssr: false` apenas quando a lib só roda no cliente e for cara (ex. PDF/gráfico pesado sob demanda).
- **Evite waterfalls**: não `await` dados em cadeia dentro da mesma render quando dá para paralelizar (`Promise.all`) ou delegar a subcomponentes com `Suspense`.
- **React Compiler / memoização**: não adicione `useMemo`/`useCallback` "preventivamente". Adicione apenas sob evidência de re-render custoso. Prefira derivar valores no render (padrão do projeto: `data.filter(...)` no render).
- **Listas**: use `key` estável (id). Não use `index` como key quando a lista pode reordenar.

## 4. Estado e Dados

- Server state → TanStack Query (queryKey nomeada por recurso; `refetch` após mutação). Não espelhar dados do servidor em `useState`/Redux sem motivo.
- State local/UI → `useState`/`useReducer` no componente.
- Não há Redux ativo no app (está apenas nos devDependencies) — não introduzir Redux para estado novo.
- Evite `useEffect` para derivar dados; calcule durante o render.
- Ao otimizar updates (ex. kanban), seguir o padrão dos kanbans existentes (`@dnd-kit`), não criar padrão novo.

## 5. Qualidade de Código (frontend)

- **Sem comentários** no código novo (convenção do repo).
- Texto de UI em **pt-BR**, sentença natural, ação no botão = ação real (ver `pdm-layout-design` §6 sobre copy).
- Tipos explícitos: `interface` para props/entidades; aproveite o tipo inferido do schema zod quando fizer sentido (`z.infer`).
- Componente reutilizável de UI → `@/components/ui/` com padrão cva/clsx usado lá; componente de domínio → `@/components/<dominio>/`.
- `"use client"` no topo do arquivo; não esconder `"use client"` em middleman.

## 6. Armadilhas Conhecidas

- **lucide-react + skipLibCheck**: nomes válidos podem falhar no tsc. Usar ícones validados ou testar com `node .\node_modules\typescript\bin\tsc --noEmit` (ver `pdm-dev` §11).
- **`params`/`searchParams` síncronos**: quebram no Next 15 — sempre `await`.
- **fetch no render de client**: quebra cachê e causa loading desnecessário — usar TanStack Query.
- **Hooks condicionais**: nunca chamar hooks dentro de `if`/`map` — extrair componente.
- **Borders em vez de estados**: ao criar elementos interativos, verificar foco/estados vazios (ver skills `pdm-layout-design` e `pdm-accessibility`).

## 7. Validação Antes de Entregar

- `node .\node_modules\typescript\bin\tsc --noEmit`
- `cmd /c "npm run build"` (se tocar rotas/UI)
- `cmd /c "npm run test"` (se tocar lógica testada)
- Conferir contraste/foco/mobile nas telas novas (ver `pdm-accessibility`).
