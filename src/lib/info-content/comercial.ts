import type { InfoContent } from "./types"

export const comercialContent: Record<string, InfoContent> = {
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
  "/comercial/requisicoes-amostra-comercial": {
    title: "Requisições de Amostra Comercial",
    description: "Lista de requisições de amostra comercial. Gerencie solicitações de amostras para clientes, vinculadas a produtos cadastrados.",
    rules: [
      "Cada requisição deve estar vinculada a um produto existente.",
      "O título é obrigatório; os demais campos são opcionais.",
      "O status é gerenciado pelo fluxo configurado em AMOSTRA_COMERCIAL.",
      "Apenas perfis COMERCIAL, DESENVOLVIMENTO, PCP, ADMIN ou SUDO podem mover cards no kanban.",
      "Ao aprovar ou reprovar, um motivo deve ser informado.",
    ],
    fields: [
      { name: "Produto", desc: "Produto vinculado à requisição (autocomplete)" },
      { name: "Título", desc: "Identificação da requisição" },
      { name: "Status", desc: "Etapa atual no fluxo de amostra comercial" },
    ],
  },
  "/comercial/requisicoes-amostra-comercial/novo": {
    title: "Nova Requisição de Amostra Comercial",
    description: "Formulário de criação de uma nova requisição de amostra comercial.",
    rules: [
      "Selecione um produto existente.",
      "O título é obrigatório.",
      "O prazo desejado pode ser informado para controle de prioridade.",
      "Após criar, a requisição aparecerá na lista e kanban.",
    ],
  },
  "/comercial/requisicoes-amostra-comercial/kanban": {
    title: "Kanban — Amostras Comerciais",
    description: "Quadro kanban para gerenciar requisições de amostra comercial com drag-and-drop.",
    rules: [
      "Arraste os cards entre colunas para alterar o status.",
      "Status APROVADO/REPROVADO exigem motivo obrigatório.",
      "Apenas COMERCIAL, DESENVOLVIMENTO, PCP, ADMIN e SUDO podem arrastar cards.",
    ],
  },
  "/comercial/requisicoes-corte": {
    title: "Requisições de Corte",
    description: "Gerencie as requisições de corte de produtos. Uma requisição pode conter múltiplos itens (cortes) para diferentes produtos.",
    rules: [
      "Cada requisição pode ter vários itens de corte, cada um com seu próprio produto, ordem e quantidade.",
      "Status disponíveis: Solicitado → Processando → Atendido.",
      "Apenas o requisitante e usuários COMERCIAIS podem alterar o status.",
      "Para excluir, é necessário ser o requisitante ou ter permissão COMERCIAL.",
    ],
  },
  "/comercial/requisicoes-corte/por-romaneio": {
    title: "Requisição de Corte por Romaneio",
    description: "Crie requisições de corte a partir de romaneios de expedição. Selecione um romaneio, informe a metragem desejada para cada produto e crie a requisição automaticamente.",
    rules: [
      "Os romaneios são carregados da integração configurada para a tela com o nome desta página.",
      "Cada romaneio exibe os produtos disponíveis com suas respectivas metragens.",
      "Informe a metragem desejada para cada produto e clique em 'Criar Requisição de Corte'.",
      "A requisição será criada com status SOLICITADO e redirecionada automaticamente.",
      "Campos do romaneio são mapeados: produto → código do produto, ordem → pedido, cor → cor, narrativa → artigo.",
    ],
  },
}
