// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import VisitasPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { role: "ADMIN" } } }),
}))

const visitas = [
  {
    id: 1,
    dataVisita: "2026-07-01",
    hora: "10:00",
    tipo: "PRESENCIAL",
    status: "AGENDADA",
    empresaId: 1,
    clienteId: null,
    empresaNome: "Tecelagem Alpha",
    clienteNome: null,
    nomeAvulso: null,
    oportunidadeTitulo: "Venda de malha",
    criadoPorNome: "Tiago",
    endereco: "Rua das Rosas",
    numero: "100",
    cidade: "São Paulo",
    uf: "SP",
  },
  {
    id: 2,
    dataVisita: "2026-07-02",
    hora: null,
    tipo: "VIDEO",
    status: "REALIZADA",
    empresaId: null,
    clienteId: 5,
    empresaNome: null,
    clienteNome: "Confecções Lima",
    nomeAvulso: null,
    oportunidadeTitulo: null,
    criadoPorNome: null,
    endereco: null,
  },
]

const statusesVisita = [
  { id: 1, nome: "AGENDADA", rotulo: "Agendada", tipo: "VISITA", cor: "#3b82f6", ordem: 1, ativo: true },
  { id: 2, nome: "REALIZADA", rotulo: "Realizada", tipo: "VISITA", cor: "#10b981", ordem: 3, ativo: true },
]

function buildHandler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "PATCH" && url === "/api/crm/visitas/bulk") return { json: { ok: true } }
    if (method === "DELETE" && url === "/api/crm/visitas/bulk") return { json: { ok: true } }
    if (method !== "GET") return { json: null }

    const u = new URL(url, "http://localhost")
    if (u.pathname === "/api/crm/visitas") {
      if (u.searchParams.get("all") === "true") {
        if (u.searchParams.get("avulsas") === "true") return { json: [] }
        return { json: visitas }
      }
      const q = (u.searchParams.get("q") || "").toLowerCase()
      const filtered = visitas.filter(
        (v) =>
          !q ||
          v.empresaNome?.toLowerCase().includes(q) ||
          v.clienteNome?.toLowerCase().includes(q) ||
          v.oportunidadeTitulo?.toLowerCase().includes(q)
      )
      return { json: { data: filtered, total: filtered.length, totalPages: 1 } }
    }
    return { json: null }
  }
}

describe("VisitasPage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    fetchMock = createFetchMock(buildHandler())
    vi.stubGlobal("fetch", fetchMock.fn)
    navMock.setPathname("/comercial/crm/visitas")
  })

  it("renderiza a tabela de visitas com dados", async () => {
    renderPage(<VisitasPage />)

    expect(await screen.findByRole("heading", { name: "Visitas" })).toBeInTheDocument()
    expect(await screen.findByText("Tecelagem Alpha")).toBeInTheDocument()
    expect(screen.getByText("Confecções Lima")).toBeInTheDocument()
    expect(screen.getByText("Presencial")).toBeInTheDocument()
    expect(screen.getByText("01/07/2026 10:00")).toBeInTheDocument()
    expect(screen.getAllByText("AGENDADA").length).toBeGreaterThan(0)
    expect(screen.getByText("1-2 de 2 visita(s)")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Nova Visita" })).toHaveAttribute("href", "/comercial/crm/visitas/novo")
  })

  it("alterna para o kanban", async () => {
    const handler = buildHandler()
    const withStatus = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/admin/status?tipo=VISITA") return { json: statusesVisita }
      return handler({ method, url })
    }
    const kanbanMock = createFetchMock(withStatus)
    vi.stubGlobal("fetch", kanbanMock.fn)

    renderPage(<VisitasPage />)

    await screen.findByText("Tecelagem Alpha")
    fireEvent.click(screen.getByRole("button", { name: "Kanban" }))

    expect(await screen.findByRole("button", { name: "Flutuar" })).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    expect(await screen.findByText("Tecelagem Alpha")).toBeInTheDocument()
  })

  it("altera status em massa via PATCH", async () => {
    renderPage(<VisitasPage />)
    await screen.findByText("Tecelagem Alpha")

    const checkboxes = screen.getAllByRole("checkbox")
    fireEvent.click(checkboxes[1])
    fireEvent.click(checkboxes[2])

    expect(await screen.findByText("2 selecionada(s)")).toBeInTheDocument()
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "REALIZADA" } })

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/visitas/bulk", "PATCH")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ ids: [1, 2], status: "REALIZADA" })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Status atualizado com sucesso"))
  })

  it("exclui visitas selecionadas em massa", async () => {
    renderPage(<VisitasPage />)
    await screen.findByText("Tecelagem Alpha")

    const checkboxes = screen.getAllByRole("checkbox")
    fireEvent.click(checkboxes[1])
    fireEvent.click(checkboxes[2])

    fireEvent.click(await screen.findByRole("button", { name: "Excluir" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/visitas/bulk", "DELETE")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ ids: [1, 2] })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Visitas excluidas com sucesso"))
  })

  it("busca com debounce e filtra no servidor", async () => {
    renderPage(<VisitasPage />)
    await screen.findByText("Tecelagem Alpha")

    fireEvent.change(screen.getByPlaceholderText("Buscar por pessoa, cliente ou oportunidade..."), {
      target: { value: "Tecelagem" },
    })

    await waitFor(
      () => expect(findCall(fetchMock.calls, "/api/crm/visitas?page=1&limit=50&q=Tecelagem", "GET")).toBeDefined(),
      { timeout: 2000 }
    )
    await waitFor(() => expect(screen.queryByText("Confecções Lima")).not.toBeInTheDocument())
    expect(screen.getByText("Tecelagem Alpha")).toBeInTheDocument()
  })

  it("mostra estado vazio", async () => {
    const empty = createFetchMock(() => ({ json: { data: [], total: 0, totalPages: 0 } }))
    vi.stubGlobal("fetch", empty.fn)

    renderPage(<VisitasPage />)

    expect(await screen.findByText("Nenhuma visita encontrada")).toBeInTheDocument()
  })
})
