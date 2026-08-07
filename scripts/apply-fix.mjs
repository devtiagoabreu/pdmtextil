import pg from 'pg';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });
const { Client } = pg;

const FILE = 'backups/fix-fk-remap.sql';

// constraints unicas que podem colidir transitoriamente durante o UPDATE em massa
// (o índice é checado por linha; só no fim do statement a unicidade final vale).
// DROP + re-ADD na mesma transação: DDL é transacional e o ADD valida a unicidade
// sobre o estado final (limpo) -> sucesso; se algo falhar, tudo desfaz.
const CONSTRAINT_FIXES = [
  `ALTER TABLE "crm_cidades" DROP CONSTRAINT "crm_cidades_nome_estado_id_key";`,
  `ALTER TABLE "crm_cidades" ADD CONSTRAINT "crm_cidades_nome_estado_id_key" UNIQUE (nome, estado_id);`,
];

const CHECKS = [
  ['anexos', 'solicitacao_id', 'solicitacoes'],
  ['anexos', 'criado_por', 'usuarios'],
  ['bases_urdume', 'criado_por', 'usuarios'],
  ['crm_cidades', 'estado_id', 'crm_estados'],
  ['crm_pessoas', 'cliente_id', 'clientes'],
  ['crm_pessoas', 'responsavel_id', 'usuarios'],
  ['crm_timeline_eventos', 'empresa_id', 'crm_pessoas'],
  ['fios', 'criado_por', 'usuarios'],
  ['fios_fornecedores', 'fio_id', 'fios'],
  ['produto_cru_estrutura', 'base_urdume_id', 'bases_urdume'],
  ['produto_cru_estrutura', 'fio_id', 'fios'],
  ['produto_cru_estrutura', 'produto_cru_id', 'produtos_cru'],
  ['requisicoes_corte_itens', 'requisicao_corte_id', 'requisicoes_corte'],
  ['requisicoes_corte', 'requisitante_id', 'usuarios'],
  ['produtos_cru', 'solicitacao_desenvolvimento_id', 'solicitacoes'],
  ['produtos_cru', 'criado_por', 'usuarios'],
  ['produto_cru_amostra', 'produto_cru_id', 'produtos_cru'],
  ['produto_cru_composicao', 'produto_cru_id', 'produtos_cru'],
  ['base_urdume_fios', 'base_urdume_id', 'bases_urdume'],
  ['base_urdume_fios', 'fio_id', 'fios'],
  ['chats', 'criado_por', 'usuarios'],
  ['chat_mensagens', 'chat_id', 'chats'],
  ['chat_mensagens', 'remetente_id', 'usuarios'],
  ['chat_participantes', 'chat_id', 'chats'],
  ['chat_participantes', 'usuario_id', 'usuarios'],
  ['chat_participantes', 'ultima_mensagem_lida_id', 'chat_mensagens'],
  ['chat_leituras', 'mensagem_id', 'chat_mensagens'],
  ['chat_leituras', 'usuario_id', 'usuarios'],
  ['crm_treino_licoes', 'modulo_id', 'crm_treino_modulos'],
  ['user_email_config', 'usuario_id', 'usuarios'],
  ['user_menus', 'usuario_id', 'usuarios'],
  ['user_menu_itens', 'user_menu_id', 'user_menus'],
  ['notificacoes', 'usuario_id', 'usuarios'],
];

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 20000 });
  await c.connect();

  // remove BEGIN;/COMMIT; do arquivo (a transação é montada aqui com o DDL incluso)
  let body = readFileSync(FILE, 'utf8');
  body = body.replace(/^\s*BEGIN;\s*$/m, '').replace(/^\s*COMMIT;\s*$/m, '');

  const tx = [
    'BEGIN;',
    `SET LOCAL session_replication_role = replica;`,
    CONSTRAINT_FIXES[0], // DROP
    body,
    // Decisão manual: user_email_config id=1 (restaurada 07-14, usuario antigo 28) é
    // duplicada pela id=2 (criada pós-restore 07-24, usuario 16, senha atual).
    // Mantida a id=2; a id=1 é apagada. (remap da id=1 foi excluído do SQL)
    `DELETE FROM "user_email_config" WHERE id = 1;`,
    CONSTRAINT_FIXES[1], // ADD (valida unicidade no estado final)
    'COMMIT;',
  ].join('\n');

  console.log('Aplicando transacao unica (com DROP/ADD do constraint)...');
  const t0 = Date.now();
  try {
    await c.query(tx);
  } catch (e) {
    console.error('FALHA:', e.message.split('\n')[0]);
    console.error('Nada foi aplicado (transação desfeita, constraint restaurado).');
    await c.end();
    process.exit(1);
  }
  console.log(`Aplicado em ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log('Constraint restaurado:', CONSTRAINT_FIXES[1]);

  console.log('\n=== ORFAOS POS-FIX ===');
  let totalOrphans = 0;
  for (const [child, col, parent] of CHECKS) {
    const r = await c.query(
      `SELECT count(*)::int AS n FROM "${child}" ch LEFT JOIN "${parent}" p ON p.id = ch."${col}" WHERE ch."${col}" IS NOT NULL AND p.id IS NULL`
    );
    const n = r.rows[0].n;
    totalOrphans += n;
    console.log(`  ${child}.${col} -> ${parent}: ${n} orfaos`);
  }
  console.log(`\nTOTAL ORFAOS: ${totalOrphans}`);

  await c.end();
}

main();
