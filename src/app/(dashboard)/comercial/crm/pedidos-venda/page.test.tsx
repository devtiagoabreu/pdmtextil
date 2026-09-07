// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import PedidosVendaPage from "./page"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"

const pedidos = [
  {
    id: 1,
    oportunidadeId: 1,
    oportunidadeTitulo: "Malha penteada",
    numero: "PV-001",
    dataEmissao: "2026-09-01",
    status: "ABERTO",
    total: 1250,
    itensCount: 1,
  },
  {
    id: 2,
    oportunidadeId: 2,
    oportunidadeTitulo: "Jeans premium",
    numero: "PV-002",
    dataEmissao: null,
    status: "FATURADO",
    total: 850,
    itensCount: 2,
  },
]

function buildHandler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "DELETE" && /^\/api\/crm\/pedidos-venda\/\d+$/.test(url)) return { json: { success: true } }
    if (method !== "GET") return { json: null }

    const u = new URL(url, "http://localhost")
    if (u.pathname === "/api/crm/pedidos-venda") {
      const q = (u.searchParams.get("q") || "").toLowerCase()
      const status = u.searchParams.get("status")
      const filtered = pedidos.filter(
        (p) =>
          (!q || p.numero.toLowerCase().includes(q)) &&
          (!status || p.status === status)
      )
      return { json: { data: filtered, total: filtered.length, totalPages: 1 } }
    }
    return { json: null }
  }
}

describe("PedidosVendaPage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    fetchMock = createFetchMock(buildHandler())
    vi.stubGlobal("fetch", fetchMock.fn)
    navMock.setPathname("/comercial/crm/pedidos-venda")
  })

  it("renderiza a tabela de pedidos de venda com dados", async () => {
    renderPage(<PedidosVendaPage />)

    expect(await screen.findByRole("heading", { name: "Pedidos de Venda" })).toBeInTheDocument()
    expect(await screen.findByText("PV-001")).toBeInTheDocument()
    expect(screen.getByText("PV-002")).toBeInTheDocument()
    expect(screen.getAllByText("Aberto").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Faturado").length).toBeGreaterThan(0)
    expect(screen.getByText("R$ 1.250,00")).toBeInTheDocument()
    expect(screen.getByText("1-2 de 2 pedido(s)")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Novo Pedido de Venda" })).toHaveAttribute("href", "/comercial/crm/pedidos-venda/novo")
  })

  it("mostra estado vazio quando a API retorna vazio", async () => {
    const empty = createFetchMock(() => ({ json: { data: [], total: 0, totalPages: 0 } }))
    vi.stubGlobal("fetch", empty.fn)

    renderPage(<PedidosVendaPage />)

    expect(await screen.findByText("Nenhum pedido de venda encontrado")).toBeInTheDocument()
  })

  it("busca com debounce e filtra", async () => {
    renderPage(<PedidosVendaPage />)
    await screen.findByText("PV-001")

    fireEvent.change(screen.getByPlaceholderText("Buscar por número, referência ou oportunidade..."), {
      target: { value: "PV-002" },
    })

    await waitFor(
      () => expect(findCall(fetchMock.calls, "/api/crm/pedidos-venda?page=1&limit=50&q=PV-002", "GET")).toBeDefined(),
      { timeout: 2000 }
    )
    await waitFor(() => expect(screen.queryByText("PV-001")).not.toBeInTheDocument())
    expect(screen.getByText("PV-002")).toBeInTheDocument()
  })

  it("filtra por status via select", async () => {
    renderPage(<PedidosVendaPage />)
    await screen.findByText("PV-001")

    fireEvent.change(screen.getByLabelText("Filtrar por status"), { target: { value: "FATURADO" } })

    await waitFor(
      () => expect(findCall(fetchMock.calls, "/api/crm/pedidos-venda?page=1&limit=50&status=FATURADO", "GET")).toBeDefined(),
      { timeout: 2000 }
    )
  })

  it("exclui um pedido após confirmar no modal", async () => {
    renderPage(<PedidosVendaPage />)
    await screen.findByText("PV-001")

    const row = screen.getByText("PV-001").closest("tr")!
    const trash = within(row).getAllByRole("button").find((b) => !b.closest("a"))!
    fireEvent.click(trash)

    const dialog = screen.getByRole("dialog", { name: "Excluir pedido de venda" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/crm/pedidos-venda/1", "DELETE")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Pedido de venda excluído com sucesso"))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})