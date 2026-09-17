// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest"
import { screen, fireEvent, within } from "@testing-library/react"
import ChamadosPage from "./page"
import { createFetchMock, renderPage, navMock } from "@/test/harness"

const CHAMADOS_MOCK = [
  {
    id: 1,
    titulo: "Impressora não imprime",
    descricao: "Setor de corte sem impressora",
    categoria: "INCIDENTE",
    status: "ABERTO",
    prioridade: "ALTA",
    areaId: 1,
    areaNome: "T.I.",
    solicitanteId: 1,
    solicitanteNome: "João",
    responsavelId: null,
    responsavelNome: null,
    ativoNome: null,
    ativoCodigo: null,
    processoNome: null,
    slaPrimeiraRespostaPrazo: "2026-09-18T14:00:00.000Z",
    slaResolucaoPrazo: "2026-09-19T14:00:00.000Z",
    createdAt: "2026-09-17T10:00:00.000Z",
  },
  {
    id: 2,
    titulo: "Troca de lâmpada no galpão B",
    descricao: "Iluminação fraca",
    categoria: "MANUTENCAO_PREVENTIVA",
    status: "EM_ANDAMENTO",
    prioridade: "MEDIA",
    areaId: 2,
    areaNome: "Manutenção",
    solicitanteId: 2,
    solicitanteNome: "Maria",
    responsavelId: 3,
    responsavelNome: "Carlos",
    ativoNome: "Luminária Galpão B",
    ativoCodigo: "LUM-002",
    processoNome: null,
    slaPrimeiraRespostaPrazo: "2026-09-17T12:00:00.000Z",
    slaResolucaoPrazo: "2026-09-21T12:00:00.000Z",
    createdAt: "2026-09-17T08:00:00.000Z",
  },
]

const AREAS_MOCK = [
  { id: 1, nome: "T.I." },
  { id: 2, nome: "Manutenção" },
]

function mountPage(chamados: unknown[] = CHAMADOS_MOCK, areas: unknown[] = AREAS_MOCK) {
  navMock.setPathname("/chamados")
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/chamados") return { json: chamados }
    if (method === "GET" && url === "/api/chamados?minhasFilas=true") {
      return { json: chamados.filter((c) => (c as { responsavelNome: string | null }).responsavelNome) }
    }
    if (method === "GET" && url === "/api/processos/areas") return { json: areas }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("ChamadosPage", () => {
  beforeEach(() => {
    navMock.reset()
  })

  it("renderiza a lista com chamados e badges", async () => {
    mountPage()
    renderPage(<ChamadosPage />)

    expect(screen.getByRole("heading", { name: "Chamados" })).toBeInTheDocument()
    expect(await screen.findByText("Impressora não imprime")).toBeInTheDocument()
    expect(screen.getByText("Troca de lâmpada no galpão B")).toBeInTheDocument()
    expect(screen.getByText("Incidente")).toBeInTheDocument()
    expect(screen.getAllByText("Em andamento").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Alta").length).toBeGreaterThan(0)
    expect(screen.getByText("Carlos")).toBeInTheDocument()
  })

  it("filtra pela busca", async () => {
    mountPage()
    renderPage(<ChamadosPage />)
    await screen.findByText("Impressora não imprime")

    const search = screen.getByPlaceholderText(
      "Buscar por título, descrição, solicitante ou fila..."
    )
    fireEvent.change(search, { target: { value: "Impressora" } })
    expect(screen.getByText("Impressora não imprime")).toBeInTheDocument()
    expect(screen.queryByText("Troca de lâmpada no galpão B")).not.toBeInTheDocument()

    fireEvent.change(search, { target: { value: "zzz-inexistente" } })
    expect(screen.getByText("Nenhum chamado com esses filtros")).toBeInTheDocument()
  })

  it("filtra por status e pelo toggle de minhas filas", async () => {
    const fetchMock = mountPage()
    renderPage(<ChamadosPage />)
    await screen.findByText("Impressora não imprime")

    const statusFilter = screen.getByLabelText("Filtrar por status")
    fireEvent.change(statusFilter, { target: { value: "EM_ANDAMENTO" } })
    expect(screen.queryByText("Impressora não imprime")).not.toBeInTheDocument()
    expect(screen.getByText("Troca de lâmpada no galpão B")).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText("Minhas filas"))
    await screen.findByText("Troca de lâmpada no galpão B")
    expect(
      fetchMock.calls.some((c) => c.url === "/api/chamados?minhasFilas=true")
    ).toBe(true)
    expect(screen.queryByText("Impressora não imprime")).not.toBeInTheDocument()
  })

  it("mostra estado vazio quando a API retorna vazio", async () => {
    mountPage([])
    renderPage(<ChamadosPage />)

    expect(await screen.findByText("Nenhum chamado encontrado")).toBeInTheDocument()
  })

  it("contém links de novo, dashboard e detalhe", async () => {
    mountPage()
    renderPage(<ChamadosPage />)
    await screen.findByText("Impressora não imprime")

    expect(screen.getByRole("link", { name: "Novo Chamado" })).toHaveAttribute(
      "href",
      "/chamados/novo"
    )
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/chamados/dashboard"
    )
    expect(screen.getByText("Impressora não imprime").closest("a")).toHaveAttribute(
      "href",
      "/chamados/1"
    )
  })

  it("mostra coluna de responsável vazia corretamente", async () => {
    mountPage()
    renderPage(<ChamadosPage />)
    await screen.findByText("Impressora não imprime")

    const row = screen.getByText("Impressora não imprime").closest("tr")!
    expect(within(row).queryByText("—")).toBeInTheDocument()
  })
})