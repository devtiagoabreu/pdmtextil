# Multi-Database Setup - PDM Têxtil

## Visão Geral

O projeto PDM Têxtil utiliza **três bancos de dados PostgreSQL** no mesmo servidor, cada um para uma instância diferente do sistema:

| Banco de Dados | Uso | Variável de Ambiente |
|---|---|---|
| `pdm_textil` | Instância principal (desenvolvimento/testes) | `DATABASE_URL` |
| `pdm_pro_textil` | Instância PDM Pro Têxtil (produção) | `DATABASE_URL_PDM_PRO_TEXTIL` |
| `pdm_ibirapuera` | Instância PDM Ibirapuera (produção) | `DATABASE_URL_PDM_IBIRAPUERA` |

## Configuração do Servidor

- **Host**: `94550ac37bb5.sn.mynetname.net`
- **Porta**: `21237`
- **Usuário**: `postgres`
- **Driver**: PostgreSQL (via `postgres` driver / postgres-js)

## URLs de Conexão

```
DATABASE_URL="postgresql://postgres:dqgh3ffrdg@94550ac37bb5.sn.mynetname.net:21237/pdm_textil"
DATABASE_URL_PDM_PRO_TEXTIL="postgresql://postgres:dqgh3ffrdg@94550ac37bb5.sn.mynetname.net:21237/pdm_pro_textil"
DATABASE_URL_PDM_IBIRAPUERA="postgresql://postgres:dqgh3ffrdg@94550ac37bb5.sn.mynetname.net:21237/pdm_ibirapuera"
```

## Scripts de Migração

### Criar Bancos de Dados

```bash
node scripts/create-databases.js
```

Este script cria os bancos `pdm_pro_textil` e `pdm_ibirapuera` se não existirem.

### Migrar Todos os Bancos

```bash
npm run db:migrate:all
# ou
node scripts/migrate-all.js
```

Este script aplica todas as migrações do Drizzle em todos os três bancos de dados.

### Migrar Apenas o Banco Principal

```bash
npm run db:migrate
```

## IMPORTANTE: Replicação de Mudanças

**TODA mudança feita no esquema do banco `pdm_textil` DEVE ser replicada para `pdm_pro_textil` e `pdm_ibirapuera`.**

### Procedimento para Novas Migrações

1. **Crie a migration** normalmente usando Drizzle Kit:
   ```bash
   npx drizzle-kit generate
   ```

2. **Aplique no banco principal**:
   ```bash
   npm run db:migrate
   ```

3. **Replicate para todos os bancos**:
   ```bash
   npm run db:migrate:all
   ```

4. **Verifique** que todas as tabelas foram criadas em todos os bancos

### Estrutura de Arquivos

```
pdmtextil/
├── src/lib/db/
│   ├── index.ts              # Conexão principal com o banco
│   ├── schema/               # Definições de tabelas Drizzle
│   │   ├── usuarios.ts
│   │   ├── clientes.ts
│   │   └── ... (50+ arquivos)
│   └── migrations/           # Migrations SQL do Drizzle
│       ├── 0000_careful_iron_monger.sql
│       ├── 0001_new_tables.sql
│       └── ... (27+ migrations)
├── scripts/
│   ├── create-databases.js   # Cria novos bancos
│   ├── migrate-all.js        # Migra todos os bancos (Drizzle + custom)
│   ├── migrate.js            # Migra apenas o banco principal
│   ├── verify-databases.js   # Verifica sincronização entre bancos
│   ├── add-user-menus.sql    # SQL auxiliar: tabelas de menus
│   └── add-perfil-menus.sql  # SQL auxiliar: colunas de perfil
├── drizzle.config.ts         # Configuração do Drizzle Kit
└── .env.local                # URLs de conexão
```

## Verificação de Integridade

Para verificar se todos os bancos estão sincronizados:

```bash
node scripts/verify-databases.js
```

Ou manualmente:

```sql
-- Conectar a cada banco e executar:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## Troubleshooting

### Erro de Conexão

1. Verifique se o servidor está acessível
2. Confirme as credenciais no `.env.local`
3. Teste a conexão usando um script simples com `postgres` driver

### Migração Falhou

1. Verifique os logs de erro
2. Execute a migração manualmente no banco problemático
3. Verifique se há conflitos de schema

### Bancos Fora de Sincronia

1. Execute `npm run db:migrate:all` para sincronizar
2. Use `node scripts/verify-databases.js` para comparar tabelas entre bancos
3. Em caso de dúvida, recrie o banco problemático

## Notas Importantes

- **Produção**: Os bancos `pdm_pro_textil` e `pdm_ibirapuera` são ambientes de produção
- **Backup**: mantenha backups regulares de todos os bancos
- **Segurança**: nunca commite credenciais no repositório
- **Testes**: sempre teste mudanças no banco principal primeiro