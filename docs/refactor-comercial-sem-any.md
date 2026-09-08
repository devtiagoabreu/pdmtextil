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

### ✅ Módulo `comercial` restante — COMPLETO (0 matches)

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

#### 3. ✅ `comercial/solicitacoes` — COMPLETO (43 → 0)

`grep` em `src/app/(dashboard)/comercial/solicitacoes` → **0 matches** (inclui `*.test.tsx`).

- `solicitacoes/types.ts` criado: `HistoricoComunicacao`, `Anexo` (`id`, `url`, `titulo`), `ProdutoCru` (`id`, `codigoPdm`, `descricao`, `status`), `Solicitacao` (campos `string | null`; `briefing: Partial<BriefingTecelagem> | null`, `anexos?: Anexo[]`, `historicoComunicacao?: HistoricoComunicacao[] | null`), `SolicitacaoLista` (inclui `anexosCount`).
- `[id]/components/api.ts`: `fetchSolicitacao(...): Promise<Solicitacao>` (`res.json() as Promise<Solicitacao>`).
- `[id]/page.tsx`: `produtos`→`ProdutoCru[]`, `deleteTarget`→`{ id: number; anexos: Anexo[] } | null`, fetch de status `(data: StatusConfig[])` + `map((s) => ...)`, `carregarProdutos` `(data: ProdutoCru[])`, `new Date(sol.createdAt ?? Date.now())`, `anexos: sol.anexos ?? []`.
- `[id]/components/{header,dados-comerciais}.tsx`: `sol: Solicitacao`; `briefing.tsx`: `briefing: Partial<BriefingTecelagem>` + indexes com `|| ""` (7 lugares); `anexos.tsx`: `anexos: Anexo[]`; `historico.tsx`: `historico: HistoricoComunicacao[] | null | undefined`; `produtos.tsx`: `Produto[]` (alias de `ProdutoCru`); `utils.ts`: params `string[] | null | undefined`.
- `nova/page.tsx` e `[id]/editar/page.tsx`: `useState<Partial<DadosComerciais>>` (sem `as any`), `defaultValues: comercialData`, `useQuery<Solicitacao>`, `STEPS: { id; title; icon: LucideIcon }[]`, `tipo: val as DadosComerciais["tipo"]`, `initialData={briefingData}`, catches (`err instanceof Error` com fallback). `editar` ainda: `solicitacao.anexos.map((a) => ({ id: String(a.id), link: a.url, tipo: "LINK", nome: a.titulo }))`.
- `page.tsx`: `fetchSolicitacoes(): Promise<SolicitacaoLista[]>`, `deleteTarget: SolicitacaoLista | null`, `filter/map` sem `any`.
- Testes: `[id]/page.test.tsx` `vinculados: ProdutoCru[]`; `kanban/page.test.tsx` `onmessage/onmessageerror: ((ev: MessageEvent) => void) | null = null`.
- Verificações: `tsc --noEmit` limpo; vitest do bloco 11/11; suíte completa JSON **1203/1203**.
- Commit: `4e1740c5`.

#### 4. ✅ `comercial/requisicoes-amostra-comercial` — COMPLETO (29 → 0)

`grep` em `src/app/(dashboard)/comercial/requisicoes-amostra-comercial` → **0 matches** (inclui `*.test.tsx`).

- `requisicoes-amostra-comercial/types.ts` criado: `ItemHistoricoAmostra` (todos opcionais/nullable → `h.acao || h.status` etc.), `ProdutoAmostra`, `RequisicaoAmostraLista` (shape do GET `/api/requisicoes-amostra-comercial` — id, status, titulo, cliente, quantidade, produtoCodigo, produtoDescricao, solicitanteNome, createdAt, prazoDesejado), `RequisicaoAmostraDetalhe` (shape do GET `[id]`, inclui `produto?: ProdutoAmostra | null` — o JSX de detalhe referencia `data.produto`), `NovaRequisicaoAmostra` (payload do POST).
- `page.tsx`: `data`/`filtered`→`RequisicaoAmostraLista[]`, `deleteTarget`→`RequisicaoAmostraLista | null`, fetches `(res: Response)/(d: RequisicaoAmostraLista[])`, `filter/map` sem `any`.
- `[id]/page.tsx`: `data`→`RequisicaoAmostraDetalhe | null`, fetches tipados, `historico.map((h) => ...)`.
- `novo/page.tsx`: fetches `(r: Response)/(data: ProdutoCru[])`, `payload: NovaRequisicaoAmostra` (remove `Record<string, any>`), `produtos.map((p) => ...)`.
- `kanban/kanban-board.tsx`: `data.map((r: RequisicaoCard) => ...)` (sem `as`), `colunas` inferido de `statusList.map((col) => ...)`, `handleDragStart/End(event: DragStartEvent/DragEndEvent)` (tipos do dnd-kit), `prev.map((r) => ...)`, `statusList.find((s) => ...)`, `catch (err)` + `err instanceof Error` (antes `err: any`/`err.message` direto), `colunas/cards.map` sem `any`.
- Teste: `kanban/page.test.tsx` `onmessage/onmessageerror: ((ev: MessageEvent) => void) | null = null`.
- Verificações: `tsc --noEmit` limpo; vitest do bloco 10/10; suíte completa JSON **1203/1203**.
- Commit: `07aa79f2`.

