require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');
const { readFileSync } = require('fs');

const MAIN = process.env.DATABASE_URL;

async function main() {
  const mp = new Pool({ connectionString: MAIN });

  const sql = readFileSync(require('path').join(__dirname, '..', 'backups', 'fix-fk-remap.sql'), 'utf8');

  // extrair blocos UPDATE "crm_cidades" SET "estado_id" = v.nv FROM (VALUES ... ) AS v(id, nv)
  const re = /UPDATE "crm_cidades" SET "estado_id" = v\.nv FROM \(VALUES\n([\s\S]*?)\n\) AS v\(id, nv\) WHERE/g;
  const pairs = [];
  let m;
  while ((m = re.exec(sql))) {
    for (const line of m[1].trim().split('\n')) {
      const mm = line.match(/\((\d+),\s*(\d+)\)/);
      if (mm) pairs.push([Number(mm[1]), Number(mm[2])]);
    }
  }
  console.log(`pares crm_cidades no SQL: ${pairs.length}`);

  const cities = (await mp.query(`SELECT id, nome, estado_id FROM crm_cidades ORDER BY id`)).rows;
  const byId = new Map(cities.map((c) => [c.id, c]));
  const notFound = pairs.filter(([id]) => !byId.has(id));
  console.log(`ids do SQL inexistentes no banco: ${notFound.length}`);
  if (notFound.length) console.log(notFound.map(([id]) => id).join(', '));

  const seen = new Map();
  const collisions = [];
  for (const c of cities) {
    const p = byId.get(c.id) ? pairs.find(([id]) => id === c.id) : null;
    const newE = p ? p[1] : c.estado_id;
    const k = `${c.nome}|${newE}`;
    if (!seen.has(k)) seen.set(k, []);
    seen.get(k).push({ id: c.id, old: c.estado_id, newE });
    if (seen.get(k).length === 2) collisions.push(k);
  }
  console.log(`colisoes pos-SQL: ${collisions.length}`);
  for (const k of collisions) {
    for (const r of seen.get(k)) {
      console.log(`  ${k}: id=${r.id} estado ${r.old} -> ${r.newE}${pairs.some(([id]) => id === r.id) ? ' [remapeada]' : ' [nao remapeada]'}`);
    }
  }

  await mp.end();
}
main();
