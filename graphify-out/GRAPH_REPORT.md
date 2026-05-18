# Graph Report - .  (2026-05-17)

## Corpus Check
- 172 files · ~66,451 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1227 nodes · 1978 edges · 45 communities (33 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Core Schema & API Routes|Core Schema & API Routes]]
- [[_COMMUNITY_UI Component Library|UI Component Library]]
- [[_COMMUNITY_Drizzle Table Columns|Drizzle Table Columns]]
- [[_COMMUNITY_Database Constraints|Database Constraints]]
- [[_COMMUNITY_Produto Cru Foreign Keys|Produto Cru Foreign Keys]]
- [[_COMMUNITY_User & Auth Schema|User & Auth Schema]]
- [[_COMMUNITY_Migration Meta|Migration Meta]]
- [[_COMMUNITY_Media & Type Columns|Media & Type Columns]]
- [[_COMMUNITY_Anexo Foreign Keys|Anexo Foreign Keys]]
- [[_COMMUNITY_Solicitacoes Foreign Keys|Solicitacoes Foreign Keys]]
- [[_COMMUNITY_Bases Urdume Constraints|Bases Urdume Constraints]]
- [[_COMMUNITY_Dashboard Shell & Layout|Dashboard Shell & Layout]]
- [[_COMMUNITY_Cross-table Foreign Keys|Cross-table Foreign Keys]]
- [[_COMMUNITY_Solicitation Detail Page|Solicitation Detail Page]]
- [[_COMMUNITY_Database Migration SQL|Database Migration SQL]]
- [[_COMMUNITY_Admin Page Components|Admin Page Components]]
- [[_COMMUNITY_CSS & Style Utilities|CSS & Style Utilities]]
- [[_COMMUNITY_UI Primitives|UI Primitives]]
- [[_COMMUNITY_Auth API Routes|Auth API Routes]]
- [[_COMMUNITY_Dashboard Stats API|Dashboard Stats API]]
- [[_COMMUNITY_Dashboard Activity API|Dashboard Activity API]]
- [[_COMMUNITY_Client API Routes|Client API Routes]]
- [[_COMMUNITY_Cadastros Import API|Cadastros Import API]]
- [[_COMMUNITY_Form Components|Form Components]]
- [[_COMMUNITY_Briefing Form Types|Briefing Form Types]]
- [[_COMMUNITY_Client Autocomplete|Client Autocomplete]]
- [[_COMMUNITY_Sidebar Navigation|Sidebar Navigation]]
- [[_COMMUNITY_Mobile Bottom Nav|Mobile Bottom Nav]]
- [[_COMMUNITY_Theme Toggle|Theme Toggle]]
- [[_COMMUNITY_Landing Page|Landing Page]]
- [[_COMMUNITY_Perfil Page|Perfil Page]]
- [[_COMMUNITY_NextAuth Config|NextAuth Config]]
- [[_COMMUNITY_Email & Notifications|Email & Notifications]]
- [[_COMMUNITY_Notification Schema|Notification Schema]]
- [[_COMMUNITY_Email Config Schema|Email Config Schema]]
- [[_COMMUNITY_Roles & Permissions|Roles & Permissions]]
- [[_COMMUNITY_Produto Quimico Schema|Produto Quimico Schema]]
- [[_COMMUNITY_Receita Schema|Receita Schema]]
- [[_COMMUNITY_Amostra Schema|Amostra Schema]]
- [[_COMMUNITY_Acabamento Schema|Acabamento Schema]]
- [[_COMMUNITY_Produto Cru Composicao|Produto Cru Composicao]]
- [[_COMMUNITY_Produto Cru Estrutura|Produto Cru Estrutura]]

