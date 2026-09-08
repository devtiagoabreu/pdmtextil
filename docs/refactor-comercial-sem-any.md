# Refactoring: Remoção de `any` no módulo Comercial

> Este arquivo é o registro oficial da refatoração. Atualizar a cada bloco concluído.
> Regra: `: any`, `as any`, `useState<any>` e `\bany\b` devem chegar a **0** em `src/app/(dashboard)/comercial`.

## Objetivo

Eliminar todo uso de `any` (tipagens explícitas `: any`, `as any`, `useState<any>`, `Record<string, any>`, parâmetros `(x: any)` e `\bany\b` em geral) das páginas/componentes do módulo Comercial (`src/app/(dashboard)/comercial`).

## Regra de bloco (fechamento obrigatório)

Para cada subpasta/bloco:

1. `grep ': any|\bany\b'` na subpasta (incluindo `*.test.tsx`) → **0 matches**.
2. `npx.cmd tsc --noEmit` → limpo.
3. `npx.cmd vitest run "<subpasta>"` → verde.
4. `npm run test` (suíte completa) → verde (baseline **221 arquivos / 1138 testes**).
5. Commit em pt-BR com aspas simples + `git push`.
6. Atualizar este arquivo (progresso + contagens).

### Padrões já validados (reusar)

- `next-auth` session é augmentada → `session?.user?.role` / `session?.user?.id` direto, sem cast.
- Form de edição: `useState<Partial<FormType>>({})` onde `FormType` espelha os campos da entidade com os mesmos tipos nullable → `setForm(data)` (entidade completa) é atribuível.
- Clousures async que usam entidade possivelmente `null` → guarda `if (!x) return` no topo.
- Queries: `useQuery<T[]>`, `queryFn: fetchX` com `fetchX(): Promise<T[]>`; `.then((r: any) => r.json())` → `.then((r) => r.json() as Promise<T>)`.
- `matchesSearch<T>(item: T, query)` é genérico → aceita objetos tipados.
- Tipos compartilhados por subpasta em `types.ts` locais; reuso entre subpastas irmãs via `import type { X } from "../<subpasta>/types"` (ex.: `EmpresaResumo` de `oportunidades/types` usado por `propostas/novo` e `tarefas/criar-dialog`).
- Kanban cards: tipar a página com o MESMO shape do prop do componente kanban é suficiente (compatibilidade estrutural). Ex.: `TarefaCard` no kanban → página define `type Tarefa` local equivalente.
- Testes: `mock.calls` já é `FetchCall[]` (harness) → remover `(c: any)` e inferir.
- `Record<string, any>` em metadados/payload → `Record<string, unknown>`.
- Agrupamentos de charts: manter 1 tipo local por shape recebido (ex.: `RelatoriosData`, `CrmDashboardData`).
- `errors` de catch: preferir inferir (`(err) =>`) ou `err instanceof Error`; evitar `(err: any)`.

---

## PROGRESSO

### ✅ Módulo `comercial/crm` — COMPLETO (lesma-0)

`grep` em `src/app/(dashboard)/comercial/crm` → **0 matches** (inclui `*.test.tsx`).

Commits (todos pushed, `main`):

| Commit | Bloco | Óbitos |
|---|---|---|
| `954ebb23` | cadastros (listas, useListFilters/matchesSearch) | — |
| `0525d44d` | cadastros (formulários: fios, bases-urdume, cores, estampas, fornecedores, produtos-quimicos, produto-cru) | — |
| `68609ed5` | pessoas | — |
| `7f4d06a6` | visitas | — |
| `8bc224a2` | contatos | — |
| `53732049` | oportunidades | — |
| `50fb0a14` | treinamento | `[id]/page.test.tsx` (buildHandler `data: Licao`, import `type { Licao }`) |
| `8277e730` | leads | `leads/types.ts` (`Lead`, `MensagemWhatsapp`) |
| `5f97820d` | viagens | `viagens/types.ts` (`ViagemResumo`, `Investimento`, `VisitaResumo`, `Viagem`, `ViagemForm`) |
| `5aeaddb6` | propostas | `propostas/types.ts` (`Proposta`, `PropostaCreate`, `PropostaUpdate`) |
| `6ef7ffe6` | campanhas | `campanhas/types.ts` (`Campanha`, `CampanhaForm`); fix `(campanha.leadsGerados ?? 0) > 0` |
| `5bb4bab9` | configuracoes, conversas, notificacoes, pesquisa, regioes, relatorios, segmentos, tarefas, dashboard | tipos locais (`Regiao`, `Usuario`, `Segmento`, `Tarefa`, `Pergunta`, `RelatoriosData`); `notificacoes/page.test.tsx`; `tarefas/criar-dialog.tsx` (reusa `EmpresaResumo` + `TarefaCreate`) |

