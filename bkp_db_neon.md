# Backup do Banco de Dados Neon → Migração para Servidor Dedicado

## Status: Backup completo, aguardando servidor dedicado

---

## 1. Banco de Origem (Neon)

- **Plano:** Neon Postgres (free tier → upgrade para Lg [Launch] após estouro de quota)
- **Região:** sa-east-1 (São Paulo)
- **URL de conexão:** em `.env.local` → `DATABASE_URL`
- **Driver aplicação:** `@neondatabase/serverless` (conexão HTTP via `neon()`)
- **ORM:** Drizzle ORM
- **77 tabelas**, ~12.948 registros (backup de 2026-07-20)

---

## 2. Backup

### Arquivo
- **Caminho:** `backups/backup-2026-07-20.sql`
- **Tamanho:** ~1.98 MB
- **Formato:** SQL puro (INSERTs, TRUNCATEs, ALTER TABLEs)
- **Compatível com:** qualquer PostgreSQL 14+

### Script de backup
- **Caminho:** `scripts/backup-db.mjs`
- **Uso:** `node scripts/backup-db.mjs`
- **Dependências:** `@neondatabase/serverless`, `dotenv`
- **Nota:** Usa `sql.query()` (retorna array direto), NÃO `sql.unsafe()` (retorna objeto lazy)
- **Depende de:** `.env.local` com `DATABASE_URL` apontando para o Neon

### O que o script faz
1. Lista todas as tabelas `public` via `information_schema.tables`
2. Para cada tabela: conta registros, busca dados via `sql.query()`
3. Gera SQL com `TRUNCATE CASCADE`, `DISABLE TRIGGER ALL`, `INSERT INTO`, `ENABLE TRIGGER ALL`
4. Colunas auto-increment (`nextval`) são excluídas dos INSERTs (o banco gera automaticamente)
5. Salva em `backups/backup-YYYY-MM-DD.sql`

---

## 3. Restauração no Novo Servidor

### Pré-requisitos
- PostgreSQL 14+ instalado no servidor dedicado
- Acesso ao terminal do servidor (SSH)
- O arquivo `backups/backup-2026-07-20.sql` transferido para o servidor

### Passo a passo

```bash
# 1. Criar o banco (se não existir)
createdb -U postgres pdm_textil

# 2. Restaurar
psql -U postgres -d pdm_textil -f backup-2026-07-20.sql

# 3. Verificar
psql -U postgres -d pdm_textil -c "SELECT COUNT(*) FROM usuarios;"
# Deve retornar 28

psql -U postgres -d pdm_textil -c "SELECT COUNT(*) FROM solicitacoes;"
# Deve retornar 12
```

### Se quiser criar um usuário dedicado (recomendado)
```sql
CREATE USER pdm_user WITH PASSWORD 'SENHA_SEGURA_AQUI';
GRANT ALL PRIVILEGES ON DATABASE pdm_textil TO pdm_user;
GRANT ALL ON SCHEMA public TO pdm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pdm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pdm_user;
```

---

## 4. Migração da Aplicação

### Arquivo a alterar: `.env.local` (e variáveis de ambiente do Vercel)
```
DATABASE_URL="postgresql://pdm_user:SENHA@IP_DO_SERVIDOR:5432/pdm_textil?sslmode=require"
```

### Arquivo a alterar: `src/lib/db/index.ts`

O driver atual é `@neondatabase/serverless` (HTTP). Para servidor dedicado, usar WebSocket pool do mesmo pacote:

```typescript
// DE (Neon HTTP):
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL!)
export { sql }

// PARA (WebSocket pool - funciona tanto Neon quanto dedicado):
import {Pool} from '@neondatabase/serverless'
const pool = new Pool({connectionString: process.env.DATABASE_URL})
export {pool as sql}
```

**Ou** instalar `postgres` (puro):
```bash
npm install postgres
```
```typescript
import postgres from 'postgres'
const sql = postgres(process.env.DATABASE_URL!)
export default sql
```

