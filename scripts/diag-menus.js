require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');

const MAIN = process.env.DATABASE_URL;
const NEON = process.env.DATABASE_URL_NEON;

async function main() {
  const mp = new Pool({ connectionString: MAIN });
  const np = new Pool({ connectionString: NEON });
  const m = await mp.query(`SELECT id, usuario_id, role, titulo, icone, ordem FROM user_menus ORDER BY id`);
  const n = await np.query(`SELECT id, usuario_id, role, titulo, icone, ordem FROM user_menus ORDER BY id`);
  console.log(`main=${m.rows.length} neon=${n.rows.length}`);
  console.log('--- MAIN (id | usuario_id | role | titulo | icone | ordem) ---');
  for (const r of m.rows) console.log(`${r.id} | ${r.usuario_id ?? '∅'} | ${r.role ?? '∅'} | ${r.titulo} | ${r.icone ?? '∅'} | ${r.ordem}`);
  console.log('--- NEON ---');
  for (const r of n.rows) console.log(`${r.id} | ${r.usuario_id ?? '∅'} | ${r.role ?? '∅'} | ${r.titulo} | ${r.icone ?? '∅'} | ${r.ordem}`);
  await np.end();
  await mp.end();
}
main();
