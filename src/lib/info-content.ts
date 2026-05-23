export type InfoContent = {
  title: string
  description: string
  rules?: string[]
  fields?: { name: string; desc: string }[]
}

export const infoContent: Record<string, InfoContent> = {
  "/dashboard": {
    title: "Dashboard Solicitações",
    description: "Painel principal com métricas e indicadores das solicitações comerciais. Acompanhe o volume de solicitações criadas no mês, status atuais, distribuição por tipo e tendência mensal.",
    rules: [
      "Os dados exibidos refletem o estado atual do banco de dados em tempo real.",
      "O gráfico de tendência mensal mostra os últimos 6 meses.",
      "A distribuição de status considera todas as solicitações cadastradas.",
      "Apenas usuários autenticados têm acesso ao painel.",
    ],
  },
  "/dashboard/amostras": {
    title: "Dashboard Amostras",
    description: "Painel de métricas das amostras de tecido cru e acabamento. Acompanhe o total de amostras, aprovações, reprovações e tendência mensal de criação.",
    rules: [
      "Amostras são vinculadas a um produto cru ou a um acabamento.",
      "O status 'APROVADO' indica que a amostra foi validada pelo cliente ou equipe técnica.",
      "A curva de aprovação mostra a relação entre amostras aprovadas e o total.",
    ],
  },
  "/comercial/solicitacoes": {
    title: "Solicitações",
    description: "Lista de todas as solicitações comerciais registradas no sistema. Aqui você pode visualizar, filtrar e gerenciar cada solicitação.",
    rules: [
      "Solicitações passam por um fluxo de status: PENDENTE → EM_DESENVOLVIMENTO → APROVADO/REPROVADO → EM_PRODUÇÃO → CONCLUÍDO.",
      "Apenas usuários com perfil ADMIN ou SUDO podem excluir solicitações.",
      "Cada solicitação pertence a um cliente e pode ser do tipo Tecelagem ou Beneficiamento.",
      "Ao excluir uma solicitação, todos os anexos vinculados também são removidos.",
      "Mudanças de status são registradas no histórico da solicitação.",
    ],
    fields: [
      { name: "Cliente", desc: "Nome do cliente solicitante (autocomplete com dados cadastrados)" },
      { name: "Tipo", desc: "Tecelagem (desenvolvimento de tecido) ou Beneficiamento (processo químico)" },
      { name: "Status", desc: "Etapa atual no fluxo de desenvolvimento" },
      { name: "Briefing", desc: "Detalhamento técnico da solicitação com campos dinâmicos conforme o tipo" },
    ],
  },
  "/comercial/solicitacoes/nova": {
    title: "Nova Solicitação",
    description: "Formulário de criação de uma nova solicitação comercial. Preencha os dados do cliente, tipo, briefing técnico e prazos.",
    rules: [
      "Campos marcados com * são obrigatórios.",
      "O briefing é dividido em seções dinâmicas que mudam conforme o tipo de solicitação.",
      "Toda solicitação nova inicia com status PENDENTE.",
      "É possível anexar arquivos (PDF, DOCX, XLSX, JPG, PNG, MP4) até 10MB cada.",
      "Após criar, a solicitação pode ser editada até o início do desenvolvimento.",
    ],
  },
  "/comercial/clientes": {
    title: "Clientes",
    description: "Cadastro de clientes comerciais. Gerencie informações como nome, CNPJ, contatos e endereço.",
    rules: [
      "O CNPJ é validado para garantir unicidade no cadastro.",
      "Clientes ativos podem ser vinculados a solicitações.",
      "A desativação de um cliente não remove solicitações existentes.",
    ],
    fields: [
      { name: "Nome", desc: "Nome fantasia ou razão social" },
      { name: "CNPJ", desc: "Cadastro Nacional de Pessoa Jurídica (formato XX.XXX.XXX/XXXX-XX)" },
      { name: "Contato", desc: "Nome e telefone do contato comercial" },
    ],
  },
  "/cadastros": {
    title: "Cadastros",
    description: "Módulo central de cadastros técnicos do sistema. Aqui você gerencia produtos, insumos, fornecedores e dados de produção.",
    rules: [
      "Todos os cadastros alimentam os módulos de produção e solicitações.",
      "Alterações em cadastros existentes podem afetar solicitações em andamento.",
      "A exclusão de um item só é permitida se não houver vínculos ativos.",
    ],
  },
  "/cadastros/produto-cru": {
    title: "Produtos Cru",
    description: "Gerencie os produtos cru (tecidos e malhas) que servem como base para a produção. Cada produto possui composição, estrutura e receitas associadas.",
    rules: [
      "O código do produto segue o padrão 2.KXXXX.CRU.XXXXX gerado automaticamente.",
      "A composição define os materiais (fios) e suas porcentagens.",
      "A estrutura define o tipo de trama, malha ou tecelagem.",
      "Cada produto pode ter múltiplos acabamentos e amostras.",
      "O produto só pode ser ativado se todos os campos obrigatórios estiverem preenchidos.",
    ],
    fields: [
      { name: "Código", desc: "Identificador único gerado automaticamente pelo sistema" },
      { name: "Largura", desc: "Largura do tecido em centímetros" },
      { name: "Composição", desc: "Lista de fios com respectivas porcentagens (deve somar 100%)" },
      { name: "Estrutura", desc: "Tipo de trama: Sarja, Tela, Cetim, etc." },
    ],
  },
  "/cadastros/fios": {
    title: "Fios",
    description: "Cadastro de fios utilizados na composição dos produtos cru. Inclui informações como título, matéria-prima e fornecedores.",
    rules: [
      "O título do fio segue o sistema tex/denier ou Ne (número inglês).",
      "Um fio pode ter múltiplos fornecedores associados.",
      "Fios com composição química especial podem exigir registro FIT.",
    ],
    fields: [
      { name: "Título", desc: "Numeração do fio no sistema têxtil (ex: Ne 30/1)" },
      { name: "Matéria-prima", desc: "Tipo: Algodão, Poliéster, Viscose, etc." },
      { name: "Cor", desc: "Cor do fio (cru, branco, tingido)" },
    ],
  },
  "/cadastros/fornecedores": {
    title: "Fornecedores",
    description: "Cadastro de fornecedores de insumos, fios, produtos químicos e serviços terceirizados.",
    rules: [
      "Fornecedores podem ser vinculados a fios, produtos químicos e receitas.",
      "O cadastro inclui dados fiscais e de contato.",
      "Fornecedores inativos não aparecem nos campos de seleção de novos cadastros.",
    ],
    fields: [
      { name: "Nome", desc: "Razão social do fornecedor" },
      { name: "Tipo", desc: "Categoria: Fio, Químico, Serviço, Transporte" },
    ],
  },
  "/cadastros/bases-urdume": {
    title: "Bases Urdume",
    description: "Gerencie as bases de urdume utilizadas na tecelagem. Cada base define fios e comprimentos para preparação do tear.",
    rules: [
      "A base de urdume define os fios que compõem o comprimento do tecido.",
      "O total de fios e o comprimento são usados para calcular o peso da base.",
      "Bases podem ser reutilizadas em diferentes produtos cru.",
    ],
  },
  "/cadastros/cores": {
    title: "Cores",
    description: "Catálogo de cores utilizadas nos produtos. Cada cor possui um código interno e referência do cliente.",
    rules: [
      "Cores podem ser de fundo ou sólidas.",
      "O código da cor segue a nomenclatura interna da empresa.",
      "Cada cor pode ter uma receita de produto químico associada.",
    ],
  },
  "/cadastros/estampas": {
    title: "Estampas",
    description: "Catálogo de estampas com código, nome e especificações técnicas.",
    rules: [
      "Cada estampa possui um código único e pode ter repetição (rapport) definida.",
      "Estampas podem ser associadas a produtos para produção.",
      "O cadastro inclui informações de cores e dimensões.",
    ],
  },
  "/cadastros/produtos-quimicos": {
    title: "Produtos Químicos",
    description: "Cadastro de produtos químicos utilizados nas receitas de beneficiamento e acabamento.",
    rules: [
      "Produtos químicos podem exigir registro FIT (Ficha de Informação Toxicológica).",
      "O cadastro inclui informações de fornecedor, fabricante e dosagem.",
      "Produtos podem ser categorizados por tipo de uso.",
    ],
  },
  "/amostras": {
    title: "Amostras",
    description: "Lista central de todas as amostras de tecido cru e acabamento registradas no sistema.",
    rules: [
      "Amostras são vinculadas a um produto cru ou a um acabamento específico.",
      "Cada amostra passa por um fluxo de aprovação: PENDENTE → APROVADO ou REPROVADO.",
      "O histórico de status é registrado automaticamente para auditoria.",
      "Amostras aprovadas podem ser usadas como referência para produção.",
    ],
  },
  "/dashboard/relatorios/atividade-usuario": {
    title: "Atividade por Usuário",
    description: "Relatório de auditoria com o registro de todas as ações realizadas por cada usuário no sistema.",
    rules: [
      "Os logs são gerados automaticamente para ações como deleção, erros, logins e cadastros.",
      "O relatório pode ser filtrado por período, usuário e tipo de ação.",
      "Dados históricos são mantidos conforme política de retenção do sistema.",
    ],
  },
  "/dashboard/relatorios/solicitacoes-criadas": {
    title: "Solicitações Criadas / Deletadas",
    description: "Relatório comparativo entre solicitações criadas, deletadas e concluídas, com taxa de sucesso.",
    rules: [
      "A taxa de sucesso é calculada como (concluídas / total criadas) × 100.",
      "Solicitações deletadas são contabilizadas a partir dos logs do sistema.",
      "O gráfico mensal permite visualizar a evolução ao longo do tempo.",
    ],
  },
  "/dashboard/relatorios/tempo-status": {
    title: "Tempo em cada Status",
    description: "Relatório detalhado do tempo que cada solicitação permaneceu em cada status do fluxo.",
    rules: [
      "O cálculo do tempo é baseado no histórico de comunicação da solicitação.",
      "O status atual conta o tempo até o momento presente (se não concluído).",
      "A barra proporcional facilita a visualização de gargalos.",
    ],
  },
  "/dashboard/relatorios/tempo-status-amostras": {
    title: "Tempo em cada Status (Amostras)",
    description: "Relatório de tempo por status específico para amostras de tecido cru e acabamento.",
    rules: [
      "O histórico é extraído da coluna historico (JSONB) de cada amostra.",
      "Amostras sem histórico registrado não aparecem no relatório.",
      "As abas separam amostras de tecido cru e acabamento.",
    ],
  },
  "/admin/usuarios": {
    title: "Usuários",
    description: "Gerenciamento de usuários do sistema. Controle de acesso, perfis e permissões.",
    rules: [
      "Apenas usuários ADMIN e SUDO podem gerenciar usuários.",
      "O perfil (role) define as permissões de acesso no sistema.",
      "Usuários podem ser ativados ou desativados sem perder o histórico.",
      "O email deve ser único no sistema.",
    ],
  },
  "/admin/roles": {
    title: "Perfis (Roles)",
    description: "Gerenciamento dos perfis de acesso do sistema. Crie e configure permissões para cada perfil.",
    rules: [
      "Cada perfil define um conjunto de permissões (CRUD) por entidade.",
      "Perfis não podem ser excluídos se houver usuários vinculados.",
      "Alterações em perfis afetam todos os usuários daquele perfil imediatamente.",
    ],
  },
  "/admin/email-massa": {
    title: "Email em Massa",
    description: "Ferramenta de disparo de emails em massa para usuários e notificações do sistema.",
    rules: [
      "Os destinatários são definidos por perfil/role.",
      "O envio é registrado em log para auditoria.",
      "Apenas administradores podem disparar emails em massa.",
    ],
  },
  "/admin/configuracoes": {
    title: "Configurações",
    description: "Configurações gerais do sistema como integrações, emails e parâmetros operacionais.",
    rules: [
      "Alterações em configurações de integração podem afetar a comunicação com sistemas externos.",
      "Configurações de email afetam o envio de notificações.",
      "Apenas usuários ADMIN podem alterar configurações.",
    ],
  },
  "/admin/configuracoes/permissoes": {
    title: "Permissões",
    description: "Configuração detalhada de permissões de acesso por entidade e ação para cada perfil.",
    rules: [
      "As permissões são do tipo CRUD (Criar, Ler, Atualizar, Deletar) por entidade.",
      "Permissões são aplicadas imediatamente após salvas.",
      "Apenas usuários SUDO podem configurar permissões.",
    ],
  },
  "/perfil": {
    title: "Meu Perfil",
    description: "Visualização e edição dos seus dados de usuário, incluindo nome, email e senha.",
    rules: [
      "Você pode alterar seu nome, email e senha.",
      "O email deve ser único no sistema.",
      "A alteração de senha requer confirmação da senha atual.",
    ],
  },
}

export function getInfoContent(pathname: string): InfoContent | null {
  const exact = infoContent[pathname]
  if (exact) return exact

  const match = Object.keys(infoContent).find(
    (key) => pathname.startsWith(key) || key.startsWith(pathname)
  )
  if (match) return infoContent[match]

  return null
}
