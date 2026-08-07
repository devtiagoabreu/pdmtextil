// @vitest-environment jsdom
import RepresentantesPage from "./page"
import { listSmokeSpec } from "@/test/list-smoke-spec"

listSmokeSpec({
  title: "RepresentantesComercialPage",
  component: <RepresentantesPage />,
  apiUrl: "/api/representantes",
  heading: "Representantes",
  emptyText: "Nenhum representante encontrado",
  searchPlaceholder: "Buscar por nome, CNPJ, razão social ou cidade...",
  newLinkText: "Novo Representante",
  newHref: "/comercial/representantes/novo",
  editHref: (item) => `/comercial/representantes/${item.id}`,
  editLinkText: "Editar",
  primaryField: "nome",
  data: [
    {
      id: 1,
      nome: "Rep João",
      cnpj: "11.222.333/0001-44",
      razaoSocial: "João Representações",
      email: "joao@reps.com",
      telefone: "(11) 4000-0000",
      cidade: "São Paulo",
      uf: "SP",
    },
    {
      id: 2,
      nome: "Rep Maria",
      cnpj: "55.666.777/0001-88",
      razaoSocial: "Maria Representações",
      email: "maria@reps.com",
      telefone: "(11) 5555-9999",
      cidade: "Campinas",
      uf: "SP",
    },
  ],
  firstItemText: "Rep João",
  secondItemText: "Rep Maria",
  matchQuery: "joão",
})
