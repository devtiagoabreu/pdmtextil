// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, routeJson } from "@/test/harness"
import VisitasDashboardPage from "./page"

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { name: "Admin", role: "ADMIN" } }, status: "authenticated" }),
}))

describe("VisitasDashboardPage", () => {
  it("renderiza o heading e as seções", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/crm/visitas/dashboard": {
        total: 0,
        realizadas: 0,
        canceladas: 0,
        agendadas: 0,
        hoje: 0,
        esteMes: 0,
        byTipo: [],
        byStatus: [],
        porRepresentante: [],
        ultimasVisitas: [],
        pesquisas: { enviadas: 0, abertas: 0, respondidas: 0 },
      },
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<VisitasDashboardPage />)
    expect(screen.getByRole("heading", { name: "Dashboard de Visitas" })).toBeInTheDocument()
    expect(await screen.findByText("Ações Rápidas")).toBeInTheDocument()
    expect(screen.getByText("Performance por Representante")).toBeInTheDocument()
  })
})
