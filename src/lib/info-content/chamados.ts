import type { InfoContent } from "./types"

export const chamadosContent: Record<string, InfoContent> = {
  "/chamados": {
    title: "Chamados",
    description:
      "Atendimento de chamados de TI e manutenção com filas, SLAs e acompanhamento. Abra chamados, acompanhe a resposta, responda na thread e acompanhe os prazos de primeira resposta e resolução.",
    rules: [
      "Qualquer usuário autenticado pode abrir, visualizar e responder chamados.",
      "A fila do chamado é definida por um setor (proc_areas), opcionalmente com ativo e processo vinculados.",
      "Chamados podem ser auto-atribuídos ou designados a um responsável; fechar/reabrir/cancelar substituem a exclusão.",
      "O SLA de primeira resposta é medido em horas úteis; o de resolução, em horas corridas conforme a prioridade.",
    ],
    fields: [
      { name: "Chamado", desc: "Solicitação com título, descrição, categoria, prioridade e fila" },
      { name: "Fila", desc: "Setor responsável pelo atendimento (proc_areas)" },
      { name: "Responsável", desc: "Usuário designado ou que assumiu o chamado" },
      {
        name: "SLA",
        desc: "Prazo de primeira resposta (horas úteis) e de resolução (horas corridas)",
      },
      { name: "Mensagens", desc: "Thread com respostas, notas internas e mensagens do sistema" },
    ],
    examples: [
      {
        title: "Abrir um chamado",
        desc: "Clique em 'Novo Chamado', preencha título, descrição, categoria, prioridade e fila. O chamado entra na fila e o SLA começa a contar.",
      },
      {
        title: "Acompanhar o SLA",
        desc: "No detalhe do chamado, veja os prazos de primeira resposta e resolução. Mensagens automáticas do sistema registram estouros de prazo.",
      },
    ],
  },
  "/chamados/novo": {
    title: "Novo Chamado",
    description:
      "Abra um novo chamado de TI ou manutenção informando título, descrição, categoria, prioridade e fila de atendimento.",
    rules: [
      "A fila é obrigatória e vem do cadastro de áreas de processos.",
      "O vínculo com ativo e processo é opcional, mas ajuda no rastreio.",
      "Anexos são aceitos por link externo.",
    ],
  },
  "/chamados/dashboard": {
    title: "Dashboard Chamados",
    description:
      "Visão consolidada de chamados: totais, distribuição por status, prioridade e fila, além dos chamados mais recentes.",
    rules: [
      "O dashboard é somente leitura — para atender, abra um chamado no detalhe.",
      "Chamados abertos e com SLA estourado merecem atenção prioritária.",
    ],
  },
  "/chamados/categorias": {
    title: "Categorias de Chamado",
    description:
      "Cadastro das categorias (tipos) de chamado usadas na abertura, na edição e nos filtros da lista.",
    rules: [
      "O código é gravado no chamado; deve ser único e sem espaços (virou com LETRAS MAIÚSCULAS e _).",
      "Renomear o código atualiza automaticamente os chamados que já usavam a categoria antiga.",
      "Categorias inativas somem dos selects de abertura/edição, mas continuam visíveis no filtro e no histórico.",
      "A exclusão só é permitida quando não há chamado vinculado.",
    ],
    fields: [
      { name: "Código", desc: "Identificador gravado em tickets.categoria (até 40 caracteres)" },
      { name: "Nome", desc: "Rótulo exibido nos selects, badges e dashboards" },
      { name: "Cor", desc: "Paleta da badge (red, blue, amber, emerald, slate, ...)" },
      { name: "Ordem", desc: "Posição de exibição nos selects" },
    ],
  },
  "/chamados/categorias/novo": {
    title: "Nova Categoria de Chamado",
    description: "Cria uma nova categoria de chamado com código, nome, cor, ordem e situação.",
    rules: [
      "Código e nome são obrigatórios.",
      "A cor define a badge usada na lista, no detalhe e no dashboard.",
    ],
  },
}