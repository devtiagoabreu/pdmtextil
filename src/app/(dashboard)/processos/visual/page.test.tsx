// @vitest-environment jsdom
import ProcessoVisualPage from "./page"
import { listPageSpec } from "@/test/list-page-spec"

listPageSpec({
  title: "ProcessoVisualPage",
  component: <ProcessoVisualPage />,
  apiBase: "diagramas",
  apiPrefix: "/api/processos",
  heading: "Diagramas",
  searchPlaceholder: "Buscar por nome, tipo ou descrição...",
  emptyText: "Nenhum diagrama encontrado",
  newLinkText: "Novo Diagrama",
  newHref: "/processos/visual/novo",
  editHref: (item) => `/processos/visual/${item.id}`,
  primaryField: "nome",
  data: [
    {
      id: 1,
      nome: "Fluxograma de recebimento",
      tipo: "FLUXOGRAMA",
      descricao: "Recebimento de matéria-prima",
      ativo: true,
    },
    {
      id: 2,
      nome: "Mapa de conferência",
      tipo: "MAPAMENTAL",
      descricao: null,
      ativo: false,
    },
  ],
  blockedId: 2,
  successToast: "Diagrama excluído com sucesso",
  deleteSingular: "diagrama",
  matchQuery: "recebimento",
  firstItemText: "Fluxograma de recebimento",
  secondItemText: "Mapa de conferência",
})