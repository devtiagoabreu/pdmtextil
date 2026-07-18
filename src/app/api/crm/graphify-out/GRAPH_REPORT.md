# Graph Report - src\app\api\crm  (2026-07-16)

## Corpus Check
- Corpus is ~17,255 words - fits in a single context window. You may not need a graph.

## Summary
- 123 nodes · 126 edges · 34 communities (28 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 32|Community 32]]

## God Nodes (most connected - your core abstractions)
1. `PUT()` - 14 edges
2. `DELETE()` - 14 edges
3. `GET()` - 9 edges
4. `step()` - 5 edges
5. `extrairNumero()` - 4 edges
6. `extractRemoteJid()` - 3 edges
7. `GET()` - 3 edges
8. `POST()` - 3 edges
9. `GET()` - 3 edges
10. `POST()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `extractRemoteJid()`  [EXTRACTED]
  whatsapp/route.ts → leads/[id]/whatsapp/route.ts
- `POST()` --calls--> `extractRemoteJid()`  [EXTRACTED]
  whatsapp/route.ts → leads/[id]/whatsapp/route.ts

## Communities (34 total, 6 thin omitted)

### Community 11 - "Community 11"
Cohesion: 0.5
Nodes (3): DELETE(), PUT(), GET()

### Community 13 - "Community 13"
Cohesion: 0.5
Nodes (3): POST(), extractRemoteJid(), GET()

### Community 30 - "Community 30"
Cohesion: 0.5
Nodes (9): step(), fulfilled(), adopt(), POST(), GET(), extrairNumero(), rejected(), crmWhatsappConversas (+1 more)

## Knowledge Gaps
- **1 isolated node(s):** `crmWhatsappConversas`
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `crmWhatsappConversas` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._