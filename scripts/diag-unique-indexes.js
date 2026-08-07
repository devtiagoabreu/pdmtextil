require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');

const CHILDREN = ['anexos','bases_urdume','crm_cidades','crm_pessoas','crm_timeline_eventos','fios','fios_fornecedores','produto_cru_estrutura','requisicoes_corte_itens','produtos_cru','produto_cru_amostra','produto_cru_composicao','base_urdume_fios','chats','chat_mensagens','chat_participantes','chat_leituras','crm_treino_licoes','user_email_config','user_menus','user_menu_itens','requisicoes_corte','notificacoes'];

async function main() {
  const p = new Pool({ connectionString: process.env.DATABASE_URL });
  for (const t of CHILDREN) {
    const r = await p.query(`
      SELECT i.indexname, i.indexdef, ix.indisunique, ix.indisprimary,
             con.conname AS constraint_name
      FROM pg_indexes i
      JOIN pg_class c ON c.relname = i.tablename AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname='public')
      JOIN pg_index ix ON ix.indexrelid = (SELECT oid FROM pg_class WHERE relname = i.indexname)
      LEFT JOIN pg_constraint con ON con.conindid = ix.indexrelid
      WHERE i.schemaname='public' AND i.tablename = $1 AND ix.indisunique
      ORDER BY i.indexname`, [t]);
    if (r.rows.length) {
      console.log(`\n== ${t} ==`);
      for (const row of r.rows) {
        const kind = row.indisprimary ? 'PRIMARY KEY' : (row.constraint_name ? 'CONSTRAINT' : 'INDEX');
        console.log(`  [${kind}] ${row.indexname}: ${row.indexdef}`);
      }
    }
  }
  await p.end();
}
main();
