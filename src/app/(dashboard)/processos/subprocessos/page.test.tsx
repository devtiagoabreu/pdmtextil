// @vitest-environment jsdom
import ProcessoSubprocessosPage from "./page"
import { listPageSpec } from "@/test/list-page-spec"

listPageSpec({
  title: "ProcessoSubprocessosPage",
  component: <ProcessoSubprocessosPage />,
  apiBase: "subprocessos",
  apiPrefix: "/api/processos",
  heading: "Subprocessos",
  searchPlaceholder: "Buscar por nome, processo ou descrição...",
  emptyText: "Nenhum subprocesso encontrado",
  newLinkText: "Novo Subprocesso",
  newHref: "/processos/subprocessos/novo",
  editHref: (item) => `/processos/subprocessos/${item.id}`,
  primaryField: "nome",
  data: [
    {
      id: 1,
      processoId: 1,
      processoNome: "Processo de Tecelagem",
      nome: "Preparação",
      descricao: "Preparação dos fios",
      ordem: 1,
      ativo: true,
    },
    {
      id: 2,
      processoId: 1,
      processoNome: "Processo de Tecelagem",
      nome: "Tecimento",
      descricao: null,
      ordem: 2,
      ativo: false,
    },
  ],
  blockedId: 2,
  successToast: "Subprocesso excluído com sucesso",
  deleteSingular: "subprocesso",
  matchQuery: "preparação",
  firstItemText: "Preparação",
  secondItemText: "Tecimento",
})