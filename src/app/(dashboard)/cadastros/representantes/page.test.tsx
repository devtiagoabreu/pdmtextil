// @vitest-environment jsdom
import RepresentantesPage from "./page"
import { listPageSpec } from "@/test/list-page-spec"

listPageSpec({
  title: "RepresentantesPage",
  component: <RepresentantesPage />,
  apiBase: "representantes",
  heading: "Representantes",
  searchPlaceholder: "Buscar por nome, CNPJ ou email...",
  emptyText: "Nenhum representante encontrado",
  newLinkText: "Novo Representante",
  newHref: "/comercial/representantes/novo",
  editHref: (item) => `/comercial/representantes/${item.id}`,
  primaryField: "nome",
  data: [
    {
      id: 1,
      nome: "Carlos Mendes",
      cnpj: "30.300.400/0001-50",
      email: "carlos@rep.com",
      telefone: "(11) 91000-0000",
      cidade: "São Paulo",
      uf: "SP",
      idIntegracao: "ERP-001",
      ativo: true,
    },
    {
      id: 2,
      nome: "Ana Paula Reis",
      cnpj: "40.400.500/0001-60",
      email: "ana@rep.com",
      telefone: "(11) 92000-0000",
      cidade: "Campinas",
      uf: "SP",
      idIntegracao: null,
      ativo: false,
    },
  ],
  blockedId: 2,
  successToast: "Representante excluído com sucesso",
  deleteSingular: "representante",
  matchQuery: "mendes",
  firstItemText: "Carlos Mendes",
  secondItemText: "Ana Paula Reis",
})
