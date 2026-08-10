require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');

const p = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const r = await p.query(`
    SELECT umi.id, umi.titulo, umi.url, umi.ordem
    FROM user_menu_itens umi
    JOIN user_menus um ON um.id = umi.user_menu_id
    WHERE um.role = 'CRM' AND um.titulo = 'CRM'
    ORDER BY umi.ordem
  `);
  console.log('--- ROLE CRM menu CRM items ---');
  r.rows.forEach((x) => console.log(`${x.id} | ${x.ordem} | ${x.titulo} | ${x.url}`));

  const dups = await p.query(`
    SELECT umi.user_menu_id, um.titulo, um.usuario_id, umi.titulo, umi.url, count(*)::int qtd,
           min(umi.id)::int primeiro, max(umi.id)::int ultimo
    FROM user_menu_itens umi
    JOIN user_menus um ON um.id = umi.user_menu_id
    GROUP BY umi.user_menu_id, um.titulo, um.usuario_id, umi.titulo, umi.url
    HAVING count(*) > 1
    ORDER BY um.usuario_id, um.titulo, umi.url
    LIMIT 30
  `);
  console.log('\n--- DUPLICATAS (menu, usuario, item, url, qtd, id-min, id-max) ---');
  dups.rows.forEach((x) =>
    console.log(`menu#${x.user_menu_id} ${x.titulo} (user ${x.usuario_id}) | ${x.titulo} | ${x.url} | x${x.qtd} | ids ${x.primeiro}..${x.ultimo}`)
  );

  await p.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
