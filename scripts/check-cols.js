require('dotenv').config({path:'.env.local'});
const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const r = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'requisicoes_corte_itens' ORDER BY ordinal_position");
  console.log('itens columns:', r.rows.map(x => x.column_name));
  await c.end();
})();
