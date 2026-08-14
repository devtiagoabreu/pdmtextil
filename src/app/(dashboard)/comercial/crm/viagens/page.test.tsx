// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import ViagensPage from "./page"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"

const viagens = [
  {
    id: 1,
    titulo: "Feira Agritech - São Paulo",
    destinoCidade: "São Paulo",
    destinoUf: "SP",
    dataInicio: "2026-07-01",
    dataFim: "2026-07-05",
    status: "PLANEJADA",
    totalInvestimento: 500,
    totalVisitas: 2,
  },
  {
    id: 2,
    titulo: "Visita ao cliente",
    destinoCidade: "Campinas",
    destinoUf: "SP",
    dataInicio: null,
    dataFim: null,
    status: "CONCLUIDA",
    totalInvestimento: 0,
    totalVisitas: 0,
  },
]

function buildHandler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "DELETE" && /^\/api\/crm\/viagens\/\d+$/.test(url)) return { json: { success: true } }
    if (method !== "GET") return { json: null }

    const u = new URL(url, "http://localhost")
    if (u.pathname === "/api/crm/viagens") {
      const q = (u.searchParams.get("q") || "").toLowerCase()
      const filtered = viagens.filter((v) => !q || v.titulo.toLowerCase().includes(q))
      return { json: { data: filtered, total: filtered.length, totalPages: 1 } }
    }
    return { json: null }
  }
}

describe("ViagensPage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    fetchMock = createFetchMock(buildHandler())
    vi.stubGlobal("fetch", fetchMock.fn)
    navMock.setPathname("/comercial/crm/viagens")
  })

  it("renderiza a tabela de viagens com dados", async () => {
    renderPage(<ViagensPage />)

    expect(await screen.findByRole("heading", { name: "Viagens" })).toBeInTheDocument()
    expect(await screen.findByText("Feira Agritech - São Paulo")).toBeInTheDocument()
    expect(screen.getByText("Visita ao cliente")).toBeInTheDocument()
    expect(screen.getAllByText("Planejada").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Concluída").length).toBeGreaterThan(0)
    expect(screen.getByText("R$ 500,00")).toBeInTheDocument()
    expect(screen.getByText("1-2 de 2 viagem(ns)")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Nova Viagem" })).toHaveAttribute("href", "/comercial/crm/viagens/novo")
  })

  it("mostra estado vazio quando a API retorna vazio", async () => {
    const empty = createFetchMock(() => ({ json: { data: [], total: 0, totalPages: 0 } }))
    vi.stubGlobal("fetch", empty.fn)

    renderPage(<ViagensPage />)

    expect(await screen.findByText("Nenhuma viagem encontrada")).toBeInTheDocument()
  })

  it("busca com debounce e filtra", async () => {
    renderPage(<ViagensPage />)
    await screen.findByText("Feira Agritech - São Paulo")

    fireEvent.change(screen.getByPlaceholderText("Buscar por título, destino ou descrição..."), {
      target: { value: "Feira" },
    })

    await waitFor(
      () => expect(findCall(fetchMock.calls, "/api/crm/viagens?page=1&limit=50&q=Feira", "GET")).toBeDefined(),
      { timeout: 2000 }
    )
    await waitFor(() => expect(screen.queryByText("Visita ao cliente")).not.toBeInTheDocument())
    expect(screen.getByText("Feira Agritech - São Paulo")).toBeInTheDocument()
  })

  it("filtra por status via select", async () => {
    renderPage(<ViagensPage />)
    await screen.findByText("Feira Agritech - São Paulo")

    fireEvent.change(screen.getByLabelText("Filtrar por status"), { target: { value: "CONCLUIDA" } })

    await waitFor(
      () => expect(findCall(fetchMock.calls, "/api/crm/viagens?page=1&limit=50&status=CONCLUIDA", "GET")).toBeDefined(),
      { timeout: 2000 }
    )
  })

  it("exclui uma viagem após confirmar no modal", async () => {
    renderPage(<ViagensPage />)
    await screen.findByText("Feira Agritech - São Paulo")

    const row = screen.getByText("Feira Agritech - São Paulo").closest("tr")!
    const trash = within(row).getAllByRole("button").find((b) => !b.closest("a"))!
    fireEvent.click(trash)

    const dialog = screen.getByRole("dialog", { name: "Excluir viagem" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/crm/viagens/1", "DELETE")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Viagem excluída com sucesso"))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
