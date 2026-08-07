const { readFileSync } = require('fs');

const sql = readFileSync('backups/fix-fk-remap.sql', 'utf8');
const re = /UPDATE "(\w+)" SET "\w+" = v\.nv FROM \(VALUES\n([\s\S]*?)\n\) AS v\(id, nv\) WHERE/g;
let m;
let total = 0;
while ((m = re.exec(sql))) {
  const [table, block] = [m[1], m[2]];
  const pairs = [];
  for (const line of block.trim().split('\n')) {
    const mm = line.match(/\((\d+),\s*(\d+)\)/);
    if (mm) pairs.push([Number(mm[1]), Number(mm[2])]);
  }
  const byId = new Map();
  const dups = [];
  for (const [id, nv] of pairs) {
    if (byId.has(id) && byId.get(id) !== nv) dups.push({ id, old: byId.get(id), new: nv });
    byId.set(id, nv);
  }
  const idDups = pairs.length - byId.size;
  total += pairs.length;
  if (dups.length || idDups) {
    console.log(`${table}: ${pairs.length} pares, ${idDups} ids duplicados, ${dups.length} conflitos de valor: ${JSON.stringify(dups.slice(0, 10))}`);
  }
}
console.log(`total de pares: ${total}`);
