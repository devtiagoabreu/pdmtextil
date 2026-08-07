import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });
const { Pool } = pg;

async function main() {
  const main = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 20000 });
  const neon = new Pool({ connectionString: process.env.DATABASE_URL_NEON, connectionTimeoutMillis: 20000 });

  console.log('=== conteudo de colunas "links" ===');
  for (const t of ['produtos_cru', 'fios', 'produto_cru_amostra', 'produto_cru_acabamento_amostra']) {
    const r = await main.query(`SELECT links FROM "${t}" WHERE links IS NOT NULL AND jsonb_array_length(links) > 0 LIMIT 3`).catch(() => ({ rows: [] }));
    for (const row of r.rows) console.log(`  ${t}: ${JSON.stringify(row.links).slice(0, 350)}`);
  }

  console.log('\n=== requisicoes_corte_itens schema ===');
  const cols = await main.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='requisicoes_corte_itens' ORDER BY ordinal_position`);
  console.log('  ' + cols.rows.map((c) => c.column_name).join(', '));

  console.log('\n=== crm_timeline_eventos MAIN ===');
  const tl = await main.query(`SELECT id, empresa_id, tipo, titulo, created_at FROM crm_timeline_eventos ORDER BY id`);
  for (const r of tl.rows) console.log(`  id=${r.id} empresa_id=${r.empresa_id} tipo=${r.tipo} titulo="${r.titulo}" criado=${r.created_at}`);

  console.log('\n=== crm_timeline_eventos NEON ===');
  const tl2 = await neon.query(`SELECT id, empresa_id, tipo, titulo, created_at FROM crm_timeline_eventos ORDER BY id`);
  for (const r of tl2.rows) console.log(`  id=${r.id} empresa_id=${r.empresa_id} tipo=${r.tipo} titulo="${r.titulo}" criado=${r.created_at}`);

  console.log('\n=== requisicoes_corte_itens counts ===');
  for (const [label, pool] of [['main', main], ['neon', neon]]) {
    const c = await pool.query(`SELECT COUNT(*)::int c FROM requisicoes_corte_itens`);
    console.log(`  ${label}: ${c.rows[0].c}`);
  }

  await main.end();
  await neon.end();
}

main();