## God Nodes (most connected - your core abstractions)
1. `authOptions` - 67 edges
2. `cn()` - 65 edges
3. `db` - 64 edges
4. `Button()` - 32 edges
5. `Input()` - 29 edges
6. `Label()` - 20 edges
7. `columns` - 17 edges
8. `columns` - 16 edges
9. `usuarios` - 16 edges
10. `columns` - 15 edges
11. `columns` - 13 edges
12. `PUT()` - 12 edges
13. `columns` - 12 edges
14. `id` - 12 edges
15. `DELETE()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `notificar()`  [EXTRACTED]
  app/api/solicitacoes/route.ts → lib/notificar.ts
- `CardAction()` --calls--> `cn()`  [EXTRACTED]
  components/ui/card.tsx → lib/utils.ts
- `DialogOverlay()` --calls--> `cn()`  [EXTRACTED]
  components/ui/dialog.tsx → lib/utils.ts
- `DropdownMenuContent()` --calls--> `cn()`  [EXTRACTED]
  components/ui/dropdown-menu.tsx → lib/utils.ts
- `DropdownMenuLabel()` --calls--> `cn()`  [EXTRACTED]
  components/ui/dropdown-menu.tsx → lib/utils.ts
- `DropdownMenuItem()` --calls--> `cn()`  [EXTRACTED]
  components/ui/dropdown-menu.tsx → lib/utils.ts
- `DropdownMenuSubTrigger()` --calls--> `cn()`  [EXTRACTED]
  components/ui/dropdown-menu.tsx → lib/utils.ts
- `DropdownMenuSubContent()` --calls--> `cn()`  [EXTRACTED]
  components/ui/dropdown-menu.tsx → lib/utils.ts
- `DropdownMenuCheckboxItem()` --calls--> `cn()`  [EXTRACTED]
  components/ui/dropdown-menu.tsx → lib/utils.ts
- `DropdownMenuRadioItem()` --calls--> `cn()`  [EXTRACTED]
  components/ui/dropdown-menu.tsx → lib/utils.ts

## Communities (45 total, 12 thin omitted)

### Community 0 - "Core Schema & API Routes"
Cohesion: 0.02
Nodes (97): BaseImport, NewProdutoCruAcabamentoReceita, coresSolidas, POST(), CorImport, NewRole, NewBaseUrdume, authOptions (+89 more)

### Community 1 - "UI Component Library"
Cohesion: 0.02
Nodes (115): TIPO_ACABAMENTO, SelectContent(), RadioGroupItem(), Input(), NovoFornecedor, Checkbox(), DropdownMenuLabel(), solicitacaoCompletaSchema (+107 more)

### Community 2 - "Drizzle Table Columns"
Cohesion: 0.01
Nodes (190): primaryKey, notNull, primaryKey, notNull, name, columns, primaryKey, primaryKey (+182 more)

### Community 3 - "Database Constraints"
Cohesion: 0.02
Nodes (80): indexes, public.anexos, compositePrimaryKeys, nullsNotDistinct, name, schema, name, checkConstraints (+72 more)

### Community 4 - "Produto Cru Foreign Keys"
Cohesion: 0.03
Nodes (64): primaryKey, responsavel_id, notNull, name, observacoes, name, name, primaryKey (+56 more)

### Community 5 - "User & Auth Schema"
Cohesion: 0.03
Nodes (60): name, email, type, type, type, type, primaryKey, primaryKey (+52 more)

### Community 6 - "Migration Meta"
Cohesion: 0.04
Nodes (51): columns, _meta, columns, columns, policies, columnsTo, tables, sequences (+43 more)

### Community 7 - "Media & Type Columns"
Cohesion: 0.04
Nodes (47): mime_type, type, notNull, type, primaryKey, primaryKey, type, notNull (+39 more)

### Community 8 - "Anexo Foreign Keys"
Cohesion: 0.08
Nodes (26): name, name, name, isRLSEnabled, columnsTo, anexos_solicitacao_id_solicitacoes_id_fk, tableFrom, columnsFrom (+18 more)

### Community 9 - "Solicitacoes Foreign Keys"
Cohesion: 0.08
Nodes (26): name, solicitacoes_solicitante_id_usuarios_id_fk, columnsFrom, name, public.solicitacoes, solicitacoes_responsavel_id_usuarios_id_fk, indexes, foreignKeys (+18 more)

### Community 10 - "Bases Urdume Constraints"
Cohesion: 0.08
Nodes (26): bases_urdume_criado_por_usuarios_id_fk, columns, bases_urdume_codigo_base_unique, nullsNotDistinct, compositePrimaryKeys, isRLSEnabled, name, checkConstraints (+18 more)

### Community 11 - "Dashboard Shell & Layout"
Cohesion: 0.12
Nodes (13): NavRole, Header(), HeaderProps, Sidebar(), SidebarProps, notifications, MobileBottomNav(), mobileNavItems (+5 more)

### Community 12 - "Cross-table Foreign Keys"
Cohesion: 0.12
Nodes (17): tableTo, onUpdate, columnsTo, foreignKeys, tableFrom, columnsFrom, name, name (+9 more)

### Community 13 - "Solicitation Detail Page"
Cohesion: 0.12
Nodes (13): PRECO_LABELS, CORES_LABELS, LIGAMENTO_LABELS, SEGMENTOS_LABELS, TECNOLOGIAS_LABELS, TIPO_CONFIG, TOQUE_LABELS, TIPO_FIBRA_LABELS (+5 more)

### Community 14 - "Database Migration SQL"
Cohesion: 0.13
Nodes (14): "operacoes", "fornecedores", "bases_urdume", "solicitacoes", "cores_solidas", "clientes", "anexos", "fios" (+6 more)

### Community 15 - "Admin Page Components"
Cohesion: 0.13
Nodes (14): anexos, fornecedores, cores_fundo, acabamentos, clientes, maquinas, fios, estampas (+6 more)

### Community 16 - "CSS & Style Utilities"
Cohesion: 0.17
Nodes (11): estampas, fios, cores_solidas, fios_fornecedores, fornecedores, cores_fundo, acabamentos, clientes (+3 more)

### Community 17 - "UI Primitives"
Cohesion: 0.31
Nodes (4): Toaster(), QueryProvider(), metadata, Providers()

### Community 18 - "Auth API Routes"
Cohesion: 0.46
Nodes (7): produtos_cru, produto_cru_estrutura, produto_cru_amostra, produto_cru_composicao, produto_cru_acabamento_amostra, produto_cru_acabamento_receita, produto_cru_acabamento

### Community 19 - "Dashboard Stats API"
Cohesion: 0.29
Nodes (6): "operacoes", "acabamentos", "cores_fundo", "cores_solidas", "fios", "maquinas"

### Community 20 - "Dashboard Activity API"
Cohesion: 0.29
Nodes (6): operacoes, NewOperacao, Operacao, Maquina, maquinas, NewMaquina

### Community 21 - "Client API Routes"
Cohesion: 0.33
Nodes (5): "usuarios", "clientes", "solicitacoes", "sessions", "anexos"

### Community 22 - "Cadastros Import API"
Cohesion: 0.33
Nodes (6): primaryKey, type, default, notNull, name, metadados

### Community 24 - "Briefing Form Types"
Cohesion: 0.4
Nodes (5): telefone, notNull, type, primaryKey, name

### Community 25 - "Client Autocomplete"
Cohesion: 0.4
Nodes (5): primaryKey, uf, type, name, notNull

### Community 26 - "Sidebar Navigation"
Cohesion: 0.4
Nodes (4): email_config, notificacoes, produto_cru_amostra, produto_cru_acabamento_amostra

### Community 33 - "Notification Schema"
Cohesion: 0.5
Nodes (3): estampas, bases_urdume, cores_solidas

### Community 34 - "Email Config Schema"
Cohesion: 0.5
Nodes (3): entries, version, dialect

### Community 35 - "Roles & Permissions"
Cohesion: 0.5
Nodes (3): Acabamento, acabamentos, NewAcabamento

### Community 36 - "Produto Quimico Schema"
Cohesion: 0.5
Nodes (3): User, JWT, Session

## Knowledge Gaps
- **684 isolated node(s):** `config`, `metadata`, `modulos`, `BaseUrdume`, `BaseUrdume` (+679 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `columns` connect `Drizzle Table Columns` to `Database Constraints`, `Cadastros Import API`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `columns` connect `Produto Cru Foreign Keys` to `Solicitacoes Foreign Keys`, `User & Auth Schema`, `Media & Type Columns`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `columns` connect `Media & Type Columns` to `Anexo Foreign Keys`, `User & Auth Schema`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `config`, `metadata`, `modulos` to the rest of the system?**
  _684 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core Schema & API Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `UI Component Library` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Drizzle Table Columns` be split into smaller, more focused modules?**
  _Cohesion score 0.01 - nodes in this community are weakly interconnected._