require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');

(async () => {
  const p = new Pool({ connectionString: process.env.DATABASE_URL });
  const q = await p.query(`SELECT tc.table_name AS filha, kcu.column_name AS col,
      ccu.table_name AS pai, ccu.column_name AS pcol
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
      AND ccu.table_name <> tc.table_name
    ORDER BY 1, 2`);
  let total = 0;
  const bad = [];
  for (const f of q.rows) {
    const r = await p.query(
      `SELECT count(*)::int AS c FROM "${f.filha}" f
       WHERE f."${f.col}" IS NOT NULL AND NOT EXISTS
         (SELECT 1 FROM "${f.pai}" p WHERE p."${f.pcol}" = f."${f.col}")`);
    if (r.rows[0].c > 0) { total += r.rows[0].c; bad.push(`${f.filha}.${f.col} = ${r.rows[0].c}`); }
  }
  console.log('FKs verificadas:', q.rows.length);
  console.log('órfãos totais:', total);
  console.log(bad.length ? 'residuais: ' + bad.join('; ') : 'nenhum órfão restante');
  await p.end();
})();
