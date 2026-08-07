require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');

async function main() {
  const mp = new Pool({ connectionString: process.env.DATABASE_URL, options: '-c timezone=UTC' });
  const np = new Pool({ connectionString: process.env.DATABASE_URL_NEON, options: '-c timezone=UTC' });

  console.log('== msg 50: procurar conteudo no main ==');
  const nm = (await np.query(`SELECT id, chat_id, remetente_id, mensagem, created_at FROM chat_mensagens WHERE id=50`)).rows[0];
  console.log('neon msg50:', JSON.stringify(nm));
  const found = await mp.query(
    `SELECT id, chat_id, remetente_id, mensagem, created_at FROM chat_mensagens WHERE chat_id=$1 AND mensagem=$2 ORDER BY id`,
    [nm.chat_id, nm.mensagem]);
  console.log('main candidatas:', found.rowCount, JSON.stringify(found.rows));

  console.log('\n== mensagens nao mapeadas (neon sem par em main) ==');
  const allN = (await np.query(`SELECT id, chat_id, remetente_id, mensagem, created_at FROM chat_mensagens ORDER BY id`)).rows;
  const allM = (await mp.query(`SELECT id, chat_id, remetente_id, mensagem, created_at FROM chat_mensagens ORDER BY id`)).rows;
  const mSet = new Set(allM.map((m) => `${m.chat_id}|${m.remetente_id}|${m.mensagem}|${m.created_at.toISOString()}`));
  const nSet = new Set(allN.map((m) => `${m.chat_id}|${m.remetente_id}|${m.mensagem}|${m.created_at.toISOString()}`));
  for (const n of allN) {
    const k = `${n.chat_id}|${n.remetente_id}|${n.mensagem}|${n.created_at.toISOString()}`;
    if (!mSet.has(k)) {
      const cands = allM.filter((m) => m.chat_id === n.chat_id && m.mensagem === n.mensagem);
      console.log(`neon id=${n.id}: chat=${n.chat_id} rem=${n.remetente_id} criado=${n.created_at.toISOString()} msg="${n.mensagem.slice(0,40)}" -> main cands=${cands.map((c) => c.id).join(',')}`);
    }
  }

  console.log('\n== user_menus ids no main (faixa 1-30) ==');
  console.log('main user_menus ids 1..30:', (await mp.query('SELECT id FROM user_menus WHERE id BETWEEN 1 AND 30 ORDER BY id')).rows.map(r=>r.id).join(','));
  console.log('main user_menus total:', (await mp.query('SELECT count(*)::int c FROM user_menus')).rows[0].c, 'max id:', (await mp.query('SELECT max(id)::int c FROM user_menus')).rows[0].c);
  console.log('neon user_menus total:', (await np.query('SELECT count(*)::int c FROM user_menus')).rows[0].c, 'max id:', (await np.query('SELECT max(id)::int c FROM user_menus')).rows[0].c);

  console.log('\n== item 713: procurar em neon por conteudo ==');
  const it = (await mp.query(`SELECT * FROM user_menu_itens WHERE id=713`)).rows[0];
  const inNeon = await np.query(`SELECT id, user_menu_id, titulo, url, ordem, created_at FROM user_menu_itens WHERE titulo='Cadastros' AND url='/cadastros'`);
  console.log('neon itens "Cadastros /cadastros":', inNeon.rowCount, JSON.stringify(inNeon.rows));
  console.log('neon user_menus com titulo Cadastros:', JSON.stringify((await np.query(`SELECT id, usuario_id, role, titulo FROM user_menus WHERE titulo LIKE '%adastro%'`)).rows));

  await np.end();
  await mp.end();
}
main();
