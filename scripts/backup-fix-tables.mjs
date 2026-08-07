import pg from 'pg';
import { writeFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });
const { Pool } = pg;

const TABLES = [
  'anexos', 'bases_urdume', 'crm_cidades', 'crm_pessoas', 'crm_timeline_eventos',
  'fios', 'fios_fornecedores', 'produto_cru_estrutura', 'requisicoes_corte_itens',
  'produtos_cru', 'produto_cru_amostra', 'produto_cru_composicao',
  'requisicoes_corte', 'solicitacoes', 'usuarios', 'clientes', 'crm_estados',
  'fornecedores', 'crm_contatos', 'representantes', 'accounts', 'clientes_representantes',
  'base_urdume_fios', 'chats', 'chat_mensagens', 'chat_participantes', 'chat_leituras',
  'crm_treino_modulos', 'crm_treino_licoes', 'user_email_config', 'user_menus',
  'user_menu_itens', 'notificacoes',
];

function lit(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function dumpTable(pool, t) {
  const colsRes = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
    [t]
  );
  const cols = colsRes.rows.map((r) => r.column_name);
  const data = await pool.query(`SELECT ${cols.map((c) => `"${c}"`).join(', ')} FROM "${t}" ORDER BY 1`);
  if (!data.rows.length) return `-- ${t}: vazia (0 linhas)\n`;
  const colList = cols.map((c) => `"${c}"`).join(', ');
  const lines = data.rows.map(
    (r) => `(${cols.map((c) => lit(r[c])).join(', ')})`
  );
  return `INSERT INTO "${t}" (${colList}) VALUES\n${lines.join(',\n')};\n`;
}

(async () => {
  const p = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 20000 });
  const stamp = new Date().toISOString().slice(0, 10);
  const out = [`-- Backup de seguranca pre-fix (${stamp})`, '-- Gerado por scripts/backup-fix-tables.mjs', '-- Banco: pdm_textil (principal)', 'BEGIN;', ''];
  for (const t of TABLES) {
    try {
      out.push(`-- ===== ${t} =====`);
      out.push(await dumpTable(p, t));
    } catch (e) {
      out.push(`-- ${t}: ERRO ${e.message}`);
    }
  }
  out.push('COMMIT;');
  const file = `backups/pre-fix-${stamp}.sql`;
  writeFileSync(file, out.join('\n'));
  console.log(`OK: ${file} (${out.length} linhas)`);
  await p.end();
})();
