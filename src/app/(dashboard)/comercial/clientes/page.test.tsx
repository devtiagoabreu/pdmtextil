// @vitest-environment jsdom
import ClientesPage from "./page"
import { listSmokeSpec } from "@/test/list-smoke-spec"

listSmokeSpec({
  title: "ClientesComercialPage",
  component: <ClientesPage />,
  apiUrl: "/api/clientes",
  heading: "Clientes",
  emptyText: "Nenhum cliente encontrado",
  searchPlaceholder: "Buscar por nome, CNPJ, razão social, contato, email, telefone ou cidade...",
  newLinkText: "Novo Cliente",
  newHref: "/comercial/clientes/novo",
  editHref: (item) => `/comercial/clientes/${item.id}`,
  editLinkText: "Editar",
  primaryField: "nome",
  data: [
    {
      id: 1,
      nome: "Tecidos Silva",
      cnpj: "11.222.333/0001-44",
      razaoSocial: "Tecidos Silva Ltda",
      email: "contato@tecidos.com",
      telefone: "(11) 4000-0000",
      cidade: "São Paulo",
      uf: "SP",
    },
    {
      id: 2,
      nome: "Química Alfa",
      cnpj: "55.666.777/0001-88",
      razaoSocial: "Química Alfa S/A",
      email: "vendas@quimicaalfa.com",
      telefone: "(11) 5555-9999",
      cidade: "Campinas",
      uf: "SP",
    },
  ],
  firstItemText: "Tecidos Silva",
  secondItemText: "Química Alfa",
  matchQuery: "silva",
})
