# Graph Report - .  (2026-05-15)

## Corpus Check
- Corpus is ~48,370 words - fits in a single context window. You may not need a graph.

## Summary
- 1048 nodes · 1525 edges · 92 communities (81 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
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
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
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
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 65 edges
2. `authOptions` - 37 edges
3. `db` - 33 edges
4. `Button()` - 22 edges
5. `Input()` - 19 edges
6. `columns` - 17 edges
7. `columns` - 16 edges
8. `columns` - 15 edges
9. `columns` - 13 edges
10. `Label()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `CardAction()` --calls--> `cn()`  [EXTRACTED]
  components/ui/card.tsx → lib/utils.ts
- `ClienteAutocomplete()` --calls--> `cn()`  [EXTRACTED]
  components/forms/ClienteAutocomplete.tsx → lib/utils.ts
- `Button()` --calls--> `cn()`  [EXTRACTED]
  components/ui/button.tsx → lib/utils.ts
- `Card()` --calls--> `cn()`  [EXTRACTED]
  components/ui/card.tsx → lib/utils.ts
- `CardHeader()` --calls--> `cn()`  [EXTRACTED]
  components/ui/card.tsx → lib/utils.ts

## Communities (92 total, 11 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (49): client, db, GET(), POST(), DELETE(), GET(), PUT(), BaseImport (+41 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (19): BaseUrdume, CorSolida, Estampa, Fio, AnexosUploadProps, Cliente, ClienteAutocompleteProps, Fornecedor (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (48): created_at, criado_por, metadados, mime_type, nome_arquivo, solicitacao_id, tamanho, titulo (+40 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (47): criado_por, metadados, mime_type, nome_arquivo, solicitacao_id, tamanho, tipo, titulo (+39 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (46): columns, name, nullsNotDistinct, columns, name, nullsNotDistinct, dialect, id (+38 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (41): name, notNull, primaryKey, type, name, notNull, primaryKey, type (+33 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (25): cn(), DialogOverlay(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator() (+17 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (20): BriefingTecelagemFormProps, LIGAMENTO_LABELS, SEGMENTOS_LABELS, TECNOLOGIAS_LABELS, TIPO_FIBRA_LABELS, TIPOS_ACABAMENTO_LABELS, BriefingTecelagem, briefingTecelagemSchema (+12 more)

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (18): STEPS, AnexoDraft, AnexosUpload(), BriefingTecelagemForm(), ClienteAutocomplete(), STEPS, DadosComerciais, dadosComerciaisSchema (+10 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (26): columns, name, nullsNotDistinct, columns, name, nullsNotDistinct, columnsFrom, columnsTo (+18 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (26): columnsFrom, columnsTo, name, onDelete, onUpdate, tableFrom, tableTo, columnsFrom (+18 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (22): sessions_user_id_usuarios_id_fk, checkConstraints, compositePrimaryKeys, foreignKeys, indexes, isRLSEnabled, name, policies (+14 more)

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (12): DashboardShell(), Header(), HeaderProps, notifications, MobileBottomNav(), mobileNavItems, NavRole, navItems (+4 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (17): solicitacoes_responsavel_id_usuarios_id_fk, solicitacoes_solicitante_id_usuarios_id_fk, foreignKeys, columnsFrom, columnsTo, name, onDelete, onUpdate (+9 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (13): ABRASAO_LABELS, BRILHO_LABELS, CORES_LABELS, LIGAMENTO_LABELS, PRECO_LABELS, SEGMENTOS_LABELS, STATUS_CONFIG, TECNOLOGIAS_LABELS (+5 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (14): "acabamentos", "anexos", "bases_urdume", "clientes", "cores_fundo", "cores_solidas", "estampas", "fios" (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (14): acabamentos, anexos, bases_urdume, clientes, cores_fundo, cores_solidas, estampas, fios (+6 more)

### Community 17 - "Community 17"
Cohesion: 0.32
Nodes (7): Card(), CardAction(), CardContent(), CardDescription(), CardFooter(), CardHeader(), CardTitle()

### Community 18 - "Community 18"
Cohesion: 0.17
Nodes (11): acabamentos, bases_urdume, clientes, cores_fundo, cores_solidas, estampas, fios, fios_fornecedores (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.18
Nodes (11): expires, session_token, name, notNull, primaryKey, type, columns, name (+3 more)

### Community 20 - "Community 20"
Cohesion: 0.18
Nodes (10): dialect, enums, id, policies, prevId, roles, schemas, sequences (+2 more)

### Community 21 - "Community 21"
Cohesion: 0.18
Nodes (11): name, notNull, primaryKey, type, codigo, id_integracao, name, notNull (+3 more)

### Community 22 - "Community 22"
Cohesion: 0.18
Nodes (11): imagem_url, tipo, name, notNull, primaryKey, type, columns, name (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.18
Nodes (11): name, notNull, primaryKey, type, categoria, descricao, name, notNull (+3 more)

### Community 24 - "Community 24"
Cohesion: 0.18
Nodes (11): familia, pantone, name, notNull, primaryKey, type, name, notNull (+3 more)

### Community 25 - "Community 25"
Cohesion: 0.2
Nodes (10): checkConstraints, compositePrimaryKeys, indexes, isRLSEnabled, name, policies, schema, uniqueConstraints (+2 more)

### Community 26 - "Community 26"
Cohesion: 0.2
Nodes (10): checkConstraints, compositePrimaryKeys, foreignKeys, indexes, isRLSEnabled, name, policies, schema (+2 more)

### Community 27 - "Community 27"
Cohesion: 0.22
Nodes (9): columnsFrom, columnsTo, name, onDelete, onUpdate, tableFrom, tableTo, anexos_criado_por_usuarios_id_fk (+1 more)

### Community 28 - "Community 28"
Cohesion: 0.22
Nodes (9): checkConstraints, compositePrimaryKeys, indexes, isRLSEnabled, name, policies, schema, uniqueConstraints (+1 more)

### Community 29 - "Community 29"
Cohesion: 0.22
Nodes (9): checkConstraints, compositePrimaryKeys, foreignKeys, indexes, isRLSEnabled, name, policies, schema (+1 more)

### Community 30 - "Community 30"
Cohesion: 0.22
Nodes (9): checkConstraints, compositePrimaryKeys, foreignKeys, indexes, isRLSEnabled, name, policies, schema (+1 more)

### Community 31 - "Community 31"
Cohesion: 0.31
Nodes (4): metadata, Providers(), QueryProvider(), Toaster()

### Community 32 - "Community 32"
Cohesion: 0.25
Nodes (8): columnsFrom, columnsTo, name, onDelete, onUpdate, tableFrom, tableTo, anexos_solicitacao_id_solicitacoes_id_fk

### Community 33 - "Community 33"
Cohesion: 0.29
Nodes (6): "acabamentos", "cores_fundo", "cores_solidas", "fios", "maquinas", "operacoes"

### Community 34 - "Community 34"
Cohesion: 0.29
Nodes (6): Maquina, maquinas, NewMaquina, NewOperacao, Operacao, operacoes

### Community 35 - "Community 35"
Cohesion: 0.33
Nodes (6): updated_at, default, name, notNull, primaryKey, type

### Community 36 - "Community 36"
Cohesion: 0.33
Nodes (6): created_at, default, name, notNull, primaryKey, type

### Community 37 - "Community 37"
Cohesion: 0.33
Nodes (6): role, default, name, notNull, primaryKey, type

### Community 38 - "Community 38"
Cohesion: 0.33
Nodes (6): default, name, notNull, primaryKey, type, ativo

### Community 39 - "Community 39"
Cohesion: 0.33
Nodes (6): ultimo_acesso, columns, name, notNull, primaryKey, type

### Community 40 - "Community 40"
Cohesion: 0.33
Nodes (5): "anexos", "clientes", "sessions", "solicitacoes", "usuarios"

### Community 41 - "Community 41"
Cohesion: 0.33
Nodes (6): default, name, notNull, primaryKey, type, ativo

### Community 42 - "Community 42"
Cohesion: 0.33
Nodes (6): id, name, notNull, primaryKey, type, columns

### Community 43 - "Community 43"
Cohesion: 0.33
Nodes (6): updated_at, default, name, notNull, primaryKey, type

### Community 44 - "Community 44"
Cohesion: 0.33
Nodes (6): name, notNull, primaryKey, type, briefing, columns

### Community 45 - "Community 45"
Cohesion: 0.33
Nodes (6): status, default, name, notNull, primaryKey, type

### Community 46 - "Community 46"
Cohesion: 0.33
Nodes (6): historico_comunicacao, default, name, notNull, primaryKey, type

### Community 47 - "Community 47"
Cohesion: 0.33
Nodes (6): name, notNull, primaryKey, type, cnpj, columns

### Community 49 - "Community 49"
Cohesion: 0.4
Nodes (5): user_id, name, notNull, primaryKey, type

### Community 50 - "Community 50"
Cohesion: 0.4
Nodes (5): email, name, notNull, primaryKey, type

### Community 51 - "Community 51"
Cohesion: 0.4
Nodes (5): password, name, notNull, primaryKey, type

### Community 52 - "Community 52"
Cohesion: 0.4
Nodes (5): id, name, notNull, primaryKey, type

### Community 53 - "Community 53"
Cohesion: 0.4
Nodes (5): name, name, notNull, primaryKey, type

### Community 54 - "Community 54"
Cohesion: 0.4
Nodes (5): uniqueConstraints, usuarios_email_unique, columns, name, nullsNotDistinct

### Community 55 - "Community 55"
Cohesion: 0.4
Nodes (5): nome, name, notNull, primaryKey, type

### Community 56 - "Community 56"
Cohesion: 0.4
Nodes (5): variante, name, notNull, primaryKey, type

### Community 57 - "Community 57"
Cohesion: 0.4
Nodes (5): name, notNull, primaryKey, type, codigo_desenho

### Community 58 - "Community 58"
Cohesion: 0.4
Nodes (5): solicitante_id, name, notNull, primaryKey, type

### Community 59 - "Community 59"
Cohesion: 0.4
Nodes (5): name, notNull, primaryKey, type, cnpj

### Community 60 - "Community 60"
Cohesion: 0.4
Nodes (5): observacoes, name, notNull, primaryKey, type

### Community 61 - "Community 61"
Cohesion: 0.4
Nodes (5): data_conclusao, name, notNull, primaryKey, type

### Community 62 - "Community 62"
Cohesion: 0.4
Nodes (5): name, notNull, primaryKey, type, cliente

### Community 63 - "Community 63"
Cohesion: 0.4
Nodes (5): responsavel_id, name, notNull, primaryKey, type

### Community 64 - "Community 64"
Cohesion: 0.4
Nodes (5): prazo_desejado, name, notNull, primaryKey, type

### Community 65 - "Community 65"
Cohesion: 0.4
Nodes (5): projeto, name, notNull, primaryKey, type

### Community 66 - "Community 66"
Cohesion: 0.4
Nodes (5): contato, name, notNull, primaryKey, type

### Community 67 - "Community 67"
Cohesion: 0.4
Nodes (5): email, name, notNull, primaryKey, type

### Community 68 - "Community 68"
Cohesion: 0.4
Nodes (5): endereco, name, notNull, primaryKey, type

### Community 69 - "Community 69"
Cohesion: 0.4
Nodes (5): razao_social, name, notNull, primaryKey, type

### Community 70 - "Community 70"
Cohesion: 0.4
Nodes (5): columns, name, nullsNotDistinct, uniqueConstraints, clientes_cnpj_unique

### Community 71 - "Community 71"
Cohesion: 0.4
Nodes (5): name, notNull, primaryKey, type, cidade

### Community 72 - "Community 72"
Cohesion: 0.4
Nodes (5): telefone, name, notNull, primaryKey, type

### Community 73 - "Community 73"
Cohesion: 0.4
Nodes (5): uf, name, notNull, primaryKey, type

### Community 75 - "Community 75"
Cohesion: 0.5
Nodes (4): _meta, columns, schemas, tables

### Community 76 - "Community 76"
Cohesion: 0.5
Nodes (3): Acabamento, acabamentos, NewAcabamento

### Community 79 - "Community 79"
Cohesion: 0.5
Nodes (3): dialect, entries, version

### Community 80 - "Community 80"
Cohesion: 0.5
Nodes (3): JWT, Session, User

### Community 85 - "Community 85"
Cohesion: 0.5
Nodes (3): bases_urdume, cores_solidas, estampas

## Knowledge Gaps
- **634 isolated node(s):** `config`, `metadata`, `modulos`, `BaseUrdume`, `BaseUrdume` (+629 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `columns` connect `Community 5` to `Community 2`, `Community 9`, `Community 42`, `Community 41`, `Community 43`, `Community 55`, `Community 21`, `Community 23`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `columns` connect `Community 44` to `Community 64`, `Community 65`, `Community 3`, `Community 36`, `Community 35`, `Community 45`, `Community 46`, `Community 52`, `Community 25`, `Community 58`, `Community 59`, `Community 60`, `Community 61`, `Community 62`, `Community 63`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `columns` connect `Community 2` to `Community 10`, `Community 42`, `Community 21`, `Community 22`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `config`, `metadata`, `modulos` to the rest of the system?**
  _634 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._