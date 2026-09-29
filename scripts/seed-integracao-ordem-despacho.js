// Registra o endpoint de Ordem de Despacho na tabela `integracoes`.
//
// A ordem de despacho é onde ficam as NOTAS FISCAIS vinculadas a cada pedido
// (pedido → NF → romaneio/rolos). É a fonte das NFs que o relatório de CT-e
// procura no OBRF_010 e nem sempre encontra.
//
// Roda nos 4 bancos (pdm_textil, pdm_pro_textil, pdm_ibirapuera, neon).
//
// Uso:
//   node scripts/seed-integracao-ordem-despacho.js                 (todos os bancos)
//   node scripts/seed-integracao-ordem-despacho.js --db=pdm_textil (só o principal)
//   node scripts/seed-integracao-ordem-despacho.js --forcar        (reaplica telas/ativo)
//   node scripts/seed-integracao-ordem-despacho.js --verificar      (testa as credenciais na API antes de gravar)
//   node scripts/seed-integracao-ordem-despacho.js --fonte-db=neon  (de onde clonar as chaves, quando o banco alvo não tem integração de origem)
//
// Requer as env vars do .env.local (DATABASE_URL, DATABASE_URL_PDM_PRO_TEXTIL,
// DATABASE_URL_PDM_IBIRAPUERA, DATABASE_URL_NEON).

const { seedIntegracao, parseSeedArgs } = require("./lib/seed-integracao")

seedIntegracao({
  nome: "api_ordem_despacho",
  baseUrl: "https://promoda.systextil.com.br/apexbd/erp/systextil-intg-plm/api_ordem_despacho",
  tela: "ordem-despacho",
  ...parseSeedArgs(process.argv.slice(2)),
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
