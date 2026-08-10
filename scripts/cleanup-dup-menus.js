require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');
const p = new Pool({ connectionString: process.env.DATABASE_URL });

async function findDupItems() {
  const r = await p.query(`
    SELECT umi.user_menu_id, um.titulo AS menu_titulo,
           um.usuario_id, um.role, umi.url,
           count(*)::int AS qtd, min(umi.id)::int AS menor_id, max(umi.id)::int AS maior_id
    FROM user_menu_itens umi
    JOIN user_menus um ON um.id = umi.user_menu_id
    GROUP BY umi.user_menu_id, um.titulo, um.usuario_id, um.role, umi.url
    HAVING count(*) > 1
    ORDER BY umi.user_menu_id, umi.url
  `);
  return r.rows;
}

async function findDupMenuGroups() {
  const r = await p.query(`
    SELECT um.id, um.usuario_id, u.name AS usuario_nome, um.titulo,
           um.icone, um.ordem, um.ativo, um.created_at,
           count(umi.id)::int AS itens
    FROM user_menus um
    LEFT JOIN user_menu_itens umi ON umi.user_menu_id = um.id
    JOIN usuarios u ON u.id = um.usuario_id
    WHERE um.usuario_id IS NOT NULL
      AND (um.usuario_id, um.titulo) IN (
        SELECT usuario_id, titulo FROM user_menus
        WHERE usuario_id IS NOT NULL
        GROUP BY usuario_id, titulo
        HAVING count(*) > 1
      )
    GROUP BY um.id, u.name
    ORDER BY um.usuario_id, um.titulo, um.id
  `);
  return r.rows;
}

function buildMenuPlan(menus) {
  const grupos = new Map();
  for (const m of menus) {
    const key = `${m.usuario_id}::${m.titulo}`;
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key).push(m);
  }
  const plan = [];
  for (const [key, grupo] of grupos) {
    grupo.sort((a, b) => b.itens - a.itens || b.id - a.id);
    const keep = grupo[0];
    plan.push({
      usuarioId: keep.usuario_id,
      usuarioNome: keep.usuario_nome,
      titulo: keep.titulo,
      keepId: keep.id,
      removeIds: grupo.slice(1).map((m) => m.id),
      keepItens: keep.itens,
    });
  }
  return plan.sort((a, b) => a.usuarioId - b.usuarioId || a.keepId - b.keepId);
}

async function backupRows() {
  const dir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `cleanup-dup-menus-${stamp}.json`);

  const dupItems = await findDupItems();
  const dupMenus = await findDupMenuGroups();
  const dupMenuIds = dupMenus.map((m) => m.id);

  let menusItems = [];
  if (dupMenuIds.length > 0) {
    const r = await p.query(
      `SELECT * FROM user_menu_itens WHERE user_menu_id = ANY($1::int[]) ORDER BY user_menu_id, id`,
      [dupMenuIds],
    );
    menusItems = r.rows;
  }

  const itemsToDelete = await p.query(`
    SELECT umi.* FROM user_menu_itens umi
    JOIN (
      SELECT user_menu_id, url, max(id)::int AS keep_id
      FROM user_menu_itens
      GROUP BY user_menu_id, url
      HAVING count(*) > 1
    ) d
      ON umi.user_menu_id = d.user_menu_id
     AND umi.url = d.url
     AND umi.id <> d.keep_id
    ORDER BY umi.user_menu_id, umi.id
  `);

  fs.writeFileSync(file, JSON.stringify({ createdAt: new Date().toISOString(), dupMenus, dupItems, menusItems, itemsToDelete: itemsToDelete.rows }, null, 2));
  return file;
}

