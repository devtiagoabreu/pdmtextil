// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import CrmLeadsPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock } from "@/test/harness"
import { listSmokeSpec } from "@/test/list-smoke-spec"

const { sessionMock } = vi.hoisted(() => ({
  sessionMock: { data: { user: { role: "ADMIN" as string } } },
}))
vi.mock("next-auth/react", () => ({
  useSession: () => sessionMock,
}))

const leads = [
  {
    id: 1,
    nome: "João Pereira",
    email: "joao@email.com",
    celular: "(11) 91111-1111",
    empresaNome: null,
    tipoPessoa: "PJ",
    score: 80,
    origem: "SITE",
    status: "NOVO",
    responsavelNome: "Tiago",
    createdAt: "2026-07-01T10:00:00Z",
  },
  {
    id: 2,
    nome: "Maria Lima",
    email: null,
    celular: null,
    empresaNome: "Confecções Lima",
    tipoPessoa: "PF",
    score: 30,
    origem: "OUTRO",
    status: "PERDIDO",
    responsavelNome: null,
    createdAt: "2026-07-02T10:00:00Z",
  },
]

listSmokeSpec({
  title: "LeadsPage",
  component: <CrmLeadsPage />,
  apiUrl: "/api/crm/leads",
  heading: "Leads",
  emptyText: "Nenhum lead encontrado",
  searchPlaceholder: "Buscar leads...",
  newLinkText: "Novo Lead",
  newHref: "/comercial/crm/leads/novo",
  editHref: (item) => `/comercial/crm/leads/${item.id}`,
  primaryField: "nome",
  data: leads,
  firstItemText: "João Pereira",
  secondItemText: "Maria Lima",
  matchQuery: "João",
})

describe("LeadsPage ações", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/leads") return { json: [leads[0]] }
      if (method === "PUT" && url === "/api/crm/leads/1") return { json: { ok: true } }
      return { json: null }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("altera o status do lead pela ação Contatar", async () => {
    renderPage(<CrmLeadsPage />)

    fireEvent.click(await screen.findByRole("button", { name: "Contatar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/leads/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ status: "CONTATADO" })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Lead alterado para CONTATADO"))
  })

  it("alterna para o kanban", async () => {
    renderPage(<CrmLeadsPage />)

    fireEvent.click(screen.getByRole("button", { name: "Kanban" }))

    expect(await screen.findByRole("button", { name: "Flutuar" })).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    expect(screen.getByText("João Pereira")).toBeInTheDocument()
  })
})

describe("LeadsPage exclusão", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    sessionMock.data.user.role = "ADMIN"
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/leads") return { json: [leads[0]] }
      if (method === "DELETE" && url === "/api/crm/leads/1") return { json: { success: true } }
      return { json: null }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("admin exclui lead pela tabela via modal", async () => {
    renderPage(<CrmLeadsPage />)

    fireEvent.click(await screen.findByRole("button", { name: "Excluir lead" }))
    const dialog = screen.getByRole("dialog", { name: "Excluir lead?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/leads/1", "DELETE")
      expect(call).toBeDefined()
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith('Lead "João Pereira" excluído'))
  })

  it("não mostra o botão de excluir para não-administradores", async () => {
    sessionMock.data.user.role = "VENDEDOR"
    renderPage(<CrmLeadsPage />)

    await screen.findByText("João Pereira")
    expect(screen.queryByRole("button", { name: "Excluir lead" })).not.toBeInTheDocument()
  })
})
