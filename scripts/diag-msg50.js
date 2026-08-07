require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');

async function main() {
  const mp = new Pool({ connectionString: process.env.DATABASE_URL, options: '-c timezone=UTC' });
  const np = new Pool({ connectionString: process.env.DATABASE_URL_NEON, options: '-c timezone=UTC' });

  console.log('== main: mensagens do chat 3 ==');
  const m3 = (await mp.query(`SELECT id, chat_id, remetente_id, mensagem, created_at FROM chat_mensagens WHERE chat_id=3 ORDER BY id`)).rows;
  for (const r of m3) console.log(`  id=${r.id} rem=${r.remetente_id} criado=${r.created_at.toISOString()} "${r.mensagem.slice(0, 70)}"`);

  console.log('\n== neon: mensagens do chat 3 ==');
  const n3 = (await np.query(`SELECT id, chat_id, remetente_id, mensagem, created_at FROM chat_mensagens WHERE chat_id=3 ORDER BY id`)).rows;
  for (const r of n3) console.log(`  id=${r.id} rem=${r.remetente_id} criado=${r.created_at.toISOString()} "${r.mensagem.slice(0, 70)}"`);

  console.log('\n== main: mensagens com "fio novo" ou "Semana que vem" ==');
  const f = (await mp.query(`SELECT id, chat_id, remetente_id, mensagem, created_at FROM chat_mensagens WHERE mensagem ILIKE '%fio novo%' OR mensagem ILIKE '%semana que vem%'`)).rows;
  for (const r of f) console.log(`  id=${r.id} chat=${r.chat_id} rem=${r.remetente_id} "${r.mensagem.slice(0,70)}"`);

  // chat_id 3 no main vs neon (qual chat é o 3 em cada lado)
  console.log('\n== chats 3 em cada banco ==');
  console.log('main chat 3:', JSON.stringify((await mp.query('SELECT * FROM chats WHERE id=3')).rows[0]));
  console.log('neon chat 3:', JSON.stringify((await np.query('SELECT * FROM chats WHERE id=3')).rows[0]));
  console.log('main chats:', (await mp.query('SELECT id, titulo FROM chats ORDER BY id')).rows.map(r=>`${r.id}:${r.titulo}`).join(' | '));
  console.log('neon chats:', (await np.query('SELECT id, titulo FROM chats ORDER BY id')).rows.map(r=>`${r.id}:${r.titulo}`).join(' | '));

  await np.end();
  await mp.end();
}
main();
