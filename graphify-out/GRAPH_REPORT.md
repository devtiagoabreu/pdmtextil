# Graph Report - D:\Tiago\dev\pdmtextil  (2026-07-17)

## Corpus Check
- Large corpus: 549 files · ~269,909 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 2658 nodes · 6376 edges · 82 communities (52 shown, 30 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Middleware & Error Handling|Middleware & Error Handling]]
- [[_COMMUNITY_App Layout & Providers|App Layout & Providers]]
- [[_COMMUNITY_Landing Page|Landing Page]]
- [[_COMMUNITY_Dashboard Layout|Dashboard Layout]]
- [[_COMMUNITY_Admin & Configuration|Admin & Configuration]]
- [[_COMMUNITY_Email Massa Page|Email Massa Page]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_CRM Configurações|CRM Configurações]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_CRM TreinamentoExport|CRM Treinamento/Export]]
- [[_COMMUNITY_Requisições de Amostra|Requisições de Amostra]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_EmailSMTP Config|Email/SMTP Config]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_API Routes & Models|API Routes & Models]]
- [[_COMMUNITY_Email ImportMassa Routes|Email Import/Massa Routes]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_CRM API Routes|CRM API Routes]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_CRM Kanban|CRM Kanban]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Initial DB Migration|Initial DB Migration]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Integration Migration|Integration Migration]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_CRM Migration Tables|CRM Migration Tables]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Migration Metadata v0|Migration Metadata v0]]
- [[_COMMUNITY_DB Schema Anexos|DB Schema Anexos]]
- [[_COMMUNITY_Migration Metadata v1|Migration Metadata v1]]
- [[_COMMUNITY_DB Schema Acabamentos|DB Schema Acabamentos]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Chat Schema|Chat Schema]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]

## God Nodes (most connected - your core abstractions)
1. `getInfoContent()` - 215 edges
2. `requireAuth()` - 208 edges
3. `db` - 200 edges
4. `InfoButton()` - 113 edges
5. `authOptions` - 103 edges
6. `handleApiError()` - 95 edges
7. `notificar()` - 66 edges
8. `cn()` - 65 edges
9. `Button()` - 62 edges
10. `usuarios` - 61 edges

## Surprising Connections (you probably didn't know these)
- `PermissoesPage()` --calls--> `getInfoContent()`  [INFERRED]
  app/(dashboard)/admin/configuracoes/permissoes/page.tsx → lib/info-content/index.ts
- `UsuariosPage()` --calls--> `getInfoContent()`  [INFERRED]
  app/(dashboard)/admin/usuarios/page.tsx → lib/info-content/index.ts
- `EditarUsuarioPage()` --calls--> `getInfoContent()`  [INFERRED]
  app/(dashboard)/admin/usuarios/[id]/page.tsx → lib/info-content/index.ts
- `BaseFormPage()` --calls--> `getInfoContent()`  [INFERRED]
  app/(dashboard)/cadastros/bases-urdume/[id]/page.tsx → lib/info-content/index.ts
- `CorFormPage()` --calls--> `getInfoContent()`  [INFERRED]
  app/(dashboard)/cadastros/cores/[id]/page.tsx → lib/info-content/index.ts

## Communities (82 total, 30 thin omitted)

### Community 0 - "Middleware & Error Handling"
Cohesion: 0.04
Nodes (11): config, PaginatedResponse, fkError, result, result, rows, ImportarEntidadeConfig, MockNextRequest (+3 more)

### Community 1 - "App Layout & Providers"
Cohesion: 0.31
Nodes (4): metadata, Providers(), QueryProvider(), Toaster()

### Community 31 - "Dashboard Layout"
Cohesion: 0.1
Nodes (15): CommandSearch(), DashboardShell(), HeaderProps, Notificacao, Header(), MobileBottomNav(), MenuItem, UserMenu (+7 more)

### Community 5 - "Admin & Configuration"
Cohesion: 0.01
Nodes (437): modulos, ConfiguracoesHubPage(), BancoDados, BancoDadosPage(), Empresa, EmpresaPage(), TipoAuth, Integracao (+429 more)

### Community 34 - "Email Massa Page"
Cohesion: 0.07
Nodes (37): Modelo, Lista, ListaComContatos, Contato, Envio, HistoricoData, FONT_SIZES, FONT_FAMILIES (+29 more)

### Community 19 - "Community 19"
Cohesion: 0.15
Nodes (4): Chat, Mensagem, EMOJIS, EmojiPicker()

### Community 3 - "Community 3"
Cohesion: 0.18
Nodes (7): CrmDashboardData, STATUS_CORES, CHART_COLORS, PIPELINE_COLORS, TIPO_EVENTO_ICON, formatCurrency(), CrmDashboardPage()

