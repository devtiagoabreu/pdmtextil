// @vitest-environment jsdom
import ProdutosQuimicosPage from "./page"
import { listPageSpec } from "@/test/list-page-spec"

listPageSpec({
  title: "ProdutosQuimicosPage",
  component: <ProdutosQuimicosPage />,
  apiBase: "produtos-quimicos",
  heading: "Produtos Químicos",
  searchPlaceholder: "Buscar por código, nome...",
  emptyText: "Nenhum produto químico encontrado",
  newLinkText: "Novo",
  newHref: "/cadastros/produtos-quimicos/novo",
  editHref: (item) => `/cadastros/produtos-quimicos/${item.id}`,
  primaryField: "codigo",
  data: [
    {
      id: 1,
      codigo: "QUI-001",
      nome: "Soda Cáustica",
      descricao: "Hidróxido de sódio",
      categoria: "Alcalino",
      unidadePadrao: "KG",
      idIntegracao: "ERP-001",
      ativo: true,
    },
    {
      id: 2,
      codigo: "QUI-002",
      nome: "Ácido Acético",
      descricao: null,
      categoria: "Ácido",
      unidadePadrao: "L",
      idIntegracao: null,
      ativo: false,
    },
  ],
  blockedId: 2,
  successToast: "Produto químico excluído com sucesso",
  deleteSingular: "produto químico",
  matchQuery: "soda",
  firstItemText: "QUI-001",
  secondItemText: "Ácido Acético",
})
