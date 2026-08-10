require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');

const p = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log('=== USERS COM MENUS DUPLICADOS (mesmo titulo) ===');
  const dupMenus = await p.query(`
    SELECT u.id, u.name, um.titulo, count(*)::int qtd,
           string_agg(um.id::text, ',' ORDER BY um.id) ids
    FROM user_menus um
    JOIN usuarios u ON u.id = um.usuario_id
    WHERE um.usuario_id IS NOT NULL
    GROUP BY u.id, u.name, um.titulo
    HAVING count(*) > 1
    ORDER BY u.id, um.titulo
  `);
  for (const r of dupMenus.rows) {
    console.log(`  #${r.id} ${r.name} -> menu "${r.titulo}" x${r.qtd} (ids: ${r.ids})`);
  }
  if (dupMenus.rows.length === 0) console.log('  (nenhum)');

  console.log('\n=== ITENS DUPLICADOS (mesmo menu + mesma url) ===');
  const dupItens = await p.query(`
    SELECT um.usuario_id, um.titulo menu_titulo, umi.user_menu_id, umi.url, count(*)::int qtd,
           string_agg(umi.id::text, ',' ORDER BY umi.id) ids
    FROM user_menu_itens umi
    JOIN user_menus um ON um.id = umi.user_menu_id
    WHERE um.usuario_id IS NOT NULL
    GROUP BY um.usuario_id, um.titulo, umi.user_menu_id, umi.url
    HAVING count(*) > 1
    ORDER BY um.usuario_id, um.titulo, umi.url
  `);
  for (const r of dupItens.rows) {
    console.log(`  #${r.usuario_id} menu "${r.menu_titulo}"(id ${r.user_menu_id}) url "${r.url}" x${r.qtd} (ids: ${r.ids})`);
  }
  if (dupItens.rows.length === 0) console.log('  (nenhum)');

  console.log('\n=== TOTAL: menus por usuario (qtd > titulos distintos) ===');
  const totals = await p.query(`
    SELECT u.id, u.name, count(*)::int total_menus,
           count(DISTINCT um.titulo)::int titulos_distintos
    FROM user_menus um
    JOIN usuarios u ON u.id = um.usuario_id
    WHERE um.usuario_id IS NOT NULL
    GROUP BY u.id, u.name
    HAVING count(*) > count(DISTINCT um.titulo)
    ORDER BY (count(*) - count(DISTINCT um.titulo)) DESC
  `);
  for (const r of totals.rows) {
    console.log(`  #${r.id} ${r.name}: ${r.total_menus} menus / ${r.titulos_distintos} titulos distintos`);
  }
  if (totals.rows.length === 0) console.log('  (nenhum)');

  await p.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
