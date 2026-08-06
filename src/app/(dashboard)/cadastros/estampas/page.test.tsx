// @vitest-environment jsdom
import EstampasPage from "./page"
import { listPageSpec } from "@/test/list-page-spec"

listPageSpec({
  title: "EstampasPage",
  component: <EstampasPage />,
  apiBase: "estampas",
  heading: "Estampas",
  searchPlaceholder: "Buscar por nome, código...",
  emptyText: "Nenhuma estampa encontrada",
  newLinkText: "Nova Estampa",
  newHref: "/cadastros/estampas/novo",
  editHref: (item) => `/cadastros/estampas/${item.id}`,
  primaryField: "codigoDesenho",
  data: [
    {
      id: 1,
      codigoDesenho: "5001",
      variante: "01",
      nome: "Floral Botânico",
      tipo: "FLORAL",
      imagemUrl: null,
      idIntegracao: "ERP-001",
      ativo: true,
    },
    {
      id: 2,
      codigoDesenho: "5002",
      variante: "02",
      nome: "Listras Clássicas",
      tipo: "LISTRADO",
      imagemUrl: null,
      idIntegracao: null,
      ativo: false,
    },
  ],
  blockedId: 2,
  successToast: "Estampa excluída com sucesso",
  deleteSingular: "estampa",
  matchQuery: "floral",
  firstItemText: "5001",
  secondItemText: "Listras Clássicas",
})
