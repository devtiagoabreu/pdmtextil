import postgres from 'postgres';
import { config } from 'dotenv';

// Limpa os dados de teste do atendimento automatico do WhatsApp.
//
// Modos:
//   node scripts/limpar-bot-whatsapp.mjs            -> dry-run (só conta o que seria apagado)
//   node scripts/limpar-bot-whatsapp.mjs --apagar    -> apaga de verdade
//
// Escopo (conforme combinado):
//   - crm_whatsapp_conversas         (todas)
//   - crm_whatsapp_mensagens         (todas)
//   - crm_notificacoes               (tipos do bot WhatsApp)
//
// NÃO apaga leads do CRM.

config({ path: '.env.local' });

const URL_ALVO = process.argv.includes('--pro') ? process.env.DATABASE_URL_PDM_PRO_TEXTIL
  : process.argv.includes('--ibirapuera') ? process.env.DATABASE_URL_PDM_IBIRAPUERA
  : process.argv.includes('--neon') ? process.env.DATABASE_URL_NEON
  : process.env.DATABASE_URL;

if (!URL_ALVO) {
  console.error('DATABASE_URL não encontrada em .env.local');
  process.exit(1);
}

const apagar = process.argv.includes('--apagar');
const sql = postgres(URL_ALVO, { max: 1 });

const TIPOS_BOT = [
  'WHATSAPP_ESCALACAO',
  'WHATSAPP_ERRO_TECNICO',
  'WHATSAPP_REDIRECIONADO_PF',
  'WHATSAPP_BLOQUEADO',
  'WHATSAPP_ABANDONO',
  'WHATSAPP_RETORNO',
  'lead_novo',
];

const [[conv], [msg], [notif]] = await Promise.all([
  sql`SELECT COUNT(*)::int AS total FROM crm_whatsapp_conversas`,
  sql`SELECT COUNT(*)::int AS total FROM crm_whatsapp_mensagens`,
  sql`SELECT COUNT(*)::int AS total FROM crm_notificacoes WHERE tipo IN ${sql(TIPOS_BOT)}`,
]);

console.log(`Banco alvo: ${process.argv.includes('--pro') ? 'PDM Pro Têxtil' : process.argv.includes('--ibirapuera') ? 'PDM Ibirapuera' : process.argv.includes('--neon') ? 'Neon' : 'Principal (pdm_textil)'}`);
console.log(`Modo: ${apagar ? 'APAGAR' : 'dry-run (nenhuma alteração)'}`);
console.log('----------------------------------------');
console.log(`crm_whatsapp_conversas   : ${conv.total}`);
console.log(`crm_whatsapp_mensagens   : ${msg.total}`);
console.log(`crm_notificacoes (bot)   : ${notif.total}`);
console.log('----------------------------------------');

if (!apagar) {
  console.log('Para apagar de verdade, rode com --apagar');
  await sql.end();
  process.exit(0);
}

const [dc, dm, dn] = await Promise.all([
  sql`DELETE FROM crm_whatsapp_conversas`,
  sql`DELETE FROM crm_whatsapp_mensagens`,
  sql`DELETE FROM crm_notificacoes WHERE tipo IN ${sql(TIPOS_BOT)}`,
]);

console.log('Apagado:');
console.log(`  conversas removidas : ${dc.count}`);
console.log(`  mensagens removidas : ${dm.count}`);
console.log(`  notificações remov  : ${dn.count}`);

await sql.end();
console.log('Concluído.');
