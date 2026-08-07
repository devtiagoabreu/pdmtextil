require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');
const fs = require('fs');

const MAIN = process.env.DATABASE_URL;

async function main() {
  // 1) tabelas com INSERT no backup (restauradas)
  const backup = fs.readFileSync('backups/backup-2026-07-20.sql', 'utf8');
  const restored = [...new Set(
    [...backup.matchAll(/INSERT INTO "([a-z_0-9]+)"/g)].map((m) => m[1])
  )].sort();
  console.log('=== TABELAS NO BACKUP ===');
  console.log(restored.join(', '));

  // 2) FKs no banco principal (todas)
  const p = new Pool({ connectionString: MAIN });
  const fkRes = await p.query(`SELECT tc.table_name AS child, kcu.column_name AS col, ccu.table_name AS parent
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public' ORDER BY child, col`);
  console.log('\n=== FKs NO BANCO (child.col -> parent) ===');
  for (const r of fkRes.rows) console.log(`  ${r.child}.${r.col} -> ${r.parent}`);

  // 3) para cada tabela restaurada, contagem de linhas no principal
  console.log('\n=== LINHAS NO PRINCIPAL (tabelas do backup) ===');
  const p2 = new Pool({ connectionString: MAIN });
  for (const t of restored) {
    try {
      const r = await p2.query(`SELECT count(*)::int AS c FROM "${t}"`);
      console.log(`  ${t}: ${r.rows[0].c}`);
    } catch (e) {
      console.log(`  ${t}: ERRO ${e.message.slice(0, 60)}`);
    }
  }
  await p2.end();
  await p.end();
}

main();
