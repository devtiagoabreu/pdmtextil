# Graph Report - src\components\crm  (2026-07-16)

## Corpus Check
- Corpus is ~12,840 words - fits in a single context window. You may not need a graph.

## Summary
- 120 nodes · 134 edges · 18 communities (12 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
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

## God Nodes (most connected - your core abstractions)
1. `DroppableColumn()` - 8 edges
2. `KanbanSkeleton()` - 8 edges
3. `formatarData()` - 3 edges
4. `DraggableCard()` - 3 edges
5. `formatCnpj()` - 2 edges
6. `BuscarCnpjModal()` - 2 edges
7. `formatarData()` - 2 edges
8. `DraggableCard()` - 2 edges
9. `formatar()` - 2 edges
10. `DraggableCard()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (18 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.5
Nodes (4): BuscarCnpjModalProps, formatCnpj(), BuscarCnpjModal(), ApiData

### Community 1 - "Community 1"
Cohesion: 0.5
Nodes (6): formatarData(), CampanhaCard, TIPO_CORES, DraggableCard(), TIPO_LABELS, DEFAULT_STATUSES

### Community 5 - "Community 5"
Cohesion: 0.5
Nodes (4): Breadcrumb, DriveFile, DriveItem, GoogleDrivePickerProps

### Community 6 - "Community 6"
Cohesion: 0.5
Nodes (4): PessoaCard, DraggableCard(), DEFAULT_STATUSES, formatarDocumento()

### Community 7 - "Community 7"
Cohesion: 0.5
Nodes (4): PropostaCard, DEFAULT_STATUSES, DraggableCard(), formatar()

### Community 8 - "Community 8"
Cohesion: 0.5
Nodes (11): QuickCreateEstado(), Estado, Props, Cidade, Props, SelectCidade(), Props, Props (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (11): ORIGEM_LABELS, OportunidadeCard, DEFAULT_STATUSES, KanbanSkeleton(), DraggableCard(), RequisicaoCard, DEFAULT_STATUSES, formatar() (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.5
Nodes (3): RichTextEditorProps, FONT_FAMILIES, FONT_SIZES

### Community 14 - "Community 14"
Cohesion: 0.5
Nodes (6): DraggableCard(), TIPO_CORES, TarefaCard, formatarData(), TIPO_LABELS, DEFAULT_STATUSES

### Community 15 - "Community 15"
Cohesion: 0.5
Nodes (6): Visita, formatDateKey(), TIPO_CORES, DIAS_SEMANA, TIPO_LABELS, VisitasCalendario()

### Community 16 - "Community 16"
Cohesion: 0.5
Nodes (6): TIPO_LABELS, VisitaCard, formatarData(), DraggableCard(), isFutura(), VisitasKanban()

## Knowledge Gaps
- **49 isolated node(s):** `BuscarCnpjModalProps`, `ApiData`, `CampanhaCard`, `TIPO_LABELS`, `TIPO_CORES` (+44 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DroppableColumn()` connect `Community 12` to `Community 1`, `Community 14`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `KanbanSkeleton()` connect `Community 12` to `Community 1`, `Community 14`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `BuscarCnpjModalProps`, `ApiData`, `CampanhaCard` to the rest of the system?**
  _49 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 12` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._