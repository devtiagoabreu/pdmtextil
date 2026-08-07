require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');

(async () => {
  const p = new Pool({ connectionString: process.env.DATABASE_URL });
  const disp = (await p.query(`
    SELECT d.id, d.nome, d.para, d.status, d.total, d.enviados, d.falhas, d.erro,
           d.modo_envio, d.remetente, d.criado_por, u.name AS criador,
           d.criado_em, d.iniciado_em, d.concluido_em
    FROM email_disparos d LEFT JOIN usuarios u ON u.id = d.criado_por
    ORDER BY d.id DESC LIMIT 15`)).rows;
  for (const r of disp) {
    console.log(`#${r.id} ${r.nome} | status=${r.status} total=${r.total} enviados=${r.enviados} falhas=${r.falhas} modo=${r.modo_envio} rem=${r.remetente} criador=${r.criador}(${r.criado_por})`);
    if (r.erro) console.log(`   erro: ${r.erro.slice(0, 300)}`);
    console.log(`   criado=${r.criado_em?.toISOString()} iniciado=${r.iniciado_em?.toISOString()} concluido=${r.concluido_em?.toISOString()}`);
  }

  const users = (await p.query(`SELECT id, name, email FROM usuarios WHERE name ILIKE '%ang%' OR email ILIKE '%ang%'`)).rows;
  console.log('\nAngélica user:', JSON.stringify(users));

  const env = (await p.query(`
    SELECT status, count(*)::int AS c FROM email_enviados
    WHERE error IS NOT NULL AND error <> ''
    GROUP BY status ORDER BY c DESC`)).rows;
  console.log('\nEnviados com erro por status:', env);

  const errs = (await p.query(`
    SELECT error, count(*)::int AS c FROM email_enviados
    WHERE error IS NOT NULL AND error <> ''
    GROUP BY error ORDER BY c DESC LIMIT 10`)).rows;
  console.log('\nTop erros:');
  for (const r of errs) console.log(`  [${r.c}] ${(r.error || '').slice(0, 200)}`);

  const last = (await p.query(`
    SELECT disparo_id, count(*)::int AS c FROM email_enviados
    WHERE status='pendente' GROUP BY disparo_id ORDER BY c DESC LIMIT 10`)).rows;
  console.log('\nPendentes por disparo:', JSON.stringify(last));
  await p.end();
})();
