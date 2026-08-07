require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');

const CHECKS = [
  ['chat_participantes', 'ultima_mensagem_lida_id', 'chat_mensagens'],
  ['chat_leituras', 'mensagem_id', 'chat_mensagens'],
  ['user_menu_itens', 'user_menu_id', 'user_menus'],
];

async function main() {
  const p = new Pool({ connectionString: process.env.DATABASE_URL });
  for (const [child, col, parent] of CHECKS) {
    const r = await p.query(
      `SELECT ch.id, ch."${col}" AS val
       FROM "${child}" ch LEFT JOIN "${parent}" pa ON pa.id = ch."${col}"
       WHERE ch."${col}" IS NOT NULL AND pa.id IS NULL ORDER BY ch.id`
    );
    console.log(`\n${child}.${col} -> ${parent}: ${r.rowCount} orfaos`);
    for (const row of r.rows) {
      console.log(`  id=${row.id} ${col}=${row.val}`);
    }
  }
  await p.end();
}
main();
