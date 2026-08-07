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

  const cols = `id, tipo, status, cliente, cnpj, projeto, created_at, id_integracao`;

  const mainSol = await q(main, `SELECT ${cols} FROM solicitacoes ORDER BY id`);
  const neonSol = await q(neon, `SELECT ${cols} FROM solicitacoes ORDER BY id`);

  console.log('=== SOLICITAÇÕES NO PRINCIPAL ===');
  for (const r of mainSol) {
    console.log(`id=${r.id} | ${r.tipo} | ${r.status} | cliente="${r.cliente}" | projeto="${r.projeto}" | criada=${r.created_at} | integ=${r.id_integracao}`);
  }

  console.log('\n=== SOLICITAÇÕES NO NEON ===');
  for (const r of neonSol) {
    console.log(`id=${r.id} | ${r.tipo} | ${r.status} | cliente="${r.cliente}" | projeto="${r.projeto}" | criada=${r.created_at} | integ=${r.id_integracao}`);
  }

  console.log('\n=== ANEXOS NO PRINCIPAL (solicitacao_id → solicitação) ===');
  const mainAnexos = await q(main, `SELECT a.id, a.solicitacao_id, a.titulo, a.url FROM anexos a ORDER BY a.solicitacao_id, a.id`);
  const mainSolMap = new Map(mainSol.map(s => [s.id, s]));
  for (const a of mainAnexos) {
    const s = mainSolMap.get(a.solicitacao_id);
    const target = s ? `→ solicitacao id=${s.id} cliente="${s.cliente}" projeto="${s.projeto}"` : `→ ÓRFÃO (não existe id=${a.solicitacao_id})`;
    console.log(`anexo id=${a.id} solicitacao_id=${a.solicitacao_id} [${a.titulo}] ${target}`);
  }

  console.log('\n=== ANEXOS NO NEON (solicitacao_id → solicitação) ===');
  const neonAnexos = await q(neon, `SELECT a.id, a.solicitacao_id, a.titulo, a.url FROM anexos a ORDER BY a.solicitacao_id, a.id`);
  const neonSolMap = new Map(neonSol.map(s => [s.id, s]));
  for (const a of neonAnexos) {
    const s = neonSolMap.get(a.solicitacao_id);
    const target = s ? `→ solicitacao id=${s.id} cliente="${s.cliente}" projeto="${s.projeto}"` : `→ ÓRFÃO (não existe id=${a.solicitacao_id})`;
    console.log(`anexo id=${a.id} solicitacao_id=${a.solicitacao_id} [${a.titulo}] ${target}`);
  }

  await main.end();
  await neon.end();
}

main();
