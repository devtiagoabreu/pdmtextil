require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');

const MAIN = process.env.DATABASE_URL;
const NEON = process.env.DATABASE_URL_NEON;

async function main() {
  const mp = new Pool({ connectionString: MAIN, options: '-c timezone=UTC' });
  const np = new Pool({ connectionString: NEON, options: '-c timezone=UTC' });

  // mapa crm_estados old->new
  const mE = await mp.query(`SELECT id, uf FROM crm_estados ORDER BY id`);
  const nE = await np.query(`SELECT id, uf FROM crm_estados ORDER BY id`);
  const nByUf = new Map(nE.rows.map((r) => [r.uf, r.id]));
  const map = new Map();
  for (const r of nE.rows) {
    const mid = nByUf.get(r.uf);
    void mid;
  }
  for (const r of nE.rows) {
    const mm = mE.rows.find((x) => x.uf === r.uf);
    if (mm && mm.id !== r.id) map.set(String(r.id), String(mm.id));
  }
  console.log('mapa crm_estados (old->new):', [...map.entries()].join(', '));

  // crm_cidades main: aplicar remap e achar colisoes (nome, estado_id)
  const mC = (await mp.query(`SELECT id, nome, estado_id FROM crm_cidades ORDER BY id`)).rows;
  const seen = new Map(); // key "nome|novoEstado" -> [ids]
  const collisions = [];
  for (const c of mC) {
    const oldE = String(c.estado_id);
    const newE = map.get(oldE) || oldE;
    const k = `${c.nome}|${newE}`;
    if (!seen.has(k)) seen.set(k, []);
    seen.get(k).push({ id: c.id, oldE, newE });
    if (seen.get(k).length === 2) collisions.push(k);
  }
  console.log(`colisoes (nome, novo estado): ${collisions.length}`);
  for (const k of collisions) {
    const rows = seen.get(k);
    for (const r of rows) {
      const ufN = nE.rows.find((e) => String(e.id) === r.oldE)?.uf ?? '?';
      const ufM = mE.rows.find((e) => String(e.id) === r.newE)?.uf ?? '?';
      console.log(`  ${k}: cidade id=${r.id} oldE=${r.oldE}(${ufN}) -> newE=${r.newE}(${ufM})`);
    }
  }

  // as mesmas cidades em neon (estado original)
  const nC = (await np.query(`SELECT id, nome, estado_id FROM crm_cidades ORDER BY id`)).rows;
  const mById = new Map(mC.map((c) => [String(c.id), c]));
  for (const k of collisions) {
    for (const r of seen.get(k)) {
      const sameInNeon = nC.filter((x) => x.nome === r.nome);
      console.log(`  neon: nome='${r.nome}' -> ${sameInNeon.map((x) => `id=${x.id} estado=${x.estado_id}`).join(', ')}`);
    }
  }

  await np.end();
  await mp.end();
}
main();
