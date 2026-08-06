// @vitest-environment jsdom
import ProdutoCruPage from "./page"
import { listPageSpec } from "@/test/list-page-spec"

listPageSpec({
  title: "ProdutoCruPage",
  component: <ProdutoCruPage />,
  apiBase: "produto-cru",
  heading: "Produtos",
  searchPlaceholder: "Buscar por código, descrição...",
  emptyText: "Nenhum produto encontrado",
  newLinkText: "Novo Produto",
  newHref: "/cadastros/produto-cru/novo",
  editHref: (item) => `/cadastros/produto-cru/${item.id}`,
  primaryField: "codigoPdm",
  data: [
    {
      id: 1,
      codigoPdm: "PDM-0001",
      descricao: "Malha Piquet 100% algodão",
      status: "APROVADO",
      idIntegracaoErpCru: "ERP-001",
      ativo: true,
      createdAt: "2026-01-01",
      chatExists: true,
    },
    {
      id: 2,
      codigoPdm: "PDM-0002",
      descricao: "Sarja twill poliéster",
      status: "DESENVOLVIMENTO",
      idIntegracaoErpCru: null,
      ativo: false,
      createdAt: "2026-01-02",
      chatExists: false,
    },
  ],
  blockedId: 2,
  successToast: "Produto excluído com sucesso",
  deleteSingular: "produto",
  matchQuery: "piquet",
  firstItemText: "PDM-0001",
  secondItemText: "Sarja twill poliéster",
})
