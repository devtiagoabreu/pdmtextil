import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });
const { Pool } = pg;

const PARENTS = [
  'solicitacoes', 'produtos_cru', 'usuarios', 'fios', 'fornecedores', 'bases_urdume',
  'requisicoes_corte', 'crm_estados', 'crm_pessoas', 'clientes', 'crm_equipes',
  'representantes', 'crm_visitas', 'email_listas', 'crm_contatos', 'crm_leads', 'crm_oportunidades',
];

async function main() {
  const main = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 20000 });
  const neon = new Pool({ connectionString: process.env.DATABASE_URL_NEON, connectionTimeoutMillis: 20000 });

  for (const t of PARENTS) {
    console.log(`\n=== ${t} ===`);
    for (const [label, pool] of [['main', main], ['neon', neon]]) {
      try {
        const cols = await pool.query(`
          SELECT column_name FROM information_schema.columns
          WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [t]);
        const cnt = (await pool.query(`SELECT COUNT(*)::int c FROM "${t}"`)).rows[0].c;
        console.log(`  ${label}: ${cnt} rows | ${cols.rows.map((c) => c.column_name).join(', ')}`);
      } catch (e) {
        console.log(`  ${label}: erro (${e.message.split('\n')[0]})`);
      }
    }
  }
  await main.end();
  await neon.end();
}

main();