Notas:
- `metadados` em notificações → `Record<string, unknown> | null`.
- `regioes`: `REGIAO_LABELS[r.uf ?? ""]` (index com `null` quebra — fix necessário após tipar).
- `pesquisa/[token]`: `Pergunta` local com `tipo: "ESTRELAS" | "ALTERNATIVA" | "ABERTA"` e `opcoes?`.
- `relatorios/charts.tsx` + `crm/page.tsx`/`charts.tsx` (`dados: unknown` na `previsaoVendas`).

---

### ⏸️ Módulo `comercial` restante — RETOMADA PENDENTE (143 matches)

**PRÓXIMO BLOCO: `solicitacoes` (43)** → depois `requisicoes-amostra-comercial` (29) → `requisicoes-corte` (71).

#### 1. ✅ `comercial/clientes` — COMPLETO (22 → 0)

`grep` em `src/app/(dashboard)/comercial/clientes` → **0 matches** (inclui `*.test.tsx`).

- `clientes/types.ts` criado: `Cliente`, `VinculoRepresentante`, `RepresentanteResumo`, `SolicitacaoResumo`, `AmostraResumo` (reusa `Contato` de `comercial/crm/contatos/types`).
- `[id]/page.tsx`: `repResults`→`RepresentanteResumo[]`, `contatos`/`orfaos`→`Contato[]`, fetchs anotados (`as Promise<T[]>`), `useQuery<VinculoRepresentante[]>`, catches `err instanceof Error`, maps/filters sem `any`.
- `page.tsx`: tipos locais removidos (import de `./types`), maps sem `any`.
- `novo/page.tsx`: `estados.find((e) => ...)` (inferido do generic), catch sem `any`.
- Commit: `857e89a3`.

#### 2. ✅ `comercial/representantes` — COMPLETO (17 → 0)

`grep` em `src/app/(dashboard)/comercial/representantes` → **0 matches** (inclui `*.test.tsx`).

- `representantes/types.ts` criado: `Representante`, `ClienteVinculado`, `RepresentanteComClientes`, `ConsultaCnpjData` (shape do opencnpj: `razao_social`, `nome_fantasia`, `situacao_cadastral`, `logradouro`, `municipio`, `uf`).
- `[id]/page.tsx`: estado `RepresentanteComClientes`, `apiData`→`ConsultaCnpjData | null`, `clienteResults`→`Cliente[]` (reuso de `clientes/types`), `addCliente(c: Cliente)`, catches `err instanceof Error`.
- `novo/page.tsx`: idem + `estados.map((e) => ...)` (array de strings inferido).
- `page.tsx`: tipos importados de `./types`, `filter`/`map` sem `any`.
- Commit: `c03b1a49`.

#### 3. `comercial/solicitacoes` — 43 ocorrências
- `nova/page.tsx` e `[id]/editar/page.tsx`: **formulário multi-step** — `} as any` (defaultValues/premise), `defaultValues: comercialData as any`, `useQuery<any>`, `STEPS.map((s: any))`, `setComercialData(... val as any)`, `initialData={briefingData as any}`, `catch (error: any)/(err: any)`.
  - Bloco mais delicado: preciso tipar o shape do passo (comercial) + briefing + anexos antes de remover os `as any`.
- `[id]/page.tsx`: `useState<any[]>` (`produtos`), `useState<any>` (`deleteTarget`), fetches `.then((r: any)/(data: any))`, `setStatusOptions(data.map((s: any)))`.
- `page.tsx`: `useState<any>` (`deleteTarget`), `statuses.filter/map((s: any))`, `filteredData.map((s: any))`.
- `[id]/components/*.tsx`: `Anexos` (`anexos: any[]`, `(anexo: any)`), `BriefingTecnico` (`briefing: any`), `DadosComerciais` (`sol: any`), `Header` (`sol: any`, `(s: any)` x2), `Historico` (`historico: any[]`, `(h: any)`), `Produtos` (`produtos: any[]`, fetches `(r: any)/(data: any)`, `(p: any)`).
  - **Estratégia**: criar `tipos.ts` compartilhado em `solicitacoes/` e tipar os componentes de `[id]/components` via props — disso sai a maioria (22 ocorrências).
