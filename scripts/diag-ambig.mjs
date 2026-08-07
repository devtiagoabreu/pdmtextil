import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });
const { Pool } = pg;

const TS_TYPES = new Set([
  'timestamp without time zone', 'timestamp with time zone', 'date',
  'time without time zone', 'time with time zone',
]);

async function q(pool, text, params) {
  return (await pool.query(text, params)).rows;
}

async function debug(child, col) {
  const main = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 20000 });
  const neon = new Pool({ connectionString: process.env.DATABASE_URL_NEON, connectionTimeoutMillis: 20000 });

  const cols = await q(main, `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [child]);
  const keyCols = cols.filter((c) => c.column_name !== 'id' && !TS_TYPES.has(c.data_type) && c.data_type !== 'jsonb' && c.data_type !== 'ARRAY');
  const keySel = keyCols.map((c) => c.column_name).join(', ');
  console.log(`\n[${child}.${col}] keyCols (${keyCols.length}): ${keySel}`);

  const mRows = await q(main, `SELECT id, ${col}, ${keySel} FROM "${child}" WHERE "${col}" IS NOT NULL ORDER BY id LIMIT 5`);
  const nRows = await q(neon, `SELECT id, ${col}, ${keySel} FROM "${child}" WHERE "${col}" IS NOT NULL ORDER BY id LIMIT 5`);
  const keyOf = (r) => keyCols.map((c) => String(r[c] ?? '∅')).join('|');
  console.log('  main sample keys:');
  for (const r of mRows) console.log(`    id=${r.id}: ${keyOf(r).slice(0, 120)}`);
  console.log('  neon sample keys:');
  for (const r of nRows) console.log(`    id=${r.id}: ${keyOf(r).slice(0, 120)}`);

  const nAll = await q(neon, `SELECT id, ${col}, ${keySel} FROM "${child}" WHERE "${col}" IS NOT NULL`);
  const counts = new Map();
  for (const r of nAll) {
    const k = keyOf(r);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const dups = [...counts.entries()].filter(([, c]) => c > 1);
  console.log(`  neon total=${nAll.length}, chaves duplicadas=${dups.length}`);
  for (const [k, c] of dups.slice(0, 5)) console.log(`    x${c}: ${k.slice(0, 120)}`);

  await main.end();
  await neon.end();
}

await debug('crm_cidades', 'estado_id');
await debug('fios', 'criado_por');
await debug('requisicoes_corte_itens', 'requisicao_corte_id');
