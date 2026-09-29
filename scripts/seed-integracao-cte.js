// Registra o endpoint de relatório NF-e → CT-e na tabela `integracoes`.
//
// Roda nos 4 bancos (pdm_textil, pdm_pro_textil, pdm_ibirapuera, neon).
//
// Uso:
//   node scripts/seed-integracao-cte.js                 (todos os bancos)
//   node scripts/seed-integracao-cte.js --db=pdm_textil (só o principal)
//   node scripts/seed-integracao-cte.js --forcar        (reaplica telas/ativo)
//   node scripts/seed-integracao-cte.js --verificar      (testa as credenciais na API antes de gravar)
//   node scripts/seed-integracao-cte.js --fonte-db=neon  (de onde clonar as chaves, quando o banco alvo não tem integração de origem)
//
// Requer as env vars do .env.local (DATABASE_URL, DATABASE_URL_PDM_PRO_TEXTIL,
// DATABASE_URL_PDM_IBIRAPUERA, DATABASE_URL_NEON).

const { seedIntegracao, parseSeedArgs } = require("./lib/seed-integracao")

seedIntegracao({
  nome: "api_rel_nfe_cte_periodo",
  baseUrl: "https://promoda.systextil.com.br/apexbd/erp/systextil-intg-plm/api_rel_nfe_cte_periodo",
  tela: "nfe-cte",
  ...parseSeedArgs(process.argv.slice(2)),
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