async function main() {
  console.log('=== DIAGNÓSTICO: MENUS/ITENS DUPLICADOS ===');

  const dupItems = await findDupItems();
  console.log(`\nItens duplicados (mesmo menu + mesma url): ${dupItems.length} grupos`);
  for (const d of dupItems) {
    const dono = d.usuario_id ? `user ${d.usuario_id}` : `role ${d.role || '?'}`;
    console.log(`  menu#${d.user_menu_id} "${d.menu_titulo}" (${dono}) url "${d.url}" x${d.qtd} ids ${d.menor_id}..${d.maior_id}`);
  }
  if (dupItems.length === 0) console.log('  (nenhum)');

  const dupMenus = await findDupMenuGroups();
  console.log(`\nMenus duplicados (mesmo usuário + mesmo título): ${dupMenus.length} menus em grupos`);
  const plan = buildMenuPlan(dupMenus);
  for (const g of plan) {
    console.log(`  user #${g.usuarioId} ${g.usuarioNome} -> "${g.titulo}" manter menu#${g.keepId} (${g.keepItens} itens), remover menus [${g.removeIds.join(', ')}]`);
  }
  if (plan.length === 0) console.log('  (nenhum)');

  if (!APPLY) {
    console.log('\nDry-run: nenhuma alteração feita. Rode com --apply para executar.');
    console.log('O script grava um backup JSON em backups/ antes de alterar.');
    await p.end();
    return;
  }

  console.log('\n=== BACKUP ===');
  const backupFile = await backupRows();
  console.log(`Backup salvo em: ${backupFile}`);

  console.log('\n=== APLICANDO (transação única) ===');
  const { Client } = require('pg');
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  try {
    await c.query('BEGIN');

    // 1) Remove itens duplicados: mantém o de maior id por (user_menu_id, url)
    const delItems = await c.query(`
      DELETE FROM user_menu_itens umi
      USING (
        SELECT user_menu_id, url, max(id)::int AS keep_id
        FROM user_menu_itens
        GROUP BY user_menu_id, url
        HAVING count(*) > 1
      ) d
      WHERE umi.user_menu_id = d.user_menu_id
        AND umi.url = d.url
        AND umi.id <> d.keep_id
    `);
    console.log(`Itens duplicados removidos: ${delItems.rowCount}`);

    // 2) Menus duplicados por (usuario_id, titulo): migra itens únicos e apaga os extras
    let menusRemovidos = 0;
    let itensMigrados = 0;
    for (const g of plan) {
      const itens = await c.query(
        `SELECT * FROM user_menu_itens WHERE user_menu_id = $1 ORDER BY id`,
        [g.keepId],
      );
      const urls = new Set(itens.rows.map((i) => i.url));

      for (const removeId of g.removeIds) {
        const otherItens = await c.query(
          `SELECT * FROM user_menu_itens WHERE user_menu_id = $1 ORDER BY id`,
          [removeId],
        );
        for (const item of otherItens.rows) {
          if (urls.has(item.url)) continue;
          await c.query(`UPDATE user_menu_itens SET user_menu_id = $1 WHERE id = $2`, [
            g.keepId,
            item.id,
          ]);
          urls.add(item.url);
          itensMigrados++;
        }
        await c.query(`DELETE FROM user_menus WHERE id = $1`, [removeId]);
        menusRemovidos++;
      }
    }
    console.log(`Menus duplicados removidos: ${menusRemovidos}`);
    console.log(`Itens migrados para o menu mantido: ${itensMigrados}`);

    // 3) Renumera a ordem dos menus dos usuários afetados
    const affected = [...new Set(plan.map((g) => g.usuarioId))];
    if (affected.length > 0) {
      await c.query(
        `UPDATE user_menus um
         SET ordem = t.rn
         FROM (
           SELECT id, row_number() OVER (PARTITION BY usuario_id ORDER BY ordem, id) - 1 AS rn
           FROM user_menus
           WHERE usuario_id = ANY($1::int[])
         ) t
         WHERE um.id = t.id`,
        [affected],
      );
      console.log(`Ordem reordenada para usuários afetados: ${affected.join(', ')}`);
    }

    await c.query('COMMIT');
    console.log('\nAplicado com sucesso.');
  } catch (e) {
    await c.query('ROLLBACK');
    console.error('FALHA:', e.message.split('\n')[0]);
    console.error('Nada foi aplicado (transação desfeita).');
    await c.end();
    await p.end();
    process.exit(1);
  }

  await c.end();

  console.log('\n=== PÓS-CHECK ===');
  const restItems = await findDupItems();
  const restMenus = await findDupMenuGroups();
  console.log(`Itens duplicados restantes: ${restItems.length}`);
  console.log(`Menus duplicados restantes: ${buildMenuPlan(restMenus).length}`);

  await p.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
