import { readFileSync } from 'fs';

const lines = readFileSync('backups/backup-2026-07-20.sql', 'utf8').split('\n');

function extract(header) {
  const start = lines.findIndex((l) => l.startsWith(header));
  if (start === -1) return null;
  const rows = [];
  for (let j = start + 1; j < lines.length; j++) {
    const t = lines[j].trim();
    if (!t) continue;
    if (t.endsWith(';')) {
      rows.push(t.slice(0, -1));
      break;
    }
    rows.push(t.endsWith(',') ? t.slice(0, -1) : t);
  }
  return rows;
}

const amostras = extract('INSERT INTO "produto_cru_amostra"');
console.log('Amostras no backup:');
for (const r of amostras) console.log('  ' + r.slice(0, 160));

const cortes = extract('INSERT INTO "requisicoes_corte"');
console.log('\nRequisicoes corte no backup:');
for (const r of cortes) console.log('  ' + r.slice(0, 160));

const itens = extract('INSERT INTO "requisicoes_corte_itens"');
console.log(`\nRequisicoes_corte_itens no backup: ${itens.length} linhas`);
for (const r of itens.slice(0, 6)) console.log('  ' + r.slice(0, 160));

const cidades = extract('INSERT INTO "crm_cidades"');
console.log(`\ncrm_cidades no backup: ${cidades.length} linhas`);
console.log('  primeira: ' + cidades[0].slice(0, 120));

const timeline = extract('INSERT INTO "crm_timeline_eventos"');
console.log(`\ncrm_timeline_eventos no backup: ${timeline.length} linhas`);

const itens2 = extract('INSERT INTO "requisicoes_corte_itens"');
const solIds = new Set(itens2.map((r) => r.slice(1, r.indexOf(',')).trim()));
console.log('requisicao_corte_ids referenciados no backup:', [...solIds].join(', '));