### Community 75 - "CRM Configurações"
Cohesion: 0.08
Nodes (23): REGIAO_SIGLAS, Estado, Usuario, Pais, EstadosConfigPage(), GET(), POST(), GET() (+15 more)

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (4): CHART_COLORS, PIPELINE_LABELS, PROPOSTA_LABELS, CrmRelatoriosPage()

### Community 37 - "CRM Treinamento/Export"
Cohesion: 0.13
Nodes (10): LicaoCompleta, ModuloCompleto, LicaoData, ModuloData, TocItem, removerAcentos(), sanitizeText(), TreinamentoPdfRenderer (+2 more)

### Community 8 - "Requisições de Amostra"
Cohesion: 0.08
Nodes (35): ROLES_PERMITIDOS, StatusCol, RequisicaoCard, DroppableColumn(), DraggableCard(), KanbanAmostraComercial(), BriefingTecelagemFormProps, SecaoDadosProduto() (+27 more)

### Community 9 - "Community 9"
Cohesion: 0.25
Nodes (5): FieldMap, PESSOA_FIELDS, CLIENTE_FIELDS, formatCnpj(), ConsultaCnpjPage()

### Community 10 - "Community 10"
Cohesion: 0.19
Nodes (6): GET(), ColumnInfo, generateBackup(), bancosDados, BancoDados, NewBancoDados

### Community 35 - "Community 35"
Cohesion: 0.29
Nodes (9): POST(), POST(), POST(), parseConnString(), serverBase(), dbConnString(), createDatabase(), cloneDatabase() (+1 more)

### Community 79 - "Email/SMTP Config"
Cohesion: 0.06
Nodes (40): POST(), GET(), PUT(), DELETE(), Destinatario, buscarDestinatarios(), injectTrackingPixel(), injectLinkTracking() (+32 more)

### Community 14 - "API Routes & Models"
Cohesion: 0.02
Nodes (221): GET(), GET(), PUT(), DELETE(), POST(), maskSensitive(), GET(), requireAdmin() (+213 more)

### Community 13 - "Email Import/Massa Routes"
Cohesion: 0.03
Nodes (95): ContatoImport, campoMap, parseCSV(), parseJSON(), POST(), POST(), GET(), POST() (+87 more)

### Community 12 - "Community 12"
Cohesion: 0.29
Nodes (4): TIPOS_NOTIFICACAO, notificacaoRegras, NotificacaoRegra, NewNotificacaoRegra

### Community 76 - "CRM API Routes"
Cohesion: 0.06
Nodes (60): GET(), POST(), GET(), POST(), extractRemoteJid(), GET(), POST(), GET() (+52 more)

