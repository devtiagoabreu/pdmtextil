# Graph Report - src\app\(dashboard)\comercial\crm  (2026-07-16)

## Corpus Check
- Corpus is ~35,565 words - fits in a single context window. You may not need a graph.

## Summary
- 170 nodes · 139 edges · 34 communities (17 shown, 17 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]

## God Nodes (most connected - your core abstractions)
1. `STATUS_OPTIONS` - 3 edges
2. `formatCurrency()` - 2 edges
3. `CrmDashboardPage()` - 2 edges
4. `TIPO_LABELS` - 2 edges
5. `STATUS_CORES` - 2 edges
6. `Modulo` - 2 edges
7. `Licao` - 2 edges
8. `CrmDashboardData` - 1 edges
9. `STATUS_CORES` - 1 edges
10. `CHART_COLORS` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (34 total, 17 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.5
Nodes (7): CrmDashboardPage(), PIPELINE_COLORS, CHART_COLORS, formatCurrency(), CrmDashboardData, TIPO_EVENTO_ICON, STATUS_CORES

### Community 1 - "Community 1"
Cohesion: 0.5
Nodes (3): TIPO_LABELS, STATUS_CORES, TIPO_CORES

### Community 4 - "Community 4"
Cohesion: 0.5
Nodes (4): REGIAO_SIGLAS, Pais, Usuario, Estado

### Community 20 - "Community 20"
Cohesion: 0.5
Nodes (6): STATUS_CORES, Mensagem, STATUS_OPTIONS, TIPO_LABELS, ORIGEM_OPTIONS, TIPO_OPTIONS

### Community 25 - "Community 25"
Cohesion: 0.5
Nodes (3): PROPOSTA_LABELS, PIPELINE_LABELS, CHART_COLORS

### Community 26 - "Community 26"
Cohesion: 0.5
Nodes (4): Props, TIPO_LABELS, FILTROS, TIPO_CORES

### Community 28 - "Community 28"
Cohesion: 0.5
Nodes (3): Licao, ModuloComLicoes, Modulo

### Community 32 - "Community 32"
Cohesion: 0.5
Nodes (3): ModoVisao, TIPO_LABELS, TIPO_CORES

## Knowledge Gaps
- **51 isolated node(s):** `CrmDashboardData`, `STATUS_CORES`, `CHART_COLORS`, `PIPELINE_COLORS`, `TIPO_EVENTO_ICON` (+46 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `CrmDashboardData`, `STATUS_CORES`, `CHART_COLORS` to the rest of the system?**
  _51 weakly-connected nodes found - possible documentation gaps or missing edges._