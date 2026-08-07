require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');

const MAIN = process.env.DATABASE_URL;
const NEON = process.env.DATABASE_URL_NEON;

// (child, col, parent) — referencias de tabelas restauradas a pais renumerados,
// extraidas do schema drizzle. Pais: tabelas do backup com ids renumerados.
const REFS = [
  ['base_urdume_fios', 'base_urdume_id', 'bases_urdume'],
  ['base_urdume_fios', 'fio_id', 'fios'],
  ['chats', 'criado_por', 'usuarios'],
  ['chat_mensagens', 'chat_id', 'chats'],
  ['chat_mensagens', 'remetente_id', 'usuarios'],
  ['chat_participantes', 'chat_id', 'chats'],
  ['chat_participantes', 'usuario_id', 'usuarios'],
  ['chat_leituras', 'mensagem_id', 'chat_mensagens'],
  ['chat_leituras', 'usuario_id', 'usuarios'],
  ['crm_equipes', 'responsavel_id', 'usuarios'],
  ['crm_equipe_membros', 'equipe_id', 'crm_equipes'],
  ['crm_estados', 'gerente_id', 'usuarios'],
  ['crm_regioes', 'gerente_id', 'usuarios'],
  ['crm_treino_licoes', 'modulo_id', 'crm_treino_modulos'],
  ['email_enviados', 'disparo_id', 'email_disparos'],
  ['email_lista_contatos', 'lista_id', 'email_listas'],
  ['email_cliques', 'email_id', 'email_enviados'],
  ['email_agendados', 'criado_por', 'usuarios'],
  ['email_disparos', 'criado_por', 'usuarios'],
  ['logs', 'usuario_id', 'usuarios'],
  ['notificacoes', 'usuario_id', 'usuarios'],
  ['representantes', 'gerente_id', 'usuarios'],
  ['user_email_config', 'usuario_id', 'usuarios'],
  ['user_menus', 'usuario_id', 'usuarios'],
  ['user_menu_itens', 'menu_id', 'user_menus'],
  ['user_menu_itens', 'usuario_id', 'usuarios'],
  ['sessions', 'user_id', 'usuarios'],
  ['crm_pessoas', 'responsavel_id', 'usuarios'],
  ['crm_whatsapp_conversas', 'empresa_id', 'crm_pessoas'],
  ['crm_whatsapp_mensagens', 'empresa_id', 'crm_pessoas'],
];

async function main() {
  const mp = new Pool({ connectionString: MAIN });
  const np = new Pool({ connectionString: NEON });
  console.log('child.col -> parent | rows | cruzadas (col = id antigo/inexistente)');
  for (const [child, col, parent] of REFS) {
    try {
      const mainIds = await mp.query(`SELECT id::text AS id FROM "${parent}"`);
      const neonIds = await np.query(`SELECT id::text AS id FROM "${parent}"`);
      const m = await mp.query(`SELECT count(*)::int AS c, count(DISTINCT "${col}")::int AS d, string_agg(DISTINCT "${col}"::text, ',') AS vals FROM "${child}" WHERE "${col}" IS NOT NULL`);
      const total = m.rows[0].c;
      if (total === 0) { console.log(`  ${child}.${col} -> ${parent}: (0 linhas)`); continue; }
      const mainSet = new Set(mainIds.rows.map((r) => r.id));
      const oldSet = new Set(neonIds.rows.map((r) => r.id));
      const oldList = neonIds.rows.map((r) => r.id);
      // linhas cujo valor NAO existe no pai hoje (orfas de verdade)
      const cross = await mp.query(`SELECT count(*)::int AS c FROM "${child}" WHERE "${col}" IS NOT NULL AND "${col}"::text NOT IN (SELECT id::text FROM "${parent}")`);
      // linhas cujo valor e um ID ANTIGO (neon) -> candidatas a remap
      const cand = await mp.query(
        `SELECT count(*)::int AS c FROM "${child}" WHERE "${col}" IS NOT NULL AND "${col}"::text = ANY($1::text[])`,
        [oldList]
      );
      const candOk = (cand.rows[0].c || 0) - (cross.rows[0].c || 0);
      const note = cross.rows[0].c > 0 ? ` | ÓRFÃS=${cross.rows[0].c}` : '';
      console.log(`  ${child}.${col} -> ${parent}: ${total} | id antigo=${cand.rows[0].c || 0} (órfãs=${cross.rows[0].c || 0})${note}`);
    } catch (e) {
      console.log(`  ${child}.${col} -> ${parent}: ERRO ${e.message.slice(0, 80)}`);
    }
  }
  await np.end();
  await mp.end();
}

main();
