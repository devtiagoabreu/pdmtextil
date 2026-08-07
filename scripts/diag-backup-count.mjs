import { readFileSync } from 'fs';

const lines = readFileSync('backups/backup-2026-07-20.sql', 'utf8').split('\n');

function countRows(header) {
  const start = lines.findIndex((l) => l.startsWith(header));
  if (start === -1) return null;
  let n = 0;
  for (let j = start + 1; j < lines.length; j++) {
    const t = lines[j].trim();
    if (t.endsWith(';')) break;
    if (t.startsWith('(')) n++;
  }
  return n;
}

for (const [tbl, header] of [
  ['solicitacoes', 'INSERT INTO "solicitacoes"'],
  ['produtos_cru', 'INSERT INTO "produtos_cru"'],
  ['produto_cru_amostra', 'INSERT INTO "produto_cru_amostra"'],
  ['anexos', 'INSERT INTO "anexos"'],
]) {
  console.log(`${tbl}: ${countRows(header)} linhas no backup`);
}
