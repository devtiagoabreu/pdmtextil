// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import TiposVistoriaPage from "./page"
import { renderPage, createFetchMock, navMock, routeJson } from "@/test/harness"

vi.mock("@/lib/info-content", () => ({
  getInfoContent: vi.fn(() => ({ title: "Tipos de Vistoria", description: "" })),
}))

describe("TiposVistoriaPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navMock.reset()
    navMock.setPathname("/ativos/tipos-vistoria")
  })

  it("renderiza lista vazia", async () => {
    const fetchMock = createFetchMock(routeJson({ "/api/ativos/tipos-vistoria": [] }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<TiposVistoriaPage />)
    expect(
      await screen.findByRole("heading", { name: /Tipos de Vistoria/i })
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText(/nenhum tipo de vistoria/i)).toBeInTheDocument()
    )
  })
})