#### 5. ✅ `comercial/requisicoes-corte` — COMPLETO (71 → 0)

`grep` em `src/app/(dashboard)/comercial/requisicoes-corte` → **0 matches** (inclui `*.test.tsx`).

- `requisicoes-corte/types.ts` criado: `ItemOcr`, `RequisicaoCorteItem` (espelha `ItemLinha` com `destinoTipo`), `RequisicaoCorteLista`, `RequisicaoCorteDetalhe`, `RequisicaoCopia`.
- `page.tsx`: `data`→`RequisicaoCorteLista[]`, `deleteTarget`→`RequisicaoCorteLista | null`, fetches `(res: Response)/(d: RequisicaoCorteLista[])`, `fetchDetalhe` `(d: RequisicaoCorteDetalhe)` + `d.itens.map((i) => ...)`, `copiarRequisicao(item: RequisicaoCorteLista)` + `(dados: RequisicaoCopia)` + payload `dados.itens ?? []`, maps/filters sem `any`.
- `[id]/page.tsx`: tipo local `StatusOpcaoApi` (`nome`, `rotulo: string | null`, `cor: string | null`) + `map((s) => ({ cor: s.cor ?? undefined }))`, fetches tipados, `handleItemChange(field: keyof ItemLinha, value: string)`, `handleOcrItens(novosItens: ItemOcr[])`, `itens.reduce`/`itens.map`/`statusOptions.map` sem `any`.
- `nova/page.tsx`: `DadosClienteNovo`/`DadosPessoaNovo`/`DadosNovo` (união) → **elimina os `(data as any).emailNf/celular/segmento`** (agora `(data as DadosClienteNovo)` porque o estado é união e só `cliente` tem esses campos), `setData((prev) => { const base = {...}; if (isCliente) { ... } })` (sem spread `as any`), catch x8 `err instanceof Error` (`toast.error(err instanceof Error ? err.message : "Erro ao criar")`), `handleItemChange(String)` idem, `copiar=`→`(dados: RequisicaoCopia)` + `destinoTipo: null` no item, `itensValidos.filter`/`itens.map` sem `any`.
- `por-romaneio/page.tsx`: fetch `(res: Response)/(data: Integracao[])`, sorts `(a, b)`/`(g)`/`(p)`/`(item)`/`(grupo)` inferidos.
- `por-romaneio/components/romaneio-pdf.ts`: **`doc: jsPDF`** (`import type { jsPDF } from "jspdf"`) + término local `EmpresaConfig` (`nome?`, `documento?`, `endereco?`, `cidade?`, `uf?`, `logoUrl?`, `isDefault?`); `(await res.json()) as EmpresaConfig[]`; `list.find((e) => e.isDefault) || list[0] || null`; `body: LinhaTabela[]` (`CelulaTabela = { content; colSpan?; rowSpan?; styles?: Record<string, unknown> }`); autoTable via cast `(doc as DocPdfComAutoTable)` (`jsPDF & { autoTable: (options: Record<string, unknown>) => unknown }` — `jspdf-autotable` não augmenta o tipo `jsPDF`); `didDrawPage: (data: { pageNumber: number })`.
- `por-romaneio/components/{romaneio-card,toolbar,requisicao-dialog,utils}.tsx/ts`: `rolos.forEach((rolo, idx) => ...)`, `Array.from(...).sort((a, b) => ...)` (par inferido de `[string, Map<string, Rolo[]>]`), `rolos.reduce((acc, r) => acc + (r.quantidade || 0), 0)`, maps sem `any`.
- `page.test.tsx`: `fetchMock.calls.find((c) => ...)` inferido (`FetchCall`).
- **Extras fora do bloco (achados na verificação final do módulo)**: 4 `any` remanescentes nos blocos `pedidos-venda` (2) e `faturamentos` (2) — `data.map((o: any) => ...)` ao carregar oportunidades → `.then((data: { id: unknown; titulo: string }[]) => data.map((o) => ...))`. Corrigidos na mesma entrega.
- Verificações: `tsc --noEmit` limpo; vitest do bloco 4/4 (14 testes) + pedidos-venda/faturamentos 6/6 (20 testes); suíte completa JSON **1203/1203**; `grep` no módulo `comercial` inteiro → **0 matches**.
- Commit: (preencher após push).

---

## Status final

🎉 **Módulo Comercial 100% sem `any`** — `grep ': any|\bany\b|\bas any\b'` em `src/app/(dashboard)/comercial` → **0 matches** (inclui `*.test.tsx`).

Fora de escopo (mantidos, pois não estão em `src/app/(dashboard)/comercial`): `src/lib/gerar-requisicao-corte-pdf.ts` e rotas `src/app/api/...`.