### Community 15 - "Community 15"
Cohesion: 0.34
Nodes (11): GET(), getDriveClient(), listFolders(), listFiles(), searchFiles(), uploadFile(), getFileInfo(), getRootFolders() (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.67
Nodes (3): BLOCKED_HOSTS, isPrivateIP(), GET()

### Community 17 - "Community 17"
Cohesion: 0.47
Nodes (5): STATUS_LABELS, calcDias(), processarTimeline(), q(), GET()

### Community 18 - "Community 18"
Cohesion: 0.22
Nodes (5): ROLES_PERMITIDOS, StatusCol, AmostraLink, AmostraCard, KanbanAmostras()

### Community 23 - "CRM Kanban"
Cohesion: 0.05
Nodes (45): TIPO_ROTULO, API_ENDPOINTS, CampanhaCard, TIPO_LABELS, TIPO_CORES, DEFAULT_STATUSES, formatarData(), DraggableCard() (+37 more)

### Community 22 - "Community 22"
Cohesion: 0.29
Nodes (6): TIPO_LABELS, TIPO_CORES, DIAS_SEMANA, formatDateKey(), Visita, VisitasCalendario()

### Community 25 - "Community 25"
Cohesion: 0.4
Nodes (3): ImportarBasesUrdumeProps, ResultadoImport, ImportarEntidade()

### Community 32 - "Community 32"
Cohesion: 0.25
Nodes (6): addButton, urlInput, { onChange }, descInput, removeButtons, LinksEditor()

### Community 33 - "Community 33"
Cohesion: 0.29
Nodes (5): { container }, { onCancel }, backdrop, { onConfirm }, alertIcon

### Community 38 - "Community 38"
Cohesion: 0.33
Nodes (5): "clientes", "anexos", "sessions", "usuarios", "solicitacoes"

### Community 39 - "Community 39"
Cohesion: 0.29
Nodes (6): "fios", "cores_solidas", "cores_fundo", "acabamentos", "maquinas", "operacoes"

### Community 40 - "Initial DB Migration"
Cohesion: 0.13
Nodes (14): "acabamentos", "bases_urdume", "clientes", "cores_fundo", "cores_solidas", "estampas", "fios", "fios_fornecedores" (+6 more)

### Community 41 - "Community 41"
Cohesion: 0.17
Nodes (11): fornecedores, fios, fios_fornecedores, bases_urdume, cores_solidas, cores_fundo, estampas, clientes (+3 more)

### Community 42 - "Community 42"
Cohesion: 0.5
Nodes (3): bases_urdume, estampas, cores_solidas

### Community 43 - "Integration Migration"
Cohesion: 0.13
Nodes (14): fornecedores, fios, fios_fornecedores, bases_urdume, cores_solidas, cores_fundo, estampas, clientes (+6 more)

### Community 44 - "Community 44"
Cohesion: 0.46
Nodes (7): produtos_cru, produto_cru_composicao, produto_cru_estrutura, produto_cru_amostra, produto_cru_acabamento, produto_cru_acabamento_amostra, produto_cru_acabamento_receita

### Community 46 - "Community 46"
Cohesion: 0.4
Nodes (4): email_config, notificacoes, produto_cru_amostra, produto_cru_acabamento_amostra

### Community 52 - "Community 52"
Cohesion: 0.67
Nodes (3): "email_modelos", "email_listas", "email_lista_contatos"

### Community 57 - "CRM Migration Tables"
Cohesion: 0.27
Nodes (15): crm_regioes, crm_equipes, crm_empresas, crm_leads, crm_contatos, crm_oportunidades, crm_visitas, crm_tarefas (+7 more)

### Community 68 - "Migration Metadata v0"
Cohesion: 0.02
Nodes (103): id, prevId, version, dialect, tables, public.anexos, name, schema (+95 more)

### Community 69 - "DB Schema Anexos"
Cohesion: 0.01
Nodes (171): columns, id, name, type, primaryKey, notNull, solicitacao_id, name (+163 more)

### Community 71 - "Migration Metadata v1"
Cohesion: 0.02
Nodes (123): id, prevId, version, dialect, tables, public.acabamentos, name, schema (+115 more)

### Community 70 - "DB Schema Acabamentos"
Cohesion: 0.01
Nodes (206): columns, id, name, type, primaryKey, notNull, nome, name (+198 more)

### Community 72 - "Community 72"
Cohesion: 0.5
Nodes (3): version, dialect, entries

### Community 73 - "Community 73"
Cohesion: 0.5
Nodes (3): acabamentos, Acabamento, NewAcabamento

### Community 74 - "Chat Schema"
Cohesion: 0.11
Nodes (15): chatMensagens, chatParticipantes, chatLeituras, Chat, NewChat, ChatMensagem, NewChatMensagem, ChatParticipante (+7 more)

### Community 77 - "Community 77"
Cohesion: 0.29
Nodes (6): maquinas, operacoes, Maquina, NewMaquina, Operacao, NewOperacao

### Community 78 - "Community 78"
Cohesion: 0.29
Nodes (6): romaneios, romaneioPecas, Romaneio, NewRomaneio, RomaneioPeca, NewRomaneioPeca

### Community 80 - "Community 80"
Cohesion: 0.17
Nodes (11): AutoScrollActivator, TraversalOrder, MeasuringStrategy, MeasuringFrequency, DndContextProps, DragOverlayProps, PointerSensor, MouseSensor (+3 more)

### Community 81 - "Community 81"
Cohesion: 0.5
Nodes (3): User, Session, JWT

## Knowledge Gaps
- **1092 isolated node(s):** `config`, `metadata`, `modulos`, `BancoDados`, `Empresa` (+1087 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getInfoContent()` connect `Admin & Configuration` to `Email Massa Page`, `Community 3`, `Community 6`, `Community 9`, `CRM Configurações`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `InfoButton()` connect `Admin & Configuration` to `Email Massa Page`, `Community 3`, `Community 6`, `Community 9`, `CRM Configurações`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `db` connect `API Routes & Models` to `Community 10`, `Community 11`, `Community 12`, `Email Import/Massa Routes`, `CRM Configurações`, `Email/SMTP Config`, `CRM API Routes`, `Community 15`, `Community 17`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `getInfoContent()` (e.g. with `PermissoesPage()` and `UsuariosPage()`) actually correct?**
  _`getInfoContent()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `config`, `metadata`, `modulos` to the rest of the system?**
  _1092 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Middleware & Error Handling` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Dashboard Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._