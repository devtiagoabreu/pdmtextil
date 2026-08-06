// @vitest-environment jsdom
import ClientesPage from "./page"
import { listPageSpec } from "@/test/list-page-spec"

listPageSpec({
  title: "ClientesPage",
  component: <ClientesPage />,
  apiBase: "clientes",
  heading: "Clientes",
  searchPlaceholder: "Buscar por nome, CNPJ ou email...",
  emptyText: "Nenhum cliente encontrado",
  newLinkText: "Novo Cliente",
  newHref: "/comercial/clientes/novo",
  editHref: (item) => `/comercial/clientes/${item.id}`,
  primaryField: "nome",
  data: [
    {
      id: 1,
      nome: "Confecções Aurora",
      cnpj: "10.100.200/0001-30",
      email: "contato@aurora.com",
      telefone: "(11) 3000-0000",
      cidade: "São Paulo",
      uf: "SP",
      idIntegracao: "ERP-001",
      ativo: true,
    },
    {
      id: 2,
      nome: "Malharia Bela",
      cnpj: "20.200.300/0001-40",
      email: "vendas@belamalhas.com",
      telefone: "(11) 3500-5000",
      cidade: "Guarulhos",
      uf: "SP",
      idIntegracao: null,
      ativo: false,
    },
  ],
  blockedId: 2,
  successToast: "Cliente excluído com sucesso",
  deleteSingular: "cliente",
  matchQuery: "aurora",
  firstItemText: "Confecções Aurora",
  secondItemText: "Malharia Bela",
})
