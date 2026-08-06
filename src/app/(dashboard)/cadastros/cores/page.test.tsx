// @vitest-environment jsdom
import CoresPage from "./page"
import { listPageSpec } from "@/test/list-page-spec"

listPageSpec({
  title: "CoresPage",
  component: <CoresPage />,
  apiBase: "cores",
  heading: "Cores Sólidas",
  searchPlaceholder: "Buscar por nome, código, pantone...",
  emptyText: "Nenhuma cor encontrada",
  newLinkText: "Nova Cor",
  newHref: "/cadastros/cores/novo",
  editHref: (item) => `/cadastros/cores/${item.id}`,
  primaryField: "codigo",
  data: [
    {
      id: 1,
      codigo: "0001A1",
      nome: "Azul Marinho",
      pantone: "2955C",
      familia: "AZUL",
      idIntegracao: "ERP-001",
      ativo: true,
    },
    {
      id: 2,
      codigo: "0002B2",
      nome: "Vermelho Tomate",
      pantone: null,
      familia: "VERMELHO",
      idIntegracao: null,
      ativo: false,
    },
  ],
  blockedId: 2,
  successToast: "Cor excluída com sucesso",
  deleteSingular: "cor",
  matchQuery: "marinho",
  firstItemText: "0001A1",
  secondItemText: "Vermelho Tomate",
})
