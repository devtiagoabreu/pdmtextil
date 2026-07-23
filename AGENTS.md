# Graphify Knowledge Graph

O projeto tem um grafo de conhecimento em `graphify-out/` com 2599 nós, 6179 arestas e 82 comunidades.

## Como usar

- **Consulta rápida**: carregue `graphify-out/GRAPH_REPORT.md` (326 linhas) para visão geral das comunidades
- **Consulta detalhada**: carregue `graphify-out/graph.json` e pesquise nós/arestas para entender dependências entre arquivos
- **Perguntas específicas**: aponte o nome do nó (ex: `requireAuth`, `getInfoContent`, `prisma`) que eu encontro no grafo

Sempre consulte o grafo ANTES de responder perguntas sobre arquitetura, fluxos ou dependências do código.

# Multi-Database Setup

O projeto utiliza **4 bancos de dados PostgreSQL**:

| Banco | Uso | Variável |
|---|---|---|
| `pdm_textil` | Instância principal | `DATABASE_URL` |
| `pdm_pro_textil` | PDM Pro Têxtil (produção) | `DATABASE_URL_PDM_PRO_TEXTIL` |
| `pdm_ibirapuera` | PDM Ibirapuera (produção) | `DATABASE_URL_PDM_IBIRAPUERA` |
| Neon | Banco auxiliar Neon (produção) | `DATABASE_URL_NEON` |

## IMPORTANTE: Replicação de Mudanças

**TODA mudança no schema do banco `pdm_textil` DEVE ser replicada para TODOS os outros 3 bancos.**

### Procedimento obrigatório:

1. Crie a migration: `npx drizzle-kit generate`
2. Aplique no principal: `npm run db:migrate`
3. **Replicate para os 3 secundários**: `npm run db:migrate:all`
4. **Neon também**: rode `node scripts/sync-all-dbs.js` (cria colunas/tabelas faltantes com IF NOT EXISTS)

### Para alterações manuais de schema (SQL direto):

Se precisar rodar SQL manualmente (ALTER TABLE, CREATE TABLE, etc.), execute em TODOS:
- `pdm_textil` (principal)
- `pdm_pro_textil`
- `pdm_ibirapuera`
- Neon (`DATABASE_URL_NEON`)

### Verificação de integridade:

```bash
node scripts/compare-schemas.js
```

Compara colunas entre os 4 bancos e lista diferenças.
