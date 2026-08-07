require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');

const MAIN = process.env.DATABASE_URL;
const NEON = process.env.DATABASE_URL_NEON;

const QUERIES = {
  anexos: `SELECT id, solicitacao_id, tipo, titulo, url, criado_por FROM anexos ORDER BY id`,
  produtos_cru: `SELECT id, codigo_pdm, descricao, solicitacao_desenvolvimento_id, status, criado_por FROM produtos_cru ORDER BY id`,
  produto_cru_amostra: `SELECT id, produto_cru_id, descricao, status FROM produto_cru_amostra ORDER BY id`,
  produto_cru_composicao: `SELECT id, produto_cru_id, material, percentual FROM produto_cru_composicao ORDER BY id`,
  produto_cru_estrutura: `SELECT id, produto_cru_id, tipo, fio_id, base_urdume_id, ordem FROM produto_cru_estrutura ORDER BY id`,
  produto_cru_acabamento: `SELECT id, produto_cru_id, tipo_acabamento FROM produto_cru_acabamento ORDER BY id`,
  produto_cru_acabamento_amostra: `SELECT id, acabamento_id, descricao FROM produto_cru_acabamento_amostra ORDER BY id`,
  produto_cru_acabamento_receita: `SELECT id, acabamento_id, tipo_receita FROM produto_cru_acabamento_receita ORDER BY id`,
};

async function dump(pool, label) {
  const out = {};
  for (const [name, sql] of Object.entries(QUERIES)) {
    try {
      const r = await pool.query(sql);
      out[name] = r.rows;
    } catch (e) {
      out[name] = { error: e.message };
    }
  }
  console.log(`\n========== ${label} ==========`);
  for (const [name, rows] of Object.entries(out)) {
    console.log(`\n-- ${name} (${Array.isArray(rows) ? rows.length : '?'})`);
    if (!Array.isArray(rows)) { console.log('   ERROR', rows.error); continue; }
    for (const r of rows) console.log(`   ${JSON.stringify(r)}`);
  }
}

(async () => {
  const mp = new Pool({ connectionString: MAIN });
  const np = new Pool({ connectionString: NEON });
  await dump(np, 'NEON (origem íntegra)');
  await dump(mp, 'PRINCIPAL (pdm_textil)');
  await np.end();
  await mp.end();
})();
