require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');
const db = process.argv[2];
const conn = process.env[db];
const sql = `SELECT conrelid::regclass::text AS child, a.attname AS col, confrelid::regclass::text AS parent FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=ANY(c.conkey) WHERE c.contype='f' AND conrelid::regclass::text IN ('anexos','produtos_cru','produto_cru_amostra','produto_cru_composicao','produto_cru_estrutura','fios_fornecedores','crm_timeline_eventos','clientes_representantes','requisicoes_corte','requisicoes_corte_itens') ORDER BY 1,2`;
(async () => {
  const p = new Pool({ connectionString: conn });
  const r = await p.query(sql);
  console.log(db);
  for (const row of r.rows) console.log(`  ${row.child}.${row.col} -> ${row.parent}`);
  await p.end();
})();
