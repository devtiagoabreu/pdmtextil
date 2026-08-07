require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Client } = require('pg');
const { readFileSync } = require('fs');

const MAIN = process.env.DATABASE_URL;

async function main() {
  const c = new Client({ connectionString: MAIN });
  await c.connect();

  const sql = readFileSync(require('path').join(__dirname, '..', 'backups', 'fix-fk-remap.sql'), 'utf8');
  const re = /UPDATE "crm_cidades" SET "estado_id" = v\.nv FROM \(VALUES\n([\s\S]*?)\n\) AS v\(id, nv\) WHERE/g;
  const pairs = [];
  let m;
  while ((m = re.exec(sql))) {
    for (const line of m[1].trim().split('\n')) {
      const mm = line.match(/\((\d+),\s*(\d+)\)/);
      if (mm) pairs.push([Number(mm[1]), Number(mm[2])]);
    }
  }
  console.log(`pares: ${pairs.length}`);

  await c.query(`DROP TABLE IF EXISTS crm_cidades_tmp`);
  await c.query(`CREATE TEMP TABLE crm_cidades_tmp AS SELECT * FROM crm_cidades`);
  await c.query(`CREATE UNIQUE INDEX ON crm_cidades_tmp (nome, estado_id)`);

  const vals = pairs.map(([id, nv]) => `(${id}, ${nv})`).join(',\n  ');
  const upd = `UPDATE crm_cidades_tmp SET estado_id = v.nv FROM (VALUES\n  ${vals}\n) AS v(id, nv) WHERE crm_cidades_tmp.id = v.id`;

  try {
    await c.query(upd);
    console.log('UPDATE na temp: OK (sem violacao)');
  } catch (e) {
    console.log('UPDATE na temp FALHOU:', e.message.split('\n')[0]);
    const dups = await c.query(`
      SELECT nome, estado_id, count(*) AS n, string_agg(id::text, ',') AS ids
      FROM crm_cidades_tmp GROUP BY nome, estado_id HAVING count(*) > 1`);
    console.log(`duplicados na temp: ${dups.rowCount}`);
    for (const r of dups.rows) {
      console.log(`  nome='${r.nome}' estado=${r.estado_id} x${r.n} ids=[${r.ids}]`);
      const before = await c.query(`SELECT id, nome, estado_id, length(nome) len, encode(nome::bytea,'hex') hex FROM crm_cidades WHERE id = ANY($1::int[])`, [r.ids.split(',').map(Number)]);
      for (const b of before.rows) console.log(`    antes: id=${b.id} nome='${b.nome}' len=${b.len} hex=${b.hex} estado=${b.estado_id}`);
    }
  }

  await c.query(`DROP TABLE IF EXISTS crm_cidades_tmp`);
  await c.end();
}
main().catch((e) => { console.error('ERRO:', e.message); process.exit(1); });
