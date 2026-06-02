# Graph Report - .  (2026-06-01)

## Corpus Check
- Large corpus: 220 files · ~94,291 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 1654 nodes · 3204 edges · 59 communities (43 shown, 16 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
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
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]

## God Nodes (most connected - your core abstractions)
1. `authOptions` - 98 edges
2. `db` - 81 edges
3. `getInfoContent()` - 72 edges
4. `cn()` - 65 edges
5. `getInfoContent()` - 64 edges
6. `requireAuth()` - 58 edges
7. `InfoButton()` - 37 edges
8. `Button()` - 34 edges
9. `Input()` - 32 edges
10. `getUserId()` - 32 edges

## Surprising Connections (you probably didn't know these)
- `ConfiguracoesHubPage()` --calls--> `getInfoContent()`  [EXTRACTED]
  app/(dashboard)/admin/configuracoes/page.tsx → lib/info-content/index.ts
- `NotificacoesAdminPage()` --calls--> `getInfoContent()`  [EXTRACTED]
  app/(dashboard)/admin/notificacoes/page.tsx → lib/info-content/index.ts
- `RelatoriosHubPage()` --calls--> `getInfoContent()`  [EXTRACTED]
  app/(dashboard)/dashboard/relatorios/page.tsx → lib/info-content/index.ts
- `RelatorioAtividadeUsuario()` --calls--> `getInfoContent()`  [EXTRACTED]
  app/(dashboard)/dashboard/relatorios/atividade-usuario/page.tsx → lib/info-content.ts
- `RelatorioSolicitacoesCriadas()` --calls--> `getInfoContent()`  [EXTRACTED]
  app/(dashboard)/dashboard/relatorios/solicitacoes-criadas/page.tsx → lib/info-content.ts

## Communities (59 total, 16 thin omitted)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (143): NovoFornecedor, NovoClientePage(), Fio, DashboardAmostras(), Cliente, DashboardPage(), BancoDados, FiosPage() (+135 more)

### Community 3 - "Community 3"
Cohesion: 0.25
Nodes (3): NewBancoDados, bancosDados, BancoDados

### Community 4 - "Community 4"
Cohesion: 0.29
Nodes (4): NotificacaoRegra, NewNotificacaoRegra, notificacaoRegras, TIPOS_NOTIFICACAO

### Community 5 - "Community 5"
Cohesion: 0.2
Nodes (5): MODULOS, NewRole, PERMISSOES, Role, PermissoesMap

### Community 6 - "Community 6"
Cohesion: 0.47
Nodes (5): STATUS_LABELS, calcDias(), q(), GET(), processarTimeline()

### Community 14 - "Community 14"
Cohesion: 0.1
Nodes (16): Notificacao, DashboardShell(), ThemeToggle(), adminItems, SearchItem, CommandSearch(), Sidebar(), mobileNavItems (+8 more)

### Community 15 - "Community 15"
Cohesion: 0.04
Nodes (70): PopoverHeader(), SEGMENTOS_LABELS, CardTitle(), RadioGroupItem(), DropdownMenuLabel(), BriefingTecelagemFormProps, SecaoAplicacao(), PopoverTitle() (+62 more)

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (27): MesData, RecentLog, RelatorioTempoStatusAmostras(), TimelineEntry, Stats, tableToHTML(), Stats, TIPO_LABELS (+19 more)

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (5): "clientes", "usuarios", "sessions", "anexos", "solicitacoes"

### Community 18 - "Community 18"
Cohesion: 0.29
Nodes (6): "acabamentos", "cores_solidas", "operacoes", "cores_fundo", "fios", "maquinas"

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (14): "fios_fornecedores", "fornecedores", "fios", "solicitacoes", "cores_solidas", "cores_fundo", "acabamentos", "operacoes" (+6 more)

### Community 20 - "Community 20"
Cohesion: 0.17
Nodes (11): operacoes, estampas, fios, cores_fundo, maquinas, bases_urdume, cores_solidas, acabamentos (+3 more)

### Community 21 - "Community 21"
Cohesion: 0.5
Nodes (3): bases_urdume, estampas, cores_solidas

### Community 22 - "Community 22"
Cohesion: 0.13
Nodes (14): usuarios, cores_solidas, solicitacoes, anexos, cores_fundo, operacoes, fios, maquinas (+6 more)

### Community 23 - "Community 23"
Cohesion: 0.46
Nodes (7): produto_cru_estrutura, produto_cru_acabamento_amostra, produto_cru_amostra, produto_cru_acabamento, produto_cru_acabamento_receita, produto_cru_composicao, produtos_cru

### Community 25 - "Community 25"
Cohesion: 0.4
Nodes (4): email_config, produto_cru_amostra, produto_cru_acabamento_amostra, notificacoes

### Community 29 - "Community 29"
Cohesion: 0.03
Nodes (73): name, notNull, tableFrom, onDelete, name, notNull, name, notNull (+65 more)

