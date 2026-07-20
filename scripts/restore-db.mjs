import postgres from 'postgres';
import { readFileSync, writeFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });

const HOST = '94550ac37bb5.sn.mynetname.net';
const PORT = 21237;
const USER = 'postgres';
const PASS = 'dqgh3ffrdg';
const DB_NAME = 'pdm_textil';
const ADMIN_URL = `postgresql://${USER}:${PASS}@${HOST}:${PORT}/postgres`;
const PDM_URL = `postgresql://${USER}:${PASS}@${HOST}:${PORT}/${DB_NAME}`;
const NEON_URL = process.env.DATABASE_URL;
const BACKUP_FILE = 'backups/backup-2026-07-20.sql';

const log = (tag, msg) => console.log(`${tag} ${msg}`);

// STEP 1: Create database
log('═══ STEP 1:', 'Criando banco pdm_textil ═══');
const admin = postgres(ADMIN_URL, { max: 1, connect_timeout: 30 });
try {
  const exists = await admin`SELECT 1 FROM pg_database WHERE datname = ${DB_NAME}`;
  if (exists.length === 0) {
    await admin.unsafe(`CREATE DATABASE "${DB_NAME}"`);
    log('  ✓', 'Banco criado');
  } else {
    log('  ✓', 'Banco já existe');
  }
} catch (e) {
  log('  ✗', e.message);
  await admin.end();
  process.exit(1);
}
await admin.end();

// STEP 2: Clean existing schema
log('\n═══ STEP 2:', 'Limpando schema existente ═══');
const remote = postgres(PDM_URL, { max: 1, connect_timeout: 30, statement_timeout: 60000 });

const existingTables = await remote`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
for (const t of existingTables) {
  try { await remote.unsafe(`DROP TABLE IF EXISTS "${t.tablename}" CASCADE`); } catch {}
}
const existingSeqs = await remote`SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'`;
for (const s of existingSeqs) {
  try { await remote.unsafe(`DROP SEQUENCE IF EXISTS "${s.sequencename}" CASCADE`); } catch {}
}
log('  ✓', `${existingTables.length} tabelas, ${existingSeqs.length} sequences removidas`);

// STEP 3: Extract schema from Neon (with proper constraint dedup)
log('\n═══ STEP 3:', 'Extraindo schema do Neon ═══');
const neon = postgres(NEON_URL, { max: 1, connect_timeout: 30 });

const tables = await neon`
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name
`;

let schemaSQL = '';

for (const t of tables) {
  const tn = t.table_name;

  const cols = await neon`
    SELECT column_name, udt_name, data_type, character_maximum_length,
           is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tn}
    ORDER BY ordinal_position
  `;

  // Get constraints with proper dedup
  const constraints = await neon`
    SELECT tc.constraint_name, tc.constraint_type, 
           string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position) as columns,
           ccu.table_name AS foreign_table, 
           string_agg(ccu.column_name, ',' ORDER BY kcu.ordinal_position) AS foreign_columns
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu 
      ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
    WHERE tc.table_schema = 'public' AND tc.table_name = ${tn}
    GROUP BY tc.constraint_name, tc.constraint_type, ccu.table_name
    ORDER BY tc.constraint_type
  `;

  const indexes = await neon`
    SELECT indexname, indexdef FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename = ${tn}
    AND indexname NOT LIKE '%_pkey'
  `;

  const colDefs = [];
  for (const c of cols) {
    let type = c.data_type;
    const isNextval = c.column_default && String(c.column_default).includes('nextval(');

    if (isNextval) {
      const match = String(c.column_default).match(/nextval\('([^']+)'/);
      if (match) {
        schemaSQL += `CREATE SEQUENCE IF NOT EXISTS "${match[1]}";\n`;
      }
      type = (type === 'bigint') ? 'bigserial' : 'serial';
      colDefs.push(`  "${c.column_name}" ${type} NOT NULL`);
    } else {
      if (c.data_type === 'USER-DEFINED') type = c.udt_name;
      else if (c.character_maximum_length && (type === 'character varying' || type === 'varchar'))
        type = `character varying(${c.character_maximum_length})`;
      else if (c.character_maximum_length && type === 'character')
        type = `character(${c.character_maximum_length})`;

      let def = '';
      if (c.column_default) def = ` DEFAULT ${c.column_default}`;
      const nullable = c.is_nullable === 'NO' ? ' NOT NULL' : '';
      colDefs.push(`  "${c.column_name}" ${type}${nullable}${def}`);
    }
  }

  // PK
  const pks = constraints.filter(c => c.constraint_type === 'PRIMARY KEY');
  if (pks.length > 0) {
    colDefs.push(`  PRIMARY KEY (${pks[0].columns.split(',').map(c => `"${c}"`).join(', ')})`);
  }

  // UNIQUE - use column names to generate unique constraint names
  const uniques = constraints.filter(c => c.constraint_type === 'UNIQUE');
  for (const u of uniques) {
    const uqCols = u.columns.split(',');
    // Generate unique constraint name from table and columns
    const uqName = `${tn}_${uqCols.join('_')}_key`;
    colDefs.push(`  CONSTRAINT "${uqName}" UNIQUE (${uqCols.map(c => `"${c}"`).join(', ')})`);
  }

  schemaSQL += `\nCREATE TABLE IF NOT EXISTS "${tn}" (\n${colDefs.join(',\n')}\n);\n`;

  // FKs - use proper constraint name generation
  const fks = constraints.filter(c => c.constraint_type === 'FOREIGN KEY');
  for (const fk of fks) {
    const fkCols = fk.columns.split(',');
    const fkRefCols = fk.foreign_columns.split(',');
    const fkName = `${tn}_${fkCols.join('_')}_fkey`;
    schemaSQL += `ALTER TABLE "${tn}" ADD CONSTRAINT "${fkName}" FOREIGN KEY (${fkCols.map(c => `"${c}"`).join(', ')}) REFERENCES "${fk.foreign_table}" (${fkRefCols.map(c => `"${c}"`).join(', ')});\n`;
  }

  for (const idx of indexes) {
    schemaSQL += `${idx.indexdef};\n`;
  }
}

