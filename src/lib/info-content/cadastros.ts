import type { InfoContent } from "./types"

export const cadastrosContent: Record<string, InfoContent> = {
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
    title: "Produtos",
    description: "Gerencie os produtos (tecidos e malhas) que servem como base para a produção. Cada produto possui composição, estrutura e receitas associadas.",
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
  "/cadastros/representantes": {
    title: "Representantes",
    description: "Gerencie os representantes comerciais cadastrados no sistema.",
    fields: [
      { name: "Nome", desc: "Nome fantasia do representante" },
      { name: "CNPJ", desc: "CNPJ do representante" },
      { name: "Email", desc: "Email de contato" },
      { name: "Telefone", desc: "Telefone de contato" },
      { name: "Status", desc: "Se o representante está ativo ou inativo" },
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
  "/cadastros/receitas": {
    title: "Receitas",
    description: "Cadastro de receitas técnicas de beneficiamento e acabamento para produtos têxteis.",
    rules: [
      "Receitas podem ser de acabamento (produto final) ou de amostra (teste).",
      "Cada receita lista os produtos químicos com suas respectivas dosagens.",
      "A receita de amostra pode ser duplicada para criar uma receita de produção.",
    ],
    fields: [
      { name: "Tipo", desc: "Acabamento ou Amostra" },
      { name: "Produtos", desc: "Lista de produtos químicos com concentração e ordem" },
    ],
  },
}