### Community 30 - "Community 30"
Cohesion: 0.03
Nodes (77): name, foreignKeys, schema, sessions_session_token_unique, onUpdate, sessions_user_id_usuarios_id_fk, nullsNotDistinct, indexes (+69 more)

### Community 31 - "Community 31"
Cohesion: 0.02
Nodes (124): primaryKey, notNull, notNull, notNull, type, name, primaryKey, primaryKey (+116 more)

### Community 32 - "Community 32"
Cohesion: 0.01
Nodes (164): notNull, created_at, telefone, primaryKey, notNull, type, pantone, notNull (+156 more)

### Community 33 - "Community 33"
Cohesion: 0.08
Nodes (26): compositePrimaryKeys, uniqueConstraints, onDelete, isRLSEnabled, tableTo, columns, nullsNotDistinct, columnsTo (+18 more)

### Community 34 - "Community 34"
Cohesion: 0.03
Nodes (68): type, type, columnsTo, primaryKey, name, columnsFrom, name, type (+60 more)

### Community 35 - "Community 35"
Cohesion: 0.03
Nodes (71): tables, isRLSEnabled, policies, schema, foreignKeys, indexes, name, checkConstraints (+63 more)

### Community 36 - "Community 36"
Cohesion: 0.5
Nodes (3): version, dialect, entries

### Community 37 - "Community 37"
Cohesion: 0.5
Nodes (3): Acabamento, acabamentos, NewAcabamento

### Community 38 - "Community 38"
Cohesion: 0.1
Nodes (18): POST(), Destinatario, DELETE(), GET(), parseEmails(), buscarDestinatarios(), emailConfig, DELETE() (+10 more)

### Community 39 - "Community 39"
Cohesion: 0.02
Nodes (155): CorSolida, parseJSON(), notificacoes, anexos, POST(), BaseImport, DELETE(), NewFioFornecedor (+147 more)

### Community 40 - "Community 40"
Cohesion: 0.29
Nodes (6): NewOperacao, maquinas, operacoes, Operacao, Maquina, NewMaquina

### Community 41 - "Community 41"
Cohesion: 0.5
Nodes (3): JWT, User, Session

### Community 43 - "Community 43"
Cohesion: 0.21
Nodes (5): integracoes, Integracao, maskSensitive(), GET(), NewIntegracao

### Community 45 - "Community 45"
Cohesion: 0.67
Nodes (3): isPrivateIP(), BLOCKED_HOSTS, GET()

### Community 46 - "Community 46"
Cohesion: 0.15
Nodes (4): EMOJIS, Mensagem, Chat, EmojiPicker()

### Community 47 - "Community 47"
Cohesion: 0.03
Nodes (58): NovaRequisicaoCortePage(), TIPOS_ACABAMENTO_LABELS, STATUS_LABELS, TOQUE_LABELS, comercialContent, DashboardReqCorte(), NotificacoesAdminPage(), Props (+50 more)

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (6): addButton, LinksEditor(), urlInput, removeButtons, { onChange }, descInput

### Community 50 - "Community 50"
Cohesion: 0.29
Nodes (5): backdrop, alertIcon, { onCancel }, { container }, { onConfirm }

### Community 51 - "Community 51"
Cohesion: 0.12
Nodes (21): fioSchema, linkSchema, integracaoSchema, produtoCruSchema, solicitacaoSchema, r2, requisicaoCorteItemSchema, emailModeloSchema (+13 more)

### Community 52 - "Community 52"
Cohesion: 0.67
Nodes (3): "email_modelos", "email_listas", "email_lista_contatos"

### Community 54 - "Community 54"
Cohesion: 0.2
Nodes (9): Chat, NewChat, NewChatMensagem, chatLeituras, chatParticipantes, ChatLeitura, ChatParticipante, ChatMensagem (+1 more)

### Community 55 - "Community 55"
Cohesion: 0.33
Nodes (3): NewEmailModelo, emailModelos, EmailModelo

### Community 56 - "Community 56"
Cohesion: 0.25
Nodes (7): NewRequisicaoCorteItem, STATUS_VALIDOS, requisicoesCorteItens, requisicoesCorte, RequisicaoCorte, NewRequisicaoCorte, RequisicaoCorteItem

## Knowledge Gaps
- **827 isolated node(s):** `config`, `metadata`, `modulos`, `BancoDados`, `PermissoesData` (+822 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `authOptions` connect `Community 39` to `Community 3`, `Community 4`, `Community 5`, `Community 38`, `Community 6`, `Community 42`, `Community 43`, `Community 44`, `Community 45`, `Community 14`, `Community 51`, `Community 55`, `Community 56`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `getInfoContent()` connect `Community 2` to `Community 47`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `getInfoContent()` connect `Community 2` to `Community 16`, `Community 15`, `Community 47`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `config`, `metadata`, `modulos` to the rest of the system?**
  _827 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Community 14` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 15` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._