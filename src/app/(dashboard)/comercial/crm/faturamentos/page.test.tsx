// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import FaturamentosPage from "./page"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"

const faturamentos = [
  {
    id: 1,
    oportunidadeId: 1,
    oportunidadeTitulo: "Malha penteada",
    numero: "NF-001",
    dataEmissao: "2026-09-01",
    status: "EMITIDO",
    total: 1250,
    itensCount: 1,
  },
  {
    id: 2,
    oportunidadeId: 2,
    oportunidadeTitulo: "Jeans premium",
    numero: "NF-002",
    dataEmissao: null,
    status: "RECEBIDO",
    total: 850,
    itensCount: 2,
  },
]

function buildHandler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "DELETE" && /^\/api\/crm\/faturamentos\/\d+$/.test(url)) return { json: { success: true } }
    if (method !== "GET") return { json: null }

    const u = new URL(url, "http://localhost")
    if (u.pathname === "/api/crm/faturamentos") {
      const q = (u.searchParams.get("q") || "").toLowerCase()
      const status = u.searchParams.get("status")
      const filtered = faturamentos.filter(
        (f) =>
          (!q || f.numero.toLowerCase().includes(q)) &&
          (!status || f.status === status)
      )
      return { json: { data: filtered, total: filtered.length, totalPages: 1 } }
    }
    return { json: null }
  }
}

describe("FaturamentosPage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    fetchMock = createFetchMock(buildHandler())
    vi.stubGlobal("fetch", fetchMock.fn)
    navMock.setPathname("/comercial/crm/faturamentos")
  })

  it("renderiza a tabela de faturamentos com dados", async () => {
    renderPage(<FaturamentosPage />)

    expect(await screen.findByRole("heading", { name: "Faturamentos" })).toBeInTheDocument()
    expect(await screen.findByText("NF-001")).toBeInTheDocument()
    expect(screen.getByText("NF-002")).toBeInTheDocument()
    expect(screen.getAllByText("Emitido").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Recebido").length).toBeGreaterThan(0)
    expect(screen.getByText("R$ 1.250,00")).toBeInTheDocument()
    expect(screen.getByText("1-2 de 2 faturamento(s)")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Novo Faturamento" })).toHaveAttribute("href", "/comercial/crm/faturamentos/novo")
  })

  it("mostra estado vazio quando a API retorna vazio", async () => {
    const empty = createFetchMock(() => ({ json: { data: [], total: 0, totalPages: 0 } }))
    vi.stubGlobal("fetch", empty.fn)

    renderPage(<FaturamentosPage />)

    expect(await screen.findByText("Nenhum faturamento encontrado")).toBeInTheDocument()
  })

  it("busca com debounce e filtra", async () => {
    renderPage(<FaturamentosPage />)
    await screen.findByText("NF-001")

    fireEvent.change(screen.getByPlaceholderText("Buscar por número, referência ou oportunidade..."), {
      target: { value: "NF-002" },
    })

    await waitFor(
      () => expect(findCall(fetchMock.calls, "/api/crm/faturamentos?page=1&limit=50&q=NF-002", "GET")).toBeDefined(),
      { timeout: 2000 }
    )
    await waitFor(() => expect(screen.queryByText("NF-001")).not.toBeInTheDocument())
    expect(screen.getByText("NF-002")).toBeInTheDocument()
  })

  it("filtra por status via select", async () => {
    renderPage(<FaturamentosPage />)
    await screen.findByText("NF-001")

    fireEvent.change(screen.getByLabelText("Filtrar por status"), { target: { value: "RECEBIDO" } })

    await waitFor(
      () => expect(findCall(fetchMock.calls, "/api/crm/faturamentos?page=1&limit=50&status=RECEBIDO", "GET")).toBeDefined(),
      { timeout: 2000 }
    )
  })

  it("exclui um faturamento após confirmar no modal", async () => {
    renderPage(<FaturamentosPage />)
    await screen.findByText("NF-001")

    const row = screen.getByText("NF-001").closest("tr")!
    const trash = within(row).getAllByRole("button").find((b) => !b.closest("a"))!
    fireEvent.click(trash)

    const dialog = screen.getByRole("dialog", { name: "Excluir faturamento" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/crm/faturamentos/1", "DELETE")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Faturamento excluído com sucesso"))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})