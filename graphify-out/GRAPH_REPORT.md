# Graph Report - .  (2026-05-24)

## Corpus Check
- Large corpus: 220 files · ~94,291 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 1409 nodes · 2630 edges · 54 communities (37 shown, 17 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]

## God Nodes (most connected - your core abstractions)
1. `db` - 81 edges
2. `authOptions` - 80 edges
3. `getInfoContent()` - 72 edges
4. `cn()` - 65 edges
5. `InfoButton()` - 37 edges
6. `Button()` - 34 edges
7. `Input()` - 32 edges
8. `getUserId()` - 32 edges
9. `notificar()` - 28 edges
10. `handleApiError()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `DetalheSolicitacaoPage()` --calls--> `getInfoContent()`  [EXTRACTED]
  app/(dashboard)/comercial/solicitacoes/[id]/page.tsx → lib/info-content.ts
- `RelatorioAtividadeUsuario()` --calls--> `getInfoContent()`  [EXTRACTED]
  app/(dashboard)/dashboard/relatorios/atividade-usuario/page.tsx → lib/info-content.ts
- `RelatorioSolicitacoesCriadas()` --calls--> `getInfoContent()`  [EXTRACTED]
  app/(dashboard)/dashboard/relatorios/solicitacoes-criadas/page.tsx → lib/info-content.ts
- `RelatorioTempoStatus()` --calls--> `getInfoContent()`  [EXTRACTED]
  app/(dashboard)/dashboard/relatorios/tempo-status/page.tsx → lib/info-content.ts
- `RelatorioTempoStatusAmostras()` --calls--> `getInfoContent()`  [EXTRACTED]
  app/(dashboard)/dashboard/relatorios/tempo-status-amostras/page.tsx → lib/info-content.ts

## Communities (54 total, 17 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (143): NewNotificacaoRegra, produtosCru, CorSolida, GET(), sendEmail(), POST(), NewProdutoCruComposicao, validateItemChain() (+135 more)

### Community 1 - "Community 1"
Cohesion: 0.02
Nodes (161): CardAction(), Amostra, DialogDescription(), tabsListVariants, ProdutoQuimicoFormPage(), Button(), NovaSolicitacaoPage(), FornecedoresPage() (+153 more)

### Community 2 - "Community 2"
Cohesion: 0.01
Nodes (206): largura, notNull, notNull, name, primaryKey, primaryKey, primaryKey, pantone (+198 more)

### Community 3 - "Community 3"
Cohesion: 0.02
Nodes (80): checkConstraints, isRLSEnabled, name, name, foreignKeys, clientes_cnpj_unique, policies, indexes (+72 more)

### Community 4 - "Community 4"
Cohesion: 0.03
Nodes (73): name, anexos_solicitacao_id_solicitacoes_id_fk, columnsTo, tableFrom, foreignKeys, columns, primaryKey, onUpdate (+65 more)

### Community 5 - "Community 5"
Cohesion: 0.03
Nodes (64): type, default, updated_at, primaryKey, notNull, solicitante_id, name, default (+56 more)

### Community 6 - "Community 6"
Cohesion: 0.03
Nodes (60): primaryKey, ativo, type, notNull, notNull, primaryKey, type, default (+52 more)

### Community 7 - "Community 7"
Cohesion: 0.04
Nodes (51): nullsNotDistinct, compositePrimaryKeys, prevId, name, columns, version, name, enums (+43 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (27): exportCSV(), UserActivity, STATUS_COLORS, MesData, RelatorioSolicitacoesCriadas(), statsToHTML(), RelatorioTempoStatusAmostras(), Stats (+19 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (26): indexes, uniqueConstraints, columnsFrom, tableFrom, compositePrimaryKeys, schema, onDelete, solicitacoes_solicitante_id_usuarios_id_fk (+18 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (26): indexes, nullsNotDistinct, name, onUpdate, compositePrimaryKeys, policies, columns, foreignKeys (+18 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (15): Sidebar(), mobileNavItems, MobileBottomNav(), HeaderProps, adminItems, CommandSearch(), searchItems(), searchRegistry (+7 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (17): tableFrom, anexos_solicitacao_id_solicitacoes_id_fk, columnsTo, name, name, anexos_criado_por_usuarios_id_fk, tableTo, onUpdate (+9 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (14): LIGAMENTO_LABELS, TIPO_CONFIG, TIPO_TECIDO_LABELS, SEGMENTOS_LABELS, PRECO_LABELS, STATUS_CONFIG, TIPOS_ACABAMENTO_LABELS, DetalheSolicitacaoPage() (+6 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (9): DropdownMenuRadioItem(), DropdownMenuCheckboxItem(), DropdownMenuSeparator(), DropdownMenuSubTrigger(), DropdownMenuContent(), DropdownMenuSubContent(), DropdownMenuShortcut(), DropdownMenuLabel() (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (14): "usuarios", "operacoes", "solicitacoes", "cores_fundo", "clientes", "maquinas", "anexos", "acabamentos" (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (14): usuarios, operacoes, solicitacoes, clientes, cores_fundo, estampas, fios_fornecedores, anexos (+6 more)

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (6): NewRole, MODULOS, PermissoesMap, roles, PERMISSOES, Role

### Community 18 - "Community 18"
Cohesion: 0.17
Nodes (11): operacoes, acabamentos, fios_fornecedores, cores_fundo, bases_urdume, fornecedores, clientes, fios (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.31
Nodes (4): metadata, Providers(), QueryProvider(), Toaster()

### Community 20 - "Community 20"
Cohesion: 0.25
Nodes (3): NewBancoDados, BancoDados, bancosDados

### Community 21 - "Community 21"
Cohesion: 0.46
Nodes (7): produtos_cru, produto_cru_acabamento_amostra, produto_cru_composicao, produto_cru_amostra, produto_cru_acabamento, produto_cru_acabamento_receita, produto_cru_estrutura

### Community 22 - "Community 22"
Cohesion: 0.29
Nodes (6): "acabamentos", "operacoes", "fios", "cores_solidas", "cores_fundo", "maquinas"

### Community 23 - "Community 23"
Cohesion: 0.29
Nodes (6): NewOperacao, NewMaquina, maquinas, operacoes, Maquina, Operacao

### Community 24 - "Community 24"
Cohesion: 0.47
Nodes (5): calcDias(), processarTimeline(), q(), STATUS_LABELS, GET()

### Community 25 - "Community 25"
Cohesion: 0.33
Nodes (5): "anexos", "solicitacoes", "clientes", "usuarios", "sessions"

### Community 26 - "Community 26"
Cohesion: 0.4
Nodes (3): TIPO_LABEL, Regra, ALL_ROLES

### Community 27 - "Community 27"
Cohesion: 0.4
Nodes (3): Grandeza, GrandezaComposta, TipoRegra

### Community 28 - "Community 28"
Cohesion: 0.4
Nodes (4): produto_cru_acabamento_amostra, produto_cru_amostra, notificacoes, email_config

### Community 29 - "Community 29"
Cohesion: 0.4
Nodes (4): produtoCruReceitaItem, produtoCruReceita, NewProdutoCruReceita, NewProdutoCruReceitaItem

### Community 38 - "Community 38"
Cohesion: 0.5
Nodes (3): cores_solidas, bases_urdume, estampas

### Community 39 - "Community 39"
Cohesion: 0.5
Nodes (3): entries, version, dialect

### Community 40 - "Community 40"
Cohesion: 0.5
Nodes (3): acabamentos, NewAcabamento, Acabamento

### Community 41 - "Community 41"
Cohesion: 0.5
Nodes (3): Session, JWT, User

## Knowledge Gaps
- **745 isolated node(s):** `config`, `metadata`, `modulos`, `BancoDados`, `PermissoesData` (+740 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `columns` connect `Community 2` to `Community 10`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `getInfoContent()` connect `Community 1` to `Community 8`, `Community 13`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `columns` connect `Community 4` to `Community 6`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `config`, `metadata`, `modulos` to the rest of the system?**
  _745 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.01 - nodes in this community are weakly interconnected._