await neon.end();
writeFileSync('backups/schema-v2.sql', schemaSQL);
log('  ✓', `${tables.length} tabelas extraídas`);

// STEP 4: Apply schema
log('\n═══ STEP 4:', 'Aplicando schema ═══');

// Split by CREATE/ALTER/CREATE statements
const stmts = schemaSQL.split(/\n(?=CREATE |ALTER )/).filter(s => s.trim());
let ok = 0, err = 0;
for (const stmt of stmts) {
  try {
    await remote.unsafe(stmt.trim());
    ok++;
  } catch (e) {
    err++;
    if (err <= 5) log('  ⚠', e.message.substring(0, 150));
  }
}
log('  ✓', `${ok} OK, ${err} erros`);

// STEP 5: Restore data
log('\n═══ STEP 5:', 'Restaurando dados ═══');
const backupRaw = readFileSync(BACKUP_FILE, 'utf8');

// Fix the backup: convert "timestamp"::jsonb to 'timestamp'::timestamptz
// Pattern: '"2026-07-06T05:54:39.664Z"'::jsonb -> '2026-07-06T05:54:39.664Z'::timestamptz
let backupFixed = backupRaw.replace(/'"([^"]+)"'::jsonb/g, "'$1'::timestamptz");
// Also handle any remaining jsonb timestamp casts
backupFixed = backupFixed.replace(/'("[^"]+")'::jsonb/g, (_, ts) => {
  const cleaned = ts.replace(/"/g, '');
  return `'${cleaned}'::timestamptz`;
});

writeFileSync('backups/backup-fixed.sql', backupFixed);
log('  ', 'Backup corrigido salvo em backups/backup-fixed.sql');

// Parse statements
const lines = backupFixed.split('\n');
let currentStmt = '';
let dataStmts = [];
for (const line of lines) {
  if (line.startsWith('--') || line.trim() === '') continue;
  currentStmt += line + '\n';
  if (line.trim().endsWith(';')) {
    const trimmed = currentStmt.trim();
    if (trimmed && !trimmed.startsWith('SET ') && !trimmed.startsWith('--')) {
      dataStmts.push(trimmed);
    }
    currentStmt = '';
  }
}

// Disable all triggers first, then restore, then enable
await remote.unsafe('SET session_replication_role = replica;').catch(() => {});

let restored = 0, dataErr = 0;
for (const stmt of dataStmts) {
  try {
    await remote.unsafe(stmt);
    restored++;
    if (restored % 100 === 0) process.stdout.write(`  ... ${restored}/${dataStmts.length}\r`);
  } catch (e) {
    dataErr++;
    if (dataErr <= 10) log('  ⚠', e.message.substring(0, 150));
  }
}

await remote.unsafe('SET session_replication_role = origin;').catch(() => {});
log('  ✓', `${restored} OK, ${dataErr} erros`);

// STEP 6: Reset sequences
log('\n═══ STEP 6:', 'Resetando sequences ═══');
try {
  const seqs = await remote`SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'`;
  for (const seq of seqs) {
    const tbl = seq.sequencename.replace('_id_seq', '').replace('_seq', '');
    try {
      await remote.unsafe(`SELECT setval('${seq.sequencename}', COALESCE((SELECT MAX(id) FROM "${tbl}"), 1))`);
    } catch {}
  }
  log('  ✓', `${seqs.length} sequences`);
} catch (e) { log('  ⚠', e.message); }

// STEP 7: Verify
log('\n═══ STEP 7:', 'Verificação ═══');
const tbls = await remote`
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name
`;
log('  ', `Tabelas: ${tbls.length}`);

const checks = ['usuarios', 'solicitacoes', 'produtos_cru', 'chats', 'roles', 'user_menus', 'crm_visitas', 'pessoas', 'accounts', 'status', 'notificacoes', 'fornecedores'];
for (const t of checks) {
  try {
    const r = await remote.unsafe(`SELECT COUNT(*)::int AS cnt FROM "${t}"`);
    log('  ', `${t}: ${r[0]?.cnt} registros`);
  } catch { log('  ', `${t}: (não encontrada)`); }
}

await remote.end();
log('\n═══', 'RESTAURAÇÃO CONCLUÍDA ═══');
