// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, routeJson } from "@/test/harness"
import WhatsAppDashboardPage from "./page"

describe("WhatsAppDashboardPage", () => {
  it("renderiza o heading e os cards de resumo", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/admin/whatsapp-dashboard?dias=7": {
        resumo: { totalConversas: 0, totalLeads: 0, taxaConclusao: 0, tempoMedioMinutos: 0, ativas24h: 0 },
        porEstado: [],
        dropoff: [],
        msgsPorDia: [],
        topErros: [],
        dias: 7,
      },
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<WhatsAppDashboardPage />)
    expect(screen.getByRole("heading", { name: "Dashboard WhatsApp" })).toBeInTheDocument()
    expect(await screen.findByText("Total Conversas")).toBeInTheDocument()
  })
})
