// @vitest-environment jsdom
import CrmContatosPage from "./page"
import { listSmokeSpec } from "@/test/list-smoke-spec"

listSmokeSpec({
  title: "ContatosPage",
  component: <CrmContatosPage />,
  apiUrl: "/api/crm/contatos",
  heading: "Contatos",
  emptyText: "Nenhum contato encontrado",
  searchPlaceholder: "Buscar contatos...",
  newLinkText: "Novo Contato",
  newHref: "/comercial/crm/contatos/novo",
  editHref: (item) => `/comercial/crm/contatos/${item.id}`,
  primaryField: "nome",
  data: [
    {
      id: 1,
      nome: "Carlos Silva",
      cargo: "Comprador",
      email: "carlos@alpha.com",
      celular: "(11) 90000-0000",
      empresaId: 1,
      empresaRazaoSocial: "Tecelagem Alpha",
      principal: true,
      createdAt: "2026-07-01T10:00:00Z",
    },
    {
      id: 2,
      nome: "Ana Souza",
      cargo: null,
      email: null,
      celular: null,
      empresaId: 2,
      empresaNomeFantasia: "Beta Confecções",
      principal: false,
      createdAt: "2026-07-02T10:00:00Z",
    },
  ],
  firstItemText: "Carlos Silva",
  secondItemText: "Ana Souza",
  matchQuery: "Silva",
})
