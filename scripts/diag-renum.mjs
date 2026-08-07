import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });
const { Pool } = pg;

// chave natural por tabela-pai (colunas usadas para casar neon x main)
const KEYS = {
  fios: ['codigo_completo'],
  usuarios: ['email'],
  fornecedores: ['cnpj'],
  bases_urdume: ['codigo_completo'],
  clientes: ['cnpj'],
  representantes: ['cnpj'],
  email_listas: ['nome'],
  crm_equipes: ['nome'],
  crm_estados: ['uf'],
  produtos_cru: ['codigo_pdm'],
  crm_pessoas: ['cnpj'],
  requisicoes_corte: ['status', 'created_at'],
};

async function q(pool, text) {
  return (await pool.query(text)).rows;
}

async function main() {
  const main = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 20000 });
  const neon = new Pool({ connectionString: process.env.DATABASE_URL_NEON, connectionTimeoutMillis: 20000 });

  for (const [t, keys] of Object.entries(KEYS)) {
    const cols = [...keys, 'id'].join(', ');
    const mRows = await q(main, `SELECT ${cols} FROM "${t}" ORDER BY id`);
    const nRows = await q(neon, `SELECT ${cols} FROM "${t}" ORDER BY id`);
    const keyOf = (r) => keys.map((k) => String(r[k] ?? '∅')).join('|');

    const nMap = new Map(nRows.map((r) => [keyOf(r), r]));
    const mByKey = new Map(mRows.map((r) => [keyOf(r), r]));

    const renum = [];
    const same = [];
    const newOnly = [];
    const neonOnly = [];

    for (const m of mRows) {
      const n = nMap.get(keyOf(m));
      if (!n) { newOnly.push(m); continue; }
      if (n.id === m.id) same.push(m);
      else renum.push({ key: keyOf(m), from: n.id, to: m.id });
    }
    for (const n of nRows) {
      if (!mByKey.has(keyOf(n))) neonOnly.push(n);
    }

    const dupsInMain = mRows.length - new Map(mRows.map((r) => [keyOf(r), 1])).size;
    const dupsInNeon = nRows.length - new Map(nRows.map((r) => [keyOf(r), 1])).size;

    console.log(`\n=== ${t} (main ${mRows.length}, neon ${nRows.length}) ===`);
    if (dupsInMain) console.log(`  ⚠ ${dupsInMain} chaves duplicadas no main`);
    if (dupsInNeon) console.log(`  ⚠ ${dupsInNeon} chaves duplicadas no neon`);
    console.log(`  renum (id antigo -> id novo): ${renum.length}`);
    for (const r of renum.slice(0, 40)) console.log(`    ${r.key}: ${r.from} -> ${r.to}`);
    console.log(`  id preservado: ${same.length}`);
    console.log(`  só no main (novo): ${newOnly.length}`);
    for (const r of newOnly.slice(0, 10)) console.log(`    id=${r.id} key=${keyOf(r)}`);
    console.log(`  só no neon: ${neonOnly.length}`);
    for (const r of neonOnly.slice(0, 10)) console.log(`    id=${r.id} key=${keyOf(r)}`);
  }

  await main.end();
  await neon.end();
}

main();
