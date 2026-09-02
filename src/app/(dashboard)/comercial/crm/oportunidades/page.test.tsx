// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import OportunidadesPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock } from "@/test/harness"
import { listSmokeSpec } from "@/test/list-smoke-spec"

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { role: "ADMIN" } } }),
}))

const oportunidades = [
  {
    id: 1,
    titulo: "Venda de malha 100% algodão",
    empresaNome: "Tecelagem Alpha",
    valorEstimado: "5000",
    status: "NOVO",
    responsavelNome: "Tiago",
    probabilidade: 50,
    createdAt: "2026-07-01T10:00:00Z",
  },
  {
    id: 2,
    titulo: "Confecção de uniformes",
    empresaNome: "Confecções Lima",
    valorEstimado: "1500",
    status: "FECHADO_GANHO",
    responsavelNome: null,
    probabilidade: 0,
    createdAt: "2026-07-02T10:00:00Z",
  },
]

listSmokeSpec({
  title: "OportunidadesPage",
  component: <OportunidadesPage />,
  apiUrl: "/api/crm/oportunidades?mine=true",
  heading: "Oportunidades",
  emptyText: "Nenhuma oportunidade encontrada",
  searchPlaceholder: "Buscar por título ou pessoa...",
  newLinkText: "Nova Oportunidade",
  newHref: "/comercial/crm/oportunidades/novo",
  editHref: (item) => `/comercial/crm/oportunidades/${item.id}`,
  primaryField: "titulo",
  data: oportunidades,
  firstItemText: "Venda de malha 100% algodão",
  secondItemText: "Confecção de uniformes",
  matchQuery: "malha",
})

describe("OportunidadesPage kanban", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/oportunidades?mine=true") return { json: oportunidades }
      return { json: null }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("alterna para o kanban", async () => {
    renderPage(<OportunidadesPage />)

    await screen.findByText("Venda de malha 100% algodão")
    fireEvent.click(screen.getByRole("button", { name: "Kanban" }))

    expect(await screen.findByRole("button", { name: "Flutuar" })).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    expect(screen.getByText("Venda de malha 100% algodão")).toBeInTheDocument()
  })
})

describe("OportunidadesPage exclusão", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/oportunidades?mine=true") return { json: oportunidades }
      if (method === "DELETE" && url === "/api/crm/oportunidades/1") return { json: { success: true } }
      return { status: 404, json: { error: "Rota não mockada" } }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("abre modal e exclui a oportunidade confirmando", async () => {
    renderPage(<OportunidadesPage />)
    await screen.findByText("Venda de malha 100% algodão")

    const row = screen.getByText("Venda de malha 100% algodão").closest("tr")!
    fireEvent.click(within(row).getByRole("button", { name: "Excluir oportunidade" }))

    const dialog = screen.getByRole("dialog", { name: "Excluir oportunidade?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/crm/oportunidades/1", "DELETE")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Oportunidade excluída com sucesso"))
  })

  it("mostra erro ao excluir sem permissão de administrador", async () => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/oportunidades?mine=true") return { json: oportunidades }
      if (method === "DELETE" && url === "/api/crm/oportunidades/1") return { status: 403, json: { error: "Apenas administradores podem excluir" } }
      return { status: 404, json: { error: "Rota não mockada" } }
    }
    const noPermMock = createFetchMock(handler)
    vi.stubGlobal("fetch", noPermMock.fn)

    renderPage(<OportunidadesPage />)
    await screen.findByText("Venda de malha 100% algodão")

    const row = screen.getByText("Venda de malha 100% algodão").closest("tr")!
    fireEvent.click(within(row).getByRole("button", { name: "Excluir oportunidade" }))
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Apenas administradores podem excluir"))
  })

  it("link de edição aponta para o detalhe", async () => {
    renderPage(<OportunidadesPage />)
    await screen.findByText("Venda de malha 100% algodão")
    const edit = screen.getAllByTitle("Editar oportunidade")[0].closest("a")
    expect(edit).toHaveAttribute("href", "/comercial/crm/oportunidades/1")
  })
})
