const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

const INDEXES = `
-- ============================================
-- Foreign Key Indexes for all databases
-- Generated from schema analysis
-- ============================================

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_anexos_solicitacao_id ON anexos(solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_anexos_criado_por ON anexos(criado_por);
CREATE INDEX IF NOT EXISTS idx_bases_urdume_criado_por ON bases_urdume(criado_por);
CREATE INDEX IF NOT EXISTS idx_bases_urdume_fios_base_urdume_id ON bases_urdume_fios(base_urdume_id);
CREATE INDEX IF NOT EXISTS idx_bases_urdume_fios_fio_id ON bases_urdume_fios(fio_id);
CREATE INDEX IF NOT EXISTS idx_chats_criado_por ON chats(criado_por);
CREATE INDEX IF NOT EXISTS idx_chat_mensagens_chat_id ON chat_mensagens(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_mensagens_remetente_id ON chat_mensagens(remetente_id);
CREATE INDEX IF NOT EXISTS idx_chat_participantes_chat_id ON chat_participantes(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_participantes_usuario_id ON chat_participantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_chat_leituras_mensagem_id ON chat_leituras(mensagem_id);
CREATE INDEX IF NOT EXISTS idx_chat_leituras_usuario_id ON chat_leituras(usuario_id);
CREATE INDEX IF NOT EXISTS idx_clientes_representantes_cliente_id ON clientes_representantes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_representantes_representante_id ON clientes_representantes(representante_id);
CREATE INDEX IF NOT EXISTS idx_crm_campanhas_criado_por ON crm_campanhas(criado_por);
CREATE INDEX IF NOT EXISTS idx_crm_cidades_estado_id ON crm_cidades(estado_id);
CREATE INDEX IF NOT EXISTS idx_crm_contatos_empresa_id ON crm_contatos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_crm_contatos_cliente_id ON crm_contatos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_crm_equipe_membros_equipe_id ON crm_equipe_membros(equipe_id);
CREATE INDEX IF NOT EXISTS idx_crm_equipe_membros_representante_id ON crm_equipe_membros(representante_id);
CREATE INDEX IF NOT EXISTS idx_crm_equipes_regiao_id ON crm_equipes(regiao_id);
CREATE INDEX IF NOT EXISTS idx_crm_equipes_responsavel_id ON crm_equipes(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_crm_estados_gerente_id ON crm_estados(gerente_id);
CREATE INDEX IF NOT EXISTS idx_crm_estados_pais_id ON crm_estados(pais_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_responsavel_id ON crm_leads(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_pessoa_id ON crm_leads(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_crm_oportunidades_lead_id ON crm_oportunidades(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_oportunidades_empresa_id ON crm_oportunidades(empresa_id);
CREATE INDEX IF NOT EXISTS idx_crm_oportunidades_contato_id ON crm_oportunidades(contato_id);
CREATE INDEX IF NOT EXISTS idx_crm_oportunidades_responsavel_id ON crm_oportunidades(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_crm_pesquisas_respostas_pesquisa_id ON crm_pesquisas_respostas(pesquisa_id);
CREATE INDEX IF NOT EXISTS idx_crm_pesquisas_satisfacao_visita_id ON crm_pesquisas_satisfacao(visita_id);
CREATE INDEX IF NOT EXISTS idx_crm_pesquisas_satisfacao_criado_por ON crm_pesquisas_satisfacao(criado_por);
CREATE INDEX IF NOT EXISTS idx_crm_pessoas_responsavel_id ON crm_pessoas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_crm_pessoas_cliente_id ON crm_pessoas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_crm_propostas_oportunidade_id ON crm_propostas(oportunidade_id);
CREATE INDEX IF NOT EXISTS idx_crm_propostas_empresa_id ON crm_propostas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_crm_propostas_criado_por ON crm_propostas(criado_por);
CREATE INDEX IF NOT EXISTS idx_crm_regioes_gerente_id ON crm_regioes(gerente_id);
CREATE INDEX IF NOT EXISTS idx_crm_tarefas_empresa_id ON crm_tarefas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_crm_tarefas_oportunidade_id ON crm_tarefas(oportunidade_id);
CREATE INDEX IF NOT EXISTS idx_crm_tarefas_responsavel_id ON crm_tarefas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_crm_tarefas_criado_por ON crm_tarefas(criado_por);
CREATE INDEX IF NOT EXISTS idx_crm_timeline_eventos_empresa_id ON crm_timeline_eventos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_crm_treino_licoes_modulo_id ON crm_treino_licoes(modulo_id);
CREATE INDEX IF NOT EXISTS idx_crm_visitas_localizacoes_visita_id ON crm_visitas_localizacoes(visita_id);
CREATE INDEX IF NOT EXISTS idx_crm_visitas_localizacoes_criado_por ON crm_visitas_localizacoes(criado_por);
CREATE INDEX IF NOT EXISTS idx_crm_visitas_empresa_id ON crm_visitas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_crm_visitas_cliente_id ON crm_visitas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_crm_visitas_oportunidade_id ON crm_visitas(oportunidade_id);
CREATE INDEX IF NOT EXISTS idx_crm_visitas_contato_id ON crm_visitas(contato_id);
CREATE INDEX IF NOT EXISTS idx_crm_visitas_criado_por ON crm_visitas(criado_por);
CREATE INDEX IF NOT EXISTS idx_crm_whatsapp_empresa_id ON crm_whatsapp(empresa_id);
CREATE INDEX IF NOT EXISTS idx_crm_whatsapp_contato_id ON crm_whatsapp(contato_id);
CREATE INDEX IF NOT EXISTS idx_email_agendados_criado_por ON email_agendados(criado_por);
CREATE INDEX IF NOT EXISTS idx_email_cliques_envio_id ON email_cliques(envio_id);
CREATE INDEX IF NOT EXISTS idx_email_enviados_lista_id ON email_enviados(lista_id);
CREATE INDEX IF NOT EXISTS idx_email_lista_contatos_lista_id ON email_lista_contatos(lista_id);
CREATE INDEX IF NOT EXISTS idx_fios_criado_por ON fios(criado_por);
CREATE INDEX IF NOT EXISTS idx_fios_fornecedores_fio_id ON fios_fornecedores(fio_id);
CREATE INDEX IF NOT EXISTS idx_fios_fornecedores_fornecedor_id ON fios_fornecedores(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_logs_usuario_id ON logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pessoas_representantes_pessoa_id ON pessoas_representantes(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_pessoas_representantes_representante_id ON pessoas_representantes(representante_id);
CREATE INDEX IF NOT EXISTS idx_produtos_cru_solicitacao_desenvolvimento_id ON produtos_cru(solicitacao_desenvolvimento_id);
CREATE INDEX IF NOT EXISTS idx_produtos_cru_criado_por ON produtos_cru(criado_por);
CREATE INDEX IF NOT EXISTS idx_produto_cru_composicao_produto_cru_id ON produto_cru_composicao(produto_cru_id);
CREATE INDEX IF NOT EXISTS idx_produto_cru_estrutura_produto_cru_id ON produto_cru_estrutura(produto_cru_id);
CREATE INDEX IF NOT EXISTS idx_produto_cru_estrutura_fio_id ON produto_cru_estrutura(fio_id);
CREATE INDEX IF NOT EXISTS idx_produto_cru_estrutura_base_urdume_id ON produto_cru_estrutura(base_urdume_id);
CREATE INDEX IF NOT EXISTS idx_produto_cru_amostra_produto_cru_id ON produto_cru_amostra(produto_cru_id);
CREATE INDEX IF NOT EXISTS idx_produto_cru_acabamento_produto_cru_id ON produto_cru_acabamento(produto_cru_id);
CREATE INDEX IF NOT EXISTS idx_produto_cru_acabamento_amostra_acabamento_id ON produto_cru_acabamento_amostra(acabamento_id);
CREATE INDEX IF NOT EXISTS idx_produto_cru_acabamento_receita_acabamento_id ON produto_cru_acabamento_receita(acabamento_id);
CREATE INDEX IF NOT EXISTS idx_produtos_quimicos_criado_por ON produtos_quimicos(criado_por);
CREATE INDEX IF NOT EXISTS idx_produto_cru_receita_amostra_id ON produto_cru_receita(amostra_id);
CREATE INDEX IF NOT EXISTS idx_produto_cru_receita_item_receita_id ON produto_cru_receita_item(receita_id);
CREATE INDEX IF NOT EXISTS idx_produto_cru_receita_item_quimico_id ON produto_cru_receita_item(quimico_id);
CREATE INDEX IF NOT EXISTS idx_representantes_gerente_id ON representantes(gerente_id);
CREATE INDEX IF NOT EXISTS idx_requisicoes_amostra_comercial_solicitante_id ON requisicoes_amostra_comercial(solicitante_id);
CREATE INDEX IF NOT EXISTS idx_requisicoes_amostra_comercial_responsavel_id ON requisicoes_amostra_comercial(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_requisicoes_amostra_comercial_produto_cru_id ON requisicoes_amostra_comercial(produto_cru_id);
CREATE INDEX IF NOT EXISTS idx_requisicoes_amostra_comercial_criado_por ON requisicoes_amostra_comercial(criado_por);
CREATE INDEX IF NOT EXISTS idx_requisicoes_corte_requisitante_id ON requisicoes_corte(requisitante_id);
CREATE INDEX IF NOT EXISTS idx_requisicoes_corte_itens_requisicao_corte_id ON requisicoes_corte_itens(requisicao_corte_id);
CREATE INDEX IF NOT EXISTS idx_romaneio_pecas_romaneio_id ON romaneio_pecas(romaneio_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_solicitante_id ON solicitacoes(solicitante_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_responsavel_id ON solicitacoes(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_user_email_config_usuario_id ON user_email_config(usuario_id);
CREATE INDEX IF NOT EXISTS idx_user_menus_usuario_id ON user_menus(usuario_id);
CREATE INDEX IF NOT EXISTS idx_user_menu_itens_user_menu_id ON user_menu_itens(user_menu_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
`

async function migrateDb(name, url) {
  const pool = new Pool({ connectionString: url })
  try {
    await pool.query(INDEXES)
    console.log(`${name}: OK`)
  } catch (e) {
    console.error(`${name}: ERROR - ${e.message}`)
  } finally {
    await pool.end()
  }
}

async function main() {
  const targets = [
    { name: 'pdm_textil (principal)', url: process.env.DATABASE_URL },
    { name: 'pdm_pro_textil', url: process.env.DATABASE_URL_PDM_PRO_TEXTIL },
    { name: 'pdm_ibirapuera', url: process.env.DATABASE_URL_PDM_IBIRAPUERA },
    { name: 'neon', url: process.env.DATABASE_URL_NEON },
  ]

  for (const t of targets) {
    if (t.url) await migrateDb(t.name, t.url)
  }
  console.log('Done!')
}

main().catch(e => { console.error(e); process.exit(1) })
