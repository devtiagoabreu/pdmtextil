// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen } from "@testing-library/react"
import Page from "./page"
import { renderPage, createFetchMock, navMock, routeJson } from "@/test/harness"

vi.mock("@/lib/info-content", () => ({
  getInfoContent: vi.fn(() => ({ title: "Tipo de Vistoria", description: "" })),
}))

describe("TipoVistoriaForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navMock.reset()
    vi.stubGlobal("alert", vi.fn())
    vi.stubGlobal("confirm", vi.fn(() => true))
  })

  it("renderiza novo tipo", async () => {
    navMock.setParams({ id: "novo" })
    navMock.setPathname("/ativos/tipos-vistoria/novo")
    const fetchMock = createFetchMock(
      routeJson({ "/api/processos/areas": [] })
    )
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<Page />)
    expect(
      await screen.findByRole("heading", { name: /Novo Tipo de Vistoria/i })
    ).toBeInTheDocument()
  })
})
