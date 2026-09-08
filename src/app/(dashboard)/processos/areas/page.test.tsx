// @vitest-environment jsdom
import ProcessoAreasPage from "./page"
import { listPageSpec } from "@/test/list-page-spec"

listPageSpec({
  title: "ProcessoAreasPage",
  component: <ProcessoAreasPage />,
  apiBase: "areas",
  apiPrefix: "/api/processos",
  heading: "Áreas",
  searchPlaceholder: "Buscar por nome, site ou descrição...",
  emptyText: "Nenhuma área encontrada",
  newLinkText: "Nova Área",
  newHref: "/processos/areas/novo",
  editHref: (item) => `/processos/areas/${item.id}`,
  primaryField: "nome",
  data: [
    {
      id: 1,
      siteId: 1,
      siteNome: "Unidade Blumenau",
      nome: "Produção",
      descricao: "Linha de produção principal",
      ativo: true,
    },
    {
      id: 2,
      siteId: 2,
      siteNome: "Unidade São Paulo",
      nome: "Administrativo",
      descricao: null,
      ativo: false,
    },
  ],
  blockedId: 2,
  successToast: "Área excluída com sucesso",
  deleteSingular: "área",
  matchQuery: "produção",
  firstItemText: "Produção",
  secondItemText: "Administrativo",
})