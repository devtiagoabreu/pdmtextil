// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest"
import { screen } from "@testing-library/react"
import ChamadosDashboardPage from "./page"
import { createFetchMock, renderPage, navMock } from "@/test/harness"

const DASHBOARD_MOCK = {
  totais: {
    abertos: 5,
    ativosPorStatus: { ABERTO: 2, EM_ANDAMENTO: 2, AGUARDANDO: 1 },
    porPrioridade: { URGENTE: 1, MEDIA: 4 },
    semResponsavel: 1,
    vencidosPrimeiraResposta: 1,
    vencidosResolucao: 2,
    resolvidosMes: 3,
    fechadosMes: 2,
    canceladosMes: 0,
  },
  porFila: [
    { areaId: 1, areaNome: "T.I.", total: 3, vencidos: 1 },
    { areaId: 2, areaNome: "Manutenção", total: 2, vencidos: 1 },
  ],
  recentes: [
    {
      id: 9,
      titulo: "Rede caiu",
      status: "ABERTO",
      prioridade: "URGENTE",
      categoria: "INCIDENTE",
      areaNome: "T.I.",
      solicitanteNome: "João",
      createdAt: "2026-09-17T09:00:00.000Z",
    },
  ],
}

function mountPage(data: unknown = DASHBOARD_MOCK) {
  navMock.setPathname("/chamados/dashboard")
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/chamados/dashboard") return { json: data }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("ChamadosDashboardPage", () => {
  beforeEach(() => {
    navMock.reset()
  })

  it("renderiza cards e totais", async () => {
    mountPage()
    renderPage(<ChamadosDashboardPage />)

    expect(
      await screen.findByRole("heading", { name: "Dashboard de Chamados" })
    ).toBeInTheDocument()
    expect(screen.getAllByText("Abertos").length).toBeGreaterThan(0)
    expect(screen.getByText("Sem responsável")).toBeInTheDocument()
    expect(screen.getByText("Vencidos 1ª resposta")).toBeInTheDocument()
    expect(screen.getByText("Vencidos resolução")).toBeInTheDocument()
    expect(screen.getByText("Resolvidos no mês")).toBeInTheDocument()
    expect(screen.getByText("Fechados no mês")).toBeInTheDocument()
    expect(screen.getAllByText("Urgente").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Média").length).toBeGreaterThan(0)
  })

  it("mostra chamados por fila e recentes", async () => {
    mountPage()
    renderPage(<ChamadosDashboardPage />)

    expect(await screen.findByText("Chamados por fila")).toBeInTheDocument()
    expect(screen.getAllByText("T.I.").length).toBeGreaterThan(0)
    expect(screen.getByText("Rede caiu")).toBeInTheDocument()
    expect(screen.getByText("João")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Rede caiu" })).toHaveAttribute(
      "href",
      "/chamados/9"
    )
  })

  it("mostra estado vazio quando não há dados", async () => {
    mountPage({
      totais: {
        abertos: 0,
        ativosPorStatus: {},
        porPrioridade: {},
        semResponsavel: 0,
        vencidosPrimeiraResposta: 0,
        vencidosResolucao: 0,
        resolvidosMes: 0,
        fechadosMes: 0,
        canceladosMes: 0,
      },
      porFila: [],
      recentes: [],
    })
    renderPage(<ChamadosDashboardPage />)

    expect((await screen.findAllByText("Nenhum chamado aberto")).length).toBeGreaterThan(0)
    expect(screen.getByText("Nenhum chamado ainda")).toBeInTheDocument()
  })
})