// @vitest-environment jsdom
import FornecedoresPage from "./page"
import { listPageSpec } from "@/test/list-page-spec"

listPageSpec({
  title: "FornecedoresPage",
  component: <FornecedoresPage />,
  apiBase: "fornecedores",
  heading: "Fornecedores",
  searchPlaceholder: "Buscar por nome, CNPJ ou email...",
  emptyText: "Nenhum fornecedor encontrado",
  newLinkText: "Novo Fornecedor",
  newHref: "/cadastros/fornecedores/novo",
  editHref: (item) => `/cadastros/fornecedores/${item.id}`,
  primaryField: "nome",
  data: [
    {
      id: 1,
      nome: "Tecidos Silva",
      cnpj: "11.222.333/0001-44",
      email: "contato@tecidos.com",
      telefone: "(11) 4000-0000",
      cidade: "São Paulo",
      uf: "SP",
      idIntegracao: "ERP-001",
      ativo: true,
    },
    {
      id: 2,
      nome: "Química Alfa",
      cnpj: "55.666.777/0001-88",
      email: "vendas@quimicaalfa.com",
      telefone: "(11) 5555-9999",
      cidade: "Campinas",
      uf: "SP",
      idIntegracao: null,
      ativo: false,
    },
  ],
  blockedId: 2,
  successToast: "Fornecedor excluído com sucesso",
  deleteSingular: "fornecedor",
  matchQuery: "silva",
  firstItemText: "Tecidos Silva",
  secondItemText: "Química Alfa",
})
