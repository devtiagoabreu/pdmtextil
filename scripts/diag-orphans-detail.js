require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');

async function main() {
  const mp = new Pool({ connectionString: process.env.DATABASE_URL, options: '-c timezone=UTC' });
  const np = new Pool({ connectionString: process.env.DATABASE_URL_NEON, options: '-c timezone=UTC' });

  // 1) chat: message 50
  console.log('== message 50 ==');
  console.log('main chat_mensagens ids:', (await mp.query('SELECT id FROM chat_mensagens ORDER BY id')).rows.map(r => r.id).join(','));
  console.log('neon chat_mensagens ids:', (await np.query('SELECT id FROM chat_mensagens ORDER BY id')).rows.map(r => r.id).join(','));
  console.log('neon tem msg 50?', (await np.query('SELECT count(*)::int c FROM chat_mensagens WHERE id=50')).rows[0].c);
  console.log('main chat_participantes id=96:', JSON.stringify((await mp.query('SELECT * FROM chat_participantes WHERE id=96')).rows[0]));
  console.log('neon chat_participantes id=96:', JSON.stringify((await np.query('SELECT * FROM chat_participantes WHERE id=96')).rows[0]));
  console.log('main chat_leituras id=325:', JSON.stringify((await mp.query('SELECT * FROM chat_leituras WHERE id=325')).rows[0]));
  console.log('neon chat_leituras id=325:', JSON.stringify((await np.query('SELECT * FROM chat_leituras WHERE id=325')).rows[0]));

  // msg 50: qual o conteudo em cada banco? (se nao existe, era quebrado antes)
  const mm = await mp.query(`SELECT id, chat_id, mensagem FROM chat_mensagens WHERE id=50`);
  const nm = await np.query(`SELECT id, chat_id, mensagem FROM chat_mensagens WHERE id=50`);
  console.log('main msg50:', mm.rowCount, mm.rows);
  console.log('neon msg50:', nm.rowCount, nm.rows);

  // 2) user_menu_itens id=713
  console.log('\n== user_menu_itens id=713 ==');
  console.log('main item 713:', JSON.stringify((await mp.query('SELECT * FROM user_menu_itens WHERE id=713')).rows[0]));
  console.log('neon item 713:', JSON.stringify((await np.query('SELECT * FROM user_menu_itens WHERE id=713')).rows[0]));
  console.log('main user_menus id=19:', JSON.stringify((await mp.query('SELECT * FROM user_menus WHERE id=19')).rows[0]));
  console.log('neon user_menus id=19:', JSON.stringify((await np.query('SELECT * FROM user_menus WHERE id=19')).rows[0]));
  console.log('main user_menus com titulo do item:', JSON.stringify((await mp.query(`SELECT * FROM user_menus WHERE titulo = (SELECT menu FROM user_menu_itens WHERE id=713)`)).rows));

  await np.end();
  await mp.end();
}
main();
