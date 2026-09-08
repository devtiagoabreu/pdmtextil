// @vitest-environment jsdom
import ProcessoSitesPage from "./page"
import { listPageSpec } from "@/test/list-page-spec"

listPageSpec({
  title: "ProcessoSitesPage",
  component: <ProcessoSitesPage />,
  apiBase: "sites",
  apiPrefix: "/api/processos",
  heading: "Sites",
  searchPlaceholder: "Buscar por nome, sigla ou cidade...",
  emptyText: "Nenhum site encontrado",
  newLinkText: "Novo Site",
  newHref: "/processos/sites/novo",
  editHref: (item) => `/processos/sites/${item.id}`,
  primaryField: "nome",
  data: [
    {
      id: 1,
      empresaId: 1,
      empresaNome: "PDM Têxtil",
      nome: "Unidade Blumenau",
      sigla: "SBLU",
      cep: "89000-000",
      endereco: "Rua das Fábricas, 100",
      cidade: "Blumenau",
      uf: "SC",
      ativo: true,
    },
    {
      id: 2,
      empresaId: 2,
      empresaNome: "PDM Ibirapuera",
      nome: "Unidade São Paulo",
      sigla: "SSP",
      cep: "04000-000",
      endereco: "Av. Ibirapuera, 300",
      cidade: "São Paulo",
      uf: "SP",
      ativo: false,
    },
  ],
  blockedId: 2,
  successToast: "Site excluído com sucesso",
  deleteSingular: "site",
  matchQuery: "blumenau",
  firstItemText: "Unidade Blumenau",
  secondItemText: "Unidade São Paulo",
})