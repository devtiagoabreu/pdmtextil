// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import PropostasPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock } from "@/test/harness"
import { listSmokeSpec } from "@/test/list-smoke-spec"

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { role: "ADMIN" } } }),
}))

const propostas = [
  {
    id: 1,
    titulo: "Proposta Comercial - Tecido X",
    empresaNome: "Tecelagem Alpha",
    valor: 5000,
    status: "ENVIADA",
    createdAt: "2026-07-01T10:00:00Z",
  },
  {
    id: 2,
    titulo: "Proposta de Confecção - Malha Y",
    empresaNome: "Confecções Lima",
    valor: 1500,
    status: "ACEITA",
    createdAt: "2026-07-02T10:00:00Z",
  },
]

listSmokeSpec({
  title: "PropostasPage",
  component: <PropostasPage />,
  apiUrl: "/api/crm/propostas?mine=true",
  heading: "Propostas",
  emptyText: "Nenhuma proposta encontrada",
  searchPlaceholder: "Buscar por pessoa ou título...",
  newLinkText: "Nova Proposta",
  newHref: "/comercial/crm/propostas/novo",
  editHref: (item) => `/comercial/crm/propostas/${item.id}`,
  primaryField: "titulo",
  data: propostas,
  firstItemText: "Proposta Comercial - Tecido X",
  secondItemText: "Proposta de Confecção - Malha Y",
  matchQuery: "Tecido",
})

describe("PropostasPage kanban", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/propostas?mine=true") return { json: propostas }
      return { json: null }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("alterna para o kanban", async () => {
    renderPage(<PropostasPage />)

    await screen.findByText("Proposta Comercial - Tecido X")
    fireEvent.click(screen.getByRole("button", { name: "Kanban" }))

    expect(await screen.findByRole("button", { name: "Flutuar" })).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    expect(screen.getByText("Proposta Comercial - Tecido X")).toBeInTheDocument()
  })
})

describe("PropostasPage exclusão", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/propostas?mine=true") return { json: propostas }
      if (method === "DELETE" && url === "/api/crm/propostas/1") return { json: { success: true } }
      return { status: 404, json: { error: "Rota não mockada" } }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("abre modal e exclui a proposta confirmando", async () => {
    renderPage(<PropostasPage />)
    await screen.findByText("Proposta Comercial - Tecido X")

    const row = screen.getByText("Proposta Comercial - Tecido X").closest("tr")!
    fireEvent.click(within(row).getByRole("button", { name: "Excluir proposta" }))

    const dialog = screen.getByRole("dialog", { name: "Excluir proposta?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/crm/propostas/1", "DELETE")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Proposta excluída com sucesso"))
  })

  it("mostra erro ao excluir sem permissão de administrador", async () => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/propostas?mine=true") return { json: propostas }
      if (method === "DELETE" && url === "/api/crm/propostas/1") return { status: 403, json: { error: "Apenas administradores podem excluir" } }
      return { status: 404, json: { error: "Rota não mockada" } }
    }
    const noPermMock = createFetchMock(handler)
    vi.stubGlobal("fetch", noPermMock.fn)

    renderPage(<PropostasPage />)
    await screen.findByText("Proposta Comercial - Tecido X")

    const row = screen.getByText("Proposta Comercial - Tecido X").closest("tr")!
    fireEvent.click(within(row).getByRole("button", { name: "Excluir proposta" }))
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Apenas administradores podem excluir"))
  })

  it("link de edição aponta para o detalhe", async () => {
    renderPage(<PropostasPage />)
    await screen.findByText("Proposta Comercial - Tecido X")
    const edit = screen.getAllByTitle("Editar proposta")[0].closest("a")
    expect(edit).toHaveAttribute("href", "/comercial/crm/propostas/1")
  })
})
