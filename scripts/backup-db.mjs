import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

const tables = await sql`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  ORDER BY table_name
`;

console.log(`Found ${tables.length} tables`);

let dump = `-- Backup do banco de dados PDM Textil\n`;
dump += `-- Data: ${new Date().toISOString()}\n`;
dump += `-- Tabelas: ${tables.length}\n`;
dump += `-- Restaurar com: psql -U usuario -d banco -f backup.sql\n\n`;
dump += `SET client_encoding = 'UTF8';\n`;
dump += `SET standard_conforming_strings = on;\n\n`;

let totalRows = 0;

function escapeVal(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  if (val instanceof Date) return `'${val.toISOString()}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

for (const t of tables) {
  const tableName = t.table_name;
  console.log(`  Dumping: ${tableName}...`);
  
  const columns = await sql`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tableName}
    ORDER BY ordinal_position
  `;

  const dataCols = columns.filter(c => !c.column_default || !String(c.column_default).startsWith('nextval'));
  
  const countRes = await sql.query(`SELECT COUNT(*)::int AS cnt FROM "${tableName}"`, []);
  const count = Array.isArray(countRes) ? countRes[0]?.cnt ?? 0 : 0;

  if (count === 0) {
    dump += `-- ${tableName}: (vazia)\n\n`;
    console.log(`    -> 0 rows`);
    continue;
  }

  const colSelect = dataCols.map(c => `"${c.column_name}"`).join(', ');
  const result = await sql.query(`SELECT ${colSelect} FROM "${tableName}" ORDER BY 1`, []);
  const rows = Array.isArray(result) ? result : [];
  
  const colNames = dataCols.map(c => `"${c.column_name}"`).join(', ');
  const allValues = [];
  
  for (const row of rows) {
    const vals = dataCols.map(c => escapeVal(row[c.column_name]));
    allValues.push(`(${vals.join(', ')})`);
  }

  dump += `TRUNCATE TABLE "${tableName}" CASCADE;\n`;
  dump += `ALTER TABLE "${tableName}" DISABLE TRIGGER ALL;\n`;
  
  for (let i = 0; i < allValues.length; i += 100) {
    const chunk = allValues.slice(i, i + 100);
    dump += `INSERT INTO "${tableName}" (${colNames}) VALUES\n`;
    dump += chunk.join(',\n') + ';\n';
  }
  
  dump += `ALTER TABLE "${tableName}" ENABLE TRIGGER ALL;\n\n`;
  totalRows += allValues.length;
  console.log(`    -> ${allValues.length} rows`);
}

dump += `\n-- Total: ${tables.length} tabelas, ${totalRows} registros\n`;

if (!existsSync('backups')) mkdirSync('backups');
const filePath = `backups/backup-${new Date().toISOString().split('T')[0]}.sql`;
writeFileSync(filePath, dump, 'utf8');
console.log(`\nBackup salvo: ${filePath}`);
console.log(`Total: ${tables.length} tabelas, ${totalRows} registros`);
