# Graphify Knowledge Graph

O projeto tem um grafo de conhecimento em `graphify-out/` com 2599 nós, 6179 arestas e 82 comunidades.

## Como usar

- **Consulta rápida**: carregue `graphify-out/GRAPH_REPORT.md` (326 linhas) para visão geral das comunidades
- **Consulta detalhada**: carregue `graphify-out/graph.json` e pesquise nós/arestas para entender dependências entre arquivos
- **Perguntas específicas**: aponte o nome do nó (ex: `requireAuth`, `getInfoContent`, `prisma`) que eu encontro no grafo

Sempre consulte o grafo ANTES de responder perguntas sobre arquitetura, fluxos ou dependências do código.

# Multi-Database Setup

O projeto utiliza **3 bancos de dados PostgreSQL** no mesmo servidor:

| Banco | Uso | Variável |
|---|---|---|
| `pdm_textil` | Instância principal | `DATABASE_URL` |
| `pdm_pro_textil` | PDM Pro Têxtil (produção) | `DATABASE_URL_PDM_PRO_TEXTIL` |
| `pdm_ibirapuera` | PDM Ibirapuera (produção) | `DATABASE_URL_PDM_IBIRAPUERA` |

## IMPORTANTE: Replicação de Mudanças

**TODA mudança no schema do banco `pdm_textil` DEVE ser replicada para os outros dois bancos.**

### Procedimento obrigatório:

1. Crie a migration: `npx drizzle-kit generate`
2. Aplique no principal: `npm run db:migrate`
3. **Replicate para todos**: `npm run db:migrate:all`

### Documentação completa

Consulte `docs/MULTI-DATABASE-SETUP.md` para detalhes sobre:
- URLs de conexão
- Scripts de migração
- Verificação de integridade
- Troubleshooting
