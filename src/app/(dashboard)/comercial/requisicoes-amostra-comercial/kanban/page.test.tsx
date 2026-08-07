// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, navMock } from "@/test/harness"
import KanbanAmostraComercialPage from "./page"

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { role: "ADMIN" } }, status: "authenticated" }),
}))

describe("KanbanAmostraComercialPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "BroadcastChannel",
      class {
        onmessage: any = null
        onmessageerror: any = null
        postMessage() {}
        close() {}
      },
    )
    const fetchMock = createFetchMock(({ url }) => {
      if (url === "/api/admin/status?tipo=AMOSTRA_COMERCIAL") return { json: [] }
      if (url === "/api/requisicoes-amostra-comercial") return { json: [] }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    navMock.setPathname("/comercial/requisicoes-amostra-comercial/kanban")
  })

  it("renderiza o kanban com as ações de navegação", async () => {
    renderPage(<KanbanAmostraComercialPage />)

    expect(screen.getByRole("heading", { name: /Kanban — Amostras Comerciais/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Lista" })).toHaveAttribute("href", "/comercial/requisicoes-amostra-comercial")
    expect(screen.getByRole("link", { name: /Nova/ })).toHaveAttribute("href", "/comercial/requisicoes-amostra-comercial/novo")
    expect(screen.getByRole("button", { name: "Flutuar" })).toBeInTheDocument()
  })
})
