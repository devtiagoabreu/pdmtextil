import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });
const { Pool } = pg;

async function q(pool, text) {
  const r = await pool.query(text);
  return r.rows;
}

async function main() {
  const main = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 20000 });
  const neon = new Pool({ connectionString: process.env.DATABASE_URL_NEON, connectionTimeoutMillis: 20000 });

  console.log('=== PRODUTOS_CRU PRINCIPAL ===');
  const mp = await q(main, `SELECT id, codigo_pdm, descricao, solicitacao_desenvolvimento_id, status, criado_por, created_at FROM produtos_cru ORDER BY id`);
  const mSol = new Map((await q(main, `SELECT id, cliente, projeto FROM solicitacoes`)).map((s) => [s.id, s]));
  for (const p of mp) {
    const s = mSol.get(p.solicitacao_desenvolvimento_id);
    console.log(`id=${p.id} | ${p.codigo_pdm} | "${p.descricao}" | solId=${p.solicitacao_desenvolvimento_id}${s ? ` (${s.cliente}/${s.projeto})` : ' ← ÓRFÃO'} | criado_por=${p.criado_por} | ${p.created_at}`);
  }

  console.log('\n=== PRODUTOS_CRU NEON ===');
  const np = await q(neon, `SELECT id, codigo_pdm, descricao, solicitacao_desenvolvimento_id, status, criado_por, created_at FROM produtos_cru ORDER BY id`);
  const nSol = new Map((await q(neon, `SELECT id, cliente, projeto FROM solicitacoes`)).map((s) => [s.id, s]));
  for (const p of np) {
    const s = nSol.get(p.solicitacao_desenvolvimento_id);
    console.log(`id=${p.id} | ${p.codigo_pdm} | "${p.descricao}" | solId=${p.solicitacao_desenvolvimento_id}${s ? ` (${s.cliente}/${s.projeto})` : ' ← ÓRFÃO'} | criado_por=${p.criado_por} | ${p.created_at}`);
  }

  console.log('\n=== AMOSTRAS PRINCIPAL ===');
  const ma = await q(main, `SELECT id, produto_cru_id, descricao, status, created_at FROM produto_cru_amostra ORDER BY id`);
  const mProd = new Map((await q(main, `SELECT id, codigo_pdm, descricao FROM produtos_cru`)).map((p) => [p.id, p]));
  for (const a of ma) {
    const p = mProd.get(a.produto_cru_id);
    console.log(`amostra id=${a.id} | produto_cru_id=${a.produto_cru_id}${p ? ` (${p.codigo_pdm} "${p.descricao}")` : ' ← ÓRFÃO'} | "${a.descricao}"`);
  }

  console.log('\n=== AMOSTRAS NEON ===');
  const na = await q(neon, `SELECT id, produto_cru_id, descricao, status, created_at FROM produto_cru_amostra ORDER BY id`);
  const nProd = new Map((await q(neon, `SELECT id, codigo_pdm, descricao FROM produtos_cru`)).map((p) => [p.id, p]));
  for (const a of na) {
    const p = nProd.get(a.produto_cru_id);
    console.log(`amostra id=${a.id} | produto_cru_id=${a.produto_cru_id}${p ? ` (${p.codigo_pdm} "${p.descricao}")` : ' ← ÓRFÃO'} | "${a.descricao}"`);
  }

  console.log('\n=== colunas "links" ===');
  const linksCols = await q(main, `
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema='public' AND column_name='links' ORDER BY table_name`);
  for (const c of linksCols) console.log(`  ${c.table_name}.${c.column_name}`);

  await main.end();
  await neon.end();
}

main();
