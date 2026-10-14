// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import AtivosHomePage from "./page"
import { renderPage, createFetchMock, navMock, routeJson } from "@/test/harness"

vi.mock("@/lib/info-content", () => ({
  getInfoContent: vi.fn(() => ({ title: "Ativos", description: "Gerencie ativos" })),
}))

describe("AtivosHomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navMock.reset()
    navMock.setPathname("/ativos")
  })

  it("renderiza cards", async () => {
    const fetchMock = createFetchMock(
      routeJson({
        "/api/ativos/ativos": [],
        "/api/ativos/categorias": [],
        "/api/ativos/tipos-vistoria": [],
        "/api/ativos/planos": [],
        "/api/ativos/vistorias": [],
      })
    )
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<AtivosHomePage />)
    await waitFor(() => expect(screen.getAllByRole("link")).toHaveLength(6))
    expect(screen.getByRole("heading", { name: /Ativos e Vistorias/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Tipos de Vistoria/ })).toBeInTheDocument()
  })
})