- Testes: `[id]/page.test.tsx` (`let vinculados: any[]`) e `kanban/page.test.tsx` (`onmessage/onmessageerror: any = null` — WebSocket mock: aceitar tipagem de stub).

#### 4. `comercial/requisicoes-amostra-comercial` — 29 ocorrências
- `[id]/page.tsx`: `useState<any>` (`data`), fetches `(res: any)/(d: any)`, `historico.map((h: any))`.
- `page.tsx`: `useState<any[]>` (`data`, `filtered`), `useState<any>` (`deleteTarget`), fetches `(res: any)/(d: any)`, `data.filter((item: any))`, `setData((prev: any) => ...)`, `filtered.map((item: any))`.
- `novo/page.tsx`: fetches `(r: any)/(data: any)` → `setProdutos`, `payload: Record<string, any>`, `produtos.map((p: any))`.
- `kanban/kanban-board.tsx`: `data.map((r: any))`, `colunas.map((col: any))`, `requisicoes.filter((r: any))`, `handleDragStart/End(event: any)` (dnd-kit → tipar com `DragStartEvent/DragEndEvent`), `prev.map((r: any))`, `statusList.find((s: any))`, `(err: any)`, `(card: any)`.
- `kanban/page.test.tsx`: `onmessage/onmessageerror: any = null` (idem solicitacoes).

#### 5. `comercial/requisicoes-corte` — 71 ocorrências (o maior)
- `[id]/page.tsx`: fetches `(r: any)/(res: any)/(d: any)`, `setStatusOptions(data.map((s: any)))`, `handleItemChange(field: keyof ItemLinha, value: any)` (→ tipar value por field), `setItens(prev => prev.filter((_: any, i: any)))`, `handleOcrItens(novosItens: any[])`, `itens.reduce((acc: any, item: any))`, `itens.map((item: any, index: any))`, `statusOptions.map((s: any))`.
- `page.tsx`: `useState<any[]>` (`data`), `useState<any>` (`deleteTarget`), fetches `(res: any)/(d: any)`, `d.itens.map((i: any))`, `copiarRequisicao(item: any)`, `prev.filter((item: any))`, `filteredData.map((d: any))`, `filteredData.map((item: any))`.
- `nova/page.tsx`: catch x8, `useState<(data: any)>`/`setData((prev: any) => ...)`, **inputs com `(data as any).emailNf/celular/segmento`** (→ tipar o estado do form), `dados.itens.map((item: any))`, `handleItemChange`/`handleOcrItens` (idem `[id]`), `itens.filter/map((item: any))`, `itens.map((item: any, index: any))`.
- `por-romaneio/page.tsx`: fetches `(res: any)/(data: any)`, sorts/group/`produtos.map((p: any))`, `dialogItens.filter/map`, `grupos.find((g: any))`, `Array.from(selectedRomaneios).sort((a: any, b: any))`, `grupos.map((grupo: any))`.
- `por-romaneio/components/romaneio-pdf.ts`: **`doc: any` (jsPDF)** → tipar com `jsPDF`/`jspdf.autotable` (`(doc as any).autoTable` melhorável), `empresa: Record<string, any>`, `body: any[]`, sorts `(a: any, b: any)`, `rolos.forEach((r: any, idx: any))`, `didDrawPage: (data: any)`.
- `por-romaneio/components/{romaneio-card,toolbar,requisicao-dialog,utils}.tsx/ts`: maps/sorts `(prod: any)`, `(a: any, b: any)`, `(rolo: any, idx: any)`, `(int: any)`, `(item: any, index: any)`, `rolos.reduce((acc: any, r: any))`, `produtos.sort((a: any, b: any))`.
- `page.test.tsx`: `fetchMock.calls.find((c: any)` → inferir `FetchCall`.

---

## Como retomar

1. Pegar o **próximo bloco** (atualmente `clientes`) e aplicar a regra de bloco acima.
2. Atualizar este arquivo ao fechar cada bloco.
3. COBRANÇA: este arquivo é lido pelo agente no início de cada sessão (via AGENTS.md) — o usuário é cobrado a retomar até zerar.