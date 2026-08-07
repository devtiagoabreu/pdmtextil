require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');
const { readFileSync } = require('fs');

const MAIN = process.env.DATABASE_URL;

async function main() {
  const p = new Pool({ connectionString: MAIN });
  const rows = (await p.query(`SELECT * FROM user_email_config ORDER BY id`)).rows;
  console.log('user_email_config (main):', rows.length);
  for (const r of rows) console.log(' ', JSON.stringify(r));

  const sql = readFileSync(require('path').join(__dirname, '..', 'backups', 'fix-fk-remap.sql'), 'utf8');
  const re = /UPDATE "user_email_config" SET "usuario_id" = v\.nv FROM \(VALUES\n([\s\S]*?)\n\) AS v\(id, nv\) WHERE/g;
  const pairs = [];
  let m;
  while ((m = re.exec(sql))) {
    for (const line of m[1].trim().split('\n')) {
      const mm = line.match(/\((\d+),\s*(\d+)\)/);
      if (mm) pairs.push([Number(mm[1]), Number(mm[2])]);
    }
  }
  console.log('pares SQL user_email_config:', JSON.stringify(pairs));

  // quem é cada usuario
  const us = (await p.query(`SELECT id, email, name FROM usuarios ORDER BY id`)).rows;
  for (const r of rows) {
    const u = us.find((x) => x.id === r.usuario_id);
    console.log(`  config id=${r.id} usuario_id=${r.usuario_id} (${u ? u.email : '??'})`);
  }
  for (const [id, nv] of pairs) {
    const u = us.find((x) => x.id === nv);
    console.log(`  update id=${id} -> usuario ${nv} (${u ? u.email : '??'})`);
  }
  await p.end();
}
main();
