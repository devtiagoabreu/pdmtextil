// @vitest-environment jsdom
import ProcessoEmpresasPage from "./page"
import { listPageSpec } from "@/test/list-page-spec"

listPageSpec({
  title: "ProcessoEmpresasPage",
  component: <ProcessoEmpresasPage />,
  apiBase: "empresas",
  apiPrefix: "/api/processos",
  heading: "Empresas",
  searchPlaceholder: "Buscar por nome, CNPJ ou segmento...",
  emptyText: "Nenhuma empresa encontrada",
  newLinkText: "Nova Empresa",
  newHref: "/processos/empresas/novo",
  editHref: (item) => `/processos/empresas/${item.id}`,
  primaryField: "nome",
  data: [
    {
      id: 1,
      nome: "PDM Têxtil",
      cnpj: "12.345.678/0001-90",
      segmento: "Têxtil",
      observacoes: null,
      ativo: true,
    },
    {
      id: 2,
      nome: "PDM Ibirapuera",
      cnpj: "98.765.432/0001-10",
      segmento: "Confecção",
      observacoes: null,
      ativo: false,
    },
  ],
  blockedId: 2,
  successToast: "Empresa excluída com sucesso",
  deleteSingular: "empresa",
  matchQuery: "têxtil",
  firstItemText: "PDM Têxtil",
  secondItemText: "PDM Ibirapuera",
})