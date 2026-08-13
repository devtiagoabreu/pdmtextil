// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { DashboardRelatorio } from "./dashboard-relatorio"
import { createFetchMock, renderPage } from "@/test/harness"
import { exportPDFRelatorio, exportCSV } from "@/lib/export-utils"

vi.mock("@/lib/export-utils", () => ({ exportPDFRelatorio: vi.fn(), exportCSV: vi.fn() }))

const remessas = [
  {
    remessaId: "r1",
    assunto: "Promo Julho",
    createdAt: "2026-07-10T10:00:00.000Z",
    total: 100,
    enviados: 95,
    falhas: 5,
    lidos: 40,
    clicados: 10,
    totalCliques: 15,
    links: [
      { urlOriginal: "https://pdmprotextil.com.br/promo", total: 10 },
      { urlOriginal: "https://pdmprotextil.com.br/novo", total: 5 },
    ],
  },
  {
    remessaId: "r2",
    assunto: "Informativo",
    createdAt: "2026-07-11T10:00:00.000Z",
    total: 50,
    enviados: 48,
    falhas: 2,
    lidos: 20,
    clicados: 0,
    totalCliques: 0,
    links: [],
  },
]

function setup() {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/admin/email-massa/relatorio") return { json: { remessas } }
    return { json: null }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("DashboardRelatorio", () => {
  it("renderiza cards de resumo com totais agregados das remessas", async () => {
    setup()
    renderPage(<DashboardRelatorio />)

    expect(await screen.findByText("Promo Julho")).toBeInTheDocument()
    expect(screen.getByText("Total de envios")).toBeInTheDocument()
    expect(screen.getByText("150")).toBeInTheDocument()
    expect(screen.getByText("143")).toBeInTheDocument()
    expect(screen.getAllByText("60").length).toBeGreaterThan(0)
    expect(screen.getByText("40% de abertura")).toBeInTheDocument()
    expect(screen.getByText("90")).toBeInTheDocument()
    expect(screen.getAllByText("10").length).toBeGreaterThan(0)
    expect(screen.getByText("15 cliques no total")).toBeInTheDocument()
    expect(screen.getByText("7")).toBeInTheDocument()
  })

  it("renderiza um card por remessa com mini stats e links", async () => {
    setup()
    renderPage(<DashboardRelatorio />)

    expect(await screen.findByText("Promo Julho")).toBeInTheDocument()
    expect(screen.getByText("Informativo")).toBeInTheDocument()
    expect(screen.getAllByText("Total").length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText("Não abertos")).toBeInTheDocument()
    expect(screen.getAllByText("pdmprotextil.com.br").length).toBe(2)
    expect(screen.getByText("Nenhum clique registrado nesta remessa.")).toBeInTheDocument()
  })

  it("Relatório PDF geral exporta com stats agregados e resumo por remessa", async () => {
    setup()
    renderPage(<DashboardRelatorio />)
    await screen.findByText("Promo Julho")

    fireEvent.click(screen.getByRole("button", { name: "Relatório PDF" }))

    await waitFor(() => expect(exportPDFRelatorio).toHaveBeenCalled())
    const args = vi.mocked(exportPDFRelatorio).mock.calls.at(-1)![0] as any
    expect(args.title).toContain("Dashboard de Email em Massa")
    expect(args.stats).toEqual({ "Total de envios": 150, Enviados: 143, Lidos: 60, "Não abertos": 90, Cliques: 10, "Cliques no total": 15, Falhas: 7 })
    expect(args.tables[0].title).toBe("Resumo por remessa")
    expect(args.tables[0].rows).toHaveLength(2)
    expect(args.tables[0].rows[0][0]).toBe("Remessa #2")
    expect(args.tables[0].rows[0][3]).toBe(95)
    expect(args.filename).toContain("dashboard-email-massa-")
  })

  it("Relatório de uma remessa exporta PDF com os dados dela", async () => {
    setup()
    renderPage(<DashboardRelatorio />)
    await screen.findByText("Promo Julho")

    fireEvent.click(screen.getAllByRole("button", { name: "Relatório" })[0])

    await waitFor(() => expect(exportPDFRelatorio).toHaveBeenCalled())
    const args = vi.mocked(exportPDFRelatorio).mock.calls.at(-1)![0] as any
    expect(args.title).toContain("Promo Julho")
    expect(args.stats).toEqual({ Total: 100, Enviados: 95, Lidos: 40, "Não abertos": 60, Cliques: 10, "Cliques no total": 15, Falhas: 5 })
    expect(args.tables[0].title).toBe("Links mais clicados (2)")
    expect(args.filename).toContain("relatorio-remessa-r1-")
  })

  it("Links CSV exporta os links de uma remessa", async () => {
    setup()
    renderPage(<DashboardRelatorio />)
    await screen.findByText("Promo Julho")

    fireEvent.click(screen.getAllByRole("button", { name: "Links CSV" })[0])

    await waitFor(() => expect(exportCSV).toHaveBeenCalled())
    const args = vi.mocked(exportCSV).mock.calls.at(-1)!
    expect(args[0]).toContain("r1")
    expect(args[1]).toEqual(["Link", "Cliques"])
    expect(args[2]).toHaveLength(2)
  })

  it("mostra estado vazio quando não há remessas", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/email-massa/relatorio") return { json: { remessas: [] } }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<DashboardRelatorio />)

    expect(await screen.findByText(/Nenhuma remessa encontrada/)).toBeInTheDocument()
  })
})
