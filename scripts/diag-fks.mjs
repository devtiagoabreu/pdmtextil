import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });
const { Pool } = pg;

async function main() {
  const main = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 20000 });
  const r = await main.query(`
    SELECT tc.table_name AS child, kcu.column_name AS col, ccu.table_name AS parent
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY parent, child, col
  `);

  const byParent = new Map();
  for (const f of r.rows) {
    if (!byParent.has(f.parent)) byParent.set(f.parent, []);
    byParent.get(f.parent).push(`${f.child}.${f.col}`);
  }

  for (const [parent, fks] of byParent) {
    const cnt = (await main.query(`SELECT COUNT(*)::int AS c FROM "${parent}"`)).rows[0].c;
    console.log(`\n=== refs para "${parent}" (${cnt} linhas) ===`);
    for (const fk of fks) {
      const [child, col] = fk.split('.');
      const cntRes = await main.query(`SELECT COUNT(*)::int AS c FROM "${child}" WHERE "${col}" IS NOT NULL`).catch(() => null);
      const orph = cntRes
        ? (await main.query(`SELECT COUNT(*)::int AS c FROM "${child}" x LEFT JOIN "${parent}" p ON p.id = x."${col}" WHERE x."${col}" IS NOT NULL AND p.id IS NULL`).catch(() => null))
        : null;
      if (cntRes) console.log(`  ${child}.${col}: ${cntRes.rows[0].c} não-nulos, ${orph ? orph.rows[0].c : '?'} órfãos`);
      else console.log(`  ${child}.${col}: (não existe)`);
    }
  }
  await main.end();
}

main();
