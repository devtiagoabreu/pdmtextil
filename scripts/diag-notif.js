require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');

const MAIN = process.env.DATABASE_URL;
const NEON = process.env.DATABASE_URL_NEON;

async function main() {
  const mp = new Pool({ connectionString: MAIN });
  const np = new Pool({ connectionString: NEON });

  // ---- notificacoes: entender cardinalidade das chaves ----
  for (const [label, p] of [['MAIN', mp], ['NEON', np]]) {
    const total = (await p.query(`SELECT count(*)::int c FROM notificacoes`)).rows[0].c;
    const distinctFull = (await p.query(`SELECT count(*)::int c FROM (SELECT DISTINCT usuario_id, tipo, mensagem, usuario_nome, link, lida, lida_em, created_at FROM notificacoes) t`)).rows[0].c;
    const distinct5 = (await p.query(`SELECT count(*)::int c FROM (SELECT DISTINCT usuario_id, tipo, mensagem, usuario_nome, link, lida, created_at FROM notificacoes) t`)).rows[0].c;
    const distinct4 = (await p.query(`SELECT count(*)::int c FROM (SELECT DISTINCT usuario_id, tipo, mensagem, created_at FROM notificacoes) t`)).rows[0].c;
    const distinct3 = (await p.query(`SELECT count(*)::int c FROM (SELECT DISTINCT usuario_id, tipo, mensagem FROM notificacoes) t`)).rows[0].c;
    const maxDup3 = (await p.query(`SELECT max(c)::int AS m FROM (SELECT count(*) c FROM notificacoes GROUP BY usuario_id, tipo, mensagem) t`)).rows[0].m;
    const maxDup4 = (await p.query(`SELECT max(c)::int AS m FROM (SELECT count(*) c FROM notificacoes GROUP BY usuario_id, tipo, mensagem, created_at) t`)).rows[0].m;
    const maxDup5 = (await p.query(`SELECT max(c)::int AS m FROM (SELECT count(*) c FROM notificacoes GROUP BY usuario_id, tipo, mensagem, created_at, lida) t`)).rows[0].m;
    const idOverlap = (await p.query(`SELECT count(*)::int c FROM notificacoes WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM usuarios)`)).rows[0].c;
    console.log(`[${label}] total=${total} distinct(6+created)=${distinctFull} distinct(5)=${distinct5} distinct(4)=${distinct4} distinct(3)=${distinct3}`);
    console.log(`[${label}] maxdup(3)=${maxDup3} maxdup(4)=${maxDup4} maxdup(5)=${maxDup5} usuario_id orfão=${idOverlap}`);
  }

  // ---- user_menu_itens: contar neon vs main e chaves ----
  for (const [label, p] of [['MAIN', mp], ['NEON', np]]) {
    const total = (await p.query(`SELECT count(*)::int c FROM user_menu_itens`)).rows[0].c;
    const d1 = (await p.query(`SELECT count(*)::int c FROM (SELECT DISTINCT user_menu_id, titulo, url FROM user_menu_itens) t`)).rows[0].c;
    const d2 = (await p.query(`SELECT count(*)::int c FROM (SELECT DISTINCT user_menu_id, url FROM user_menu_itens) t`)).rows[0].c;
    console.log(`[${label}] user_menu_itens total=${total} distinct(user_menu_id,titulo,url)=${d1} distinct(user_menu_id,url)=${d2}`);
  }

  // ---- user_menus: count main vs neon ----
  for (const [label, p] of [['MAIN', mp], ['NEON', np]]) {
    const total = (await p.query(`SELECT count(*)::int c FROM user_menus`)).rows[0].c;
    const withUser = (await p.query(`SELECT count(*)::int c FROM user_menus WHERE usuario_id IS NOT NULL`)).rows[0].c;
    console.log(`[${label}] user_menus total=${total} com usuario_id=${withUser}`);
  }

  await np.end();
  await mp.end();
}
main();