### Drizzle config (`drizzle.config.ts`)
- Não precisa mudar — aceita qualquer Postgres

### Schema Drizzle (`src/lib/db/schema/*`)
- Não precisa mudar — 100% portável

### Queries com `sql.query()`
- Se mudar o driver, verificar se `sql.query()` continua disponível
- O backup script usa `sql.query()` que é específico do `@neondatabase/serverless`
- A aplicação usa `db.select().from()` do Drizzle (database-agnostic)

---

## 5. Connection Pooling (IMPORTANTE para Vercel)

O Vercel cria muitas conexões simultâneas via serverless functions. O Postgres dedicado precisa de pooling:

### Opção A: PgBouncer (recomendado)
```bash
sudo apt install pgbouncer
```
Configurar em `/etc/pgbouncer/pgbouncer.ini`:
```ini
[databases]
pdm_textil = host=127.0.0.1 port=5432 dbname=pdm_textil

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
```
URL de conexão muda para porta 6432.

### Opção B: `pgBouncer` no Neon (se continuar usando Neon para algo)
- Não aplicável neste caso

---

## 6. Checklist de Migração

- [ ] Servidor PostgreSQL instalado e acessível
- [ ] Backup restaurado e verificado
- [ ] Usuário do banco criado com permissões
- [ ] Firewall/Security Groups permitindo conexão na porta 5432
- [ ] SSL configurado (`sslmode=require` ou `verify-full`)
- [ ] Connection pooling configurado (PgBouncer)
- [ ] `DATABASE_URL` atualizado no Vercel
- [ ] `src/lib/db/index.ts` adaptado (se necessário)
- [ ] Teste de login funcional
- [ ] Teste de todas as funcionalidades principais
- [ ] Backup automático configurado no novo servidor (pg_dump cron diário)

---

## 7. Dados Importantes do Backup

| Tabela | Registros | Observação |
|--------|-----------|------------|
| usuarios | 28 | Usuários do sistema |
| solicitacoes | 12 | Solicitações de desenvolvimento |
| produtos_cru | 9 | Produtos em cru |
| logs | 1.259 | Logs de auditoria |
| notificacoes | 4.230 | Notificações dos usuários |
| crm_cidades | 5.570 | Cadastro de cidades IBGE |
| user_menu_itens | 504 | Itens de menus configurados |
| user_menus | 108 | Menus dos perfis |
| chat_mensagens | 49 | Mensagens do chat corporativo |
| chat_participantes | 189 | Participantes dos chats |
| crm_treino_modulos | 19 | Módulos de treinamento CRM |
| crm_treino_licoes | 28 | Lições de treinamento CRM |
| roles | 11 | Perfis de acesso |
| status | 42 | Status do sistema |
| crm_paises | 217 | Países |
| crm_estados | 27 | Estados brasileiros |

---

## 8. Possíveis Problemas na Restauração

1. **UUID vs INTEGER** — Se o novo PG usa extensões diferentes, verificar `uuid-ossp`
2. **Encoding** — O backup força `UTF8`, compatível com qualquer PG moderno
3. **Sequences** — As sequences dos IDs auto-increment precisam ser recalibradas após INSERT:
   ```sql
   -- Para cada tabela com sequence:
   SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));
   ```
   O script de backup já usa `DISABLE TRIGGER ALL` mas NÃO reset sequences.
   Rodar após restauração:
   ```sql
   DO $$
   DECLARE
     r RECORD;
   BEGIN
     FOR r IN SELECT sequencename FROM pg_sequences WHERE schemaname = 'public' LOOP
       EXECUTE format('SELECT setval(%L, COALESCE((SELECT MAX(%s) FROM %s), 1))',
         r.sequencename,
         replace(r.sequencename, '_id_seq', ''),
         replace(r.sequencename, '_id_seq', ''));
     END LOOP;
   END $$;
   ```

4. **Fks e constraints** — O backup inclui `DISABLE/ENABLE TRIGGER ALL` para evitar violações durante inserts
