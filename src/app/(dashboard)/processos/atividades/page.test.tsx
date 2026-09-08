// @vitest-environment jsdom
import ProcessoAtividadesPage from "./page"
import { listPageSpec } from "@/test/list-page-spec"

listPageSpec({
  title: "ProcessoAtividadesPage",
  component: <ProcessoAtividadesPage />,
  apiBase: "atividades",
  apiPrefix: "/api/processos",
  heading: "Atividades",
  searchPlaceholder: "Buscar por nome, tipo, subprocesso ou responsável...",
  emptyText: "Nenhuma atividade encontrada",
  newLinkText: "Nova Atividade",
  newHref: "/processos/atividades/novo",
  editHref: (item) => `/processos/atividades/${item.id}`,
  primaryField: "nome",
  data: [
    {
      id: 1,
      subprocessoId: 1,
      subprocessoNome: "Preparação",
      nome: "Encaramento",
      tipo: "MANUAL",
      responsavel: "João",
      ordem: 1,
      ativo: true,
    },
    {
      id: 2,
      subprocessoId: 2,
      subprocessoNome: "Tecimento",
      nome: "Monitorar teares",
      tipo: "AUTOMATICA",
      responsavel: null,
      ordem: 2,
      ativo: false,
    },
  ],
  blockedId: 2,
  successToast: "Atividade excluída com sucesso",
  deleteSingular: "atividade",
  matchQuery: "encaramento",
  firstItemText: "Encaramento",
  secondItemText: "Monitorar teares",
})