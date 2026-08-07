// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import RelatoriosPage from "./page"
import { createFetchMock, renderPage, routeJson } from "@/test/harness"

const relatorios = {
  totalEmpresas: 120,
  totalLeads: 340,
  totalOportunidades: 85,
  totalVisitas: 200,
  totalCampanhas: 12,
  leadsPorOrigem: [],
  oportunidadesPorStatus: [],
  oportunidadesPorResponsavel: [],
  propostasPorStatus: [],
  tarefasPorStatus: [],
  taxaConversao: { total: 0, ganhas: 0, perdidas: 0, taxa: 0 },
}

describe("CrmRelatoriosPage", () => {
  it("renderiza o heading, os cards de estatística e os gráficos", async () => {
    const fetchMock = createFetchMock(routeJson({ "GET /api/crm/relatorios": relatorios }))
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<RelatoriosPage />)

    expect(screen.getByRole("heading", { name: "Relatórios CRM" })).toBeInTheDocument()
    expect(await screen.findByText("Negócios")).toBeInTheDocument()
    expect(screen.getByText("Leads")).toBeInTheDocument()
    expect(screen.getByText("Oportunidades")).toBeInTheDocument()
    expect(screen.getByText("Visitas")).toBeInTheDocument()
    expect(screen.getByText("Campanhas")).toBeInTheDocument()
    expect(screen.getByText("120")).toBeInTheDocument()
    expect(screen.getByText("340")).toBeInTheDocument()
    expect(screen.getByText("85")).toBeInTheDocument()
    expect(screen.getByText("200")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()

    expect(await screen.findByText("Leads por Origem", {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByText("Pipeline (Oportunidades por Status)")).toBeInTheDocument()
    expect(screen.getByText("Taxa de Conversão")).toBeInTheDocument()
    expect(screen.getAllByText("Nenhum dado").length).toBeGreaterThan(0)
  })

  it("mostra erro quando a API falha", async () => {
    const fetchMock = createFetchMock(() => ({ status: 500, json: { error: "erro" } }))
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<RelatoriosPage />)

    expect(await screen.findByText("Erro ao carregar dados", {}, { timeout: 5000 })).toBeInTheDocument()
  })
})
