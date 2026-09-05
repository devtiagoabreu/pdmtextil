import type { InfoContent } from "./types"

export const adminContent: Record<string, InfoContent> = {
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
    description: "Ferramenta de disparo, gestão de modelos e listas, histórico e dashboard de campanhas de email.",
    rules: [
      "Os destinatários podem ser: todos (clientes + utilizadores), apenas clientes, apenas utilizadores do sistema, ou listas personalizadas.",
      "O modo de envio define se o email vai como Cópia Oculta (BCC), Para (TO), ou Individual com placeholder [NOME].",
      "O remetente pode ser o SMTP padrão do sistema, uma configuração de email pessoal do utilizador (Meu Email) ou o SMTP do CRM.",
      "O editor WYSIWYG suporta formatação de texto (negrito, itálico, sublinhado, tachado), alinhamento, listas, fontes, cores, links e imagens com posicionamento (inline, flutuante, livre, z-index).",
      "O conteúdo do editor é convertido automaticamente para um formato estruturado de blocos JSON ao guardar modelos, preservando headings, alinhamento, fontes e cores.",
      "Modelos de email podem ser salvos, editados, visualizados e reutilizados. O formato estruturado garante compatibilidade com o editor.",
      "Listas de destinatários permitem gestão de contactos com importação CSV/JSON e importação via API de sistemas externos.",
      "O histórico regista cada envio com status (enviado, lido, falhou), data/hora e cliques em links.",
      "O dashboard exibe relatórios por remessa com taxa de abertura, cliques por link e percentagens.",
      "É possível exportar relatório PDF do histórico com estatísticas e tabela detalhada.",
      "O tracking de abertura e cliques é feito por pixel invisível e redirecionamento de links.",
      "Os perfis Administrador e Gestão de Relacionamento com o Cliente têm acesso total a todas as funcionalidades.",
    ],
    fields: [
      { name: "Enviar para", desc: "Destinatários: Todos, Clientes, Utilizadores ou Lista personalizada" },
      { name: "Assunto", desc: "Linha de assunto do email" },
      { name: "Selecionar Listas", desc: "Escolha uma ou mais listas de contactos (visível apenas com destino Lista)" },
      { name: "Remetente", desc: "SMTP do sistema, configuração de email pessoal (Meu Email) ou SMTP do CRM" },
      { name: "Modo de Envio", desc: "BCC (oculto), TO (visível) ou Individual com personalização [NOME]" },
      { name: "Modelos Rápidos", desc: "Atalhos para carregar modelos salvos diretamente no editor" },
      { name: "Editor WYSIWYG", desc: "Editor de conteúdo rico: formatação, alinhamento, fontes, cores, links, imagens" },
      { name: "Modelos", desc: "Gestão de modelos: guardar, editar, visualizar e apagar" },
      { name: "Listas", desc: "Gestão de listas de contactos com importação CSV/JSON e API" },
      { name: "Histórico", desc: "Registo de envios com status, tracking de abertura e cliques, busca e relatório PDF" },
      { name: "Dashboard", desc: "Relatório de remessas com taxas de abertura e cliques por link" },
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
  "/admin/configuracoes/banco-dados": {
    title: "Banco de Dados",
    description: "Gerenciamento de servidores PostgreSQL: criação, clonagem e redundância de bancos de dados.",
    rules: [
      "A string de conexão deve apontar para o servidor (ex: postgresql://user:pass@host:5432/postgres).",
      "Apenas conexões ativas podem ser usadas nas operações de criar/clonar/redundância.",
      "Clone no mesmo servidor usa CREATE DATABASE WITH TEMPLATE — requer que a origem não tenha conexões ativas.",
      "Redundância usa replicação lógica (PUBLICATION + SUBSCRIPTION).",
    ],
  },
  "/admin/configuracoes/empresa": {
    title: "Empresa",
    description: "Dados cadastrais da empresa e configuração de logo para relatórios e exportações PDF.",
    rules: [
      "Os dados da empresa são utilizados em relatórios e exportações (PDF, CSV, JSON).",
      "O logo deve ser uma URL pública acessível (Google Drive, imagens da web).",
      "A empresa marcada como padrão é usada automaticamente nas exportações.",
      "Apenas usuários ADMIN podem gerenciar empresas.",
    ],
  },
  "/admin/configuracoes/integracoes": {
    title: "Integrações",
    description: "Configuração de conexões com sistemas externos (ERP, APIs, WMS). Cada integração define como o sistema se autentica e comunica com serviços externos.",
    rules: [
      "O campo Base URL define o endpoint base para todas as requisições.",
      "O tipo de autenticação define como o sistema se identifica (Bearer, Basic, OAuth2, API Key).",
      "O campo auth_config é um JSON dinâmico que varia conforme o tipo de autenticação.",
      "Integrações inativas não podem ser utilizadas nas operações do sistema.",
      "Apenas usuários ADMIN podem gerenciar integrações.",
    ],
  },
  "/admin/configuracoes/email": {
    title: "Configuração de Email",
    description: "Unificação do SMTP do sistema, email por usuário e email do CRM em uma única tela.",
    rules: [
      "A aba SMTP Sistema define o servidor usado por notificações do sistema, menções no chat e envio em massa com remetente sistema.",
      "A aba Email por Usuário configura o SMTP pessoal de cada usuário, usado no envio em massa quando o remetente é o usuário.",
      "A aba SMTP CRM define o servidor usado pelo envio automático de pesquisas de satisfação do CRM e pelo envio em massa quando o remetente é o CRM; se não configurado, usa o SMTP do sistema.",
      "Recomenda-se utilizar portas 587 (STARTTLS) ou 465 (SSL/TLS).",
      "Teste o envio após configurar para validar as credenciais.",
      "Apenas usuários ADMIN podem alterar configurações.",
    ],
  },
  "/admin/notificacoes": {
    title: "Notificações por Tipo",
    description: "Configure quais perfis (roles) recebem notificações para cada tipo de evento do sistema.",
    rules: [
      "Cada tipo de notificação pode ser atribuído a um ou mais perfis.",
      "As notificações são exibidas no ícone de sino no cabeçalho.",
      "Alterações são aplicadas imediatamente após salvar.",
    ],
    fields: [
      { name: "Tipo", desc: "Categoria do evento que gera a notificação" },
      { name: "Perfis", desc: "Selecione um ou mais perfis que devem receber a notificação" },
    ],
  },
  "/admin/bot-config": {
    title: "Config Bot WhatsApp",
    description:
      "Define quais usuários recebem o contato quando o bot de atendimento do WhatsApp identifica um novo lead (pessoa física ou jurídica) e acompanha a saúde do bot (conexão com a instância da Evolution API). Utilizado pelo bot no momento do encaminhamento e na notificação por e-mail.",
    rules: [
      "Apenas usuários ADMIN e SUDO podem alterar a configuração.",
      "A seleção é separada por tipo de pessoa: PF e PJ.",
      "Quando não há ninguém configurado, o bot mantém o comportamento anterior (notifica todos os usuários ativos com celular WhatsApp).",
      "O e-mail é enviado para o e-mail cadastrado dos usuários configurados.",
      "O monitoramento roda 1x ao dia no cron da Vercel e pode ser acionado manualmente em Verificar agora.",
      "O alerta de instância fora do ar é enviado por e-mail e/ou notificação no PDM apenas para ADMIN e SUDO, e só é reenviado quando o bot volta e cai de novo (sem spam).",
      "O log guarda o histórico de tudo que acontece com o bot: monitoramento, alertas, fila, retry e leads criados.",
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
}
