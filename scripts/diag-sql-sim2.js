require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');
const { readFileSync } = require('fs');

const MAIN = process.env.DATABASE_URL;

async function main() {
  const mp = new Pool({ connectionString: MAIN });

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

  const idx = (await mp.query(`SELECT indexdef FROM pg_indexes WHERE indexname='crm_cidades_nome_estado_id_key'`)).rows[0];
  console.log('índice:', idx && idx.indexdef);

  const vals = pairs.map(([id, nv]) => `(${id}, ${nv})`).join(',\n  ');
  const q = `
    WITH newv(id, nv) AS (VALUES
      ${vals}
    ),
    newstate AS (
      SELECT c.id, c.nome, c.estado_id AS old_e, COALESCE(v.nv, c.estado_id) AS es
      FROM crm_cidades c LEFT JOIN newv v ON v.id = c.id
    )
    SELECT nome, es, count(*) AS n, string_agg(id::text, ',') AS ids, string_agg(old_e::text, ',') AS olds
    FROM newstate GROUP BY nome, es HAVING count(*) > 1
    ORDER BY 3 DESC`;
  const res = await mp.query(q);
  console.log(`colisoes (colacao do banco): ${res.rowCount}`);
  for (const r of res.rows) {
    console.log(`  nome='${r.nome}' estado=${r.es} x${r.n} ids=[${r.ids}] olds=[${r.olds}]`);
    for (const id of r.ids.split(',')) {
      const raw = (await mp.query(`SELECT id, nome, estado_id, length(nome) AS len, encode(nome::bytea,'hex') AS hex FROM crm_cidades WHERE id=$1`, [id])).rows[0];
      console.log(`    id=${raw.id} nome='${raw.nome}' len=${raw.len} hex=${raw.hex} estado=${raw.estado_id}`);
    }
  }

  await mp.end();
}
main();
