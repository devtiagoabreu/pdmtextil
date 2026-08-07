// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, navMock } from "@/test/harness"
import KanbanSolicitacoesPage from "./page"

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { role: "ADMIN" } }, status: "authenticated" }),
}))

describe("KanbanSolicitacoesPage", () => {
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
      if (url === "/api/admin/status?tipo=SOLICITACAO_DESENVOLVIMENTO") return { json: [] }
      if (url === "/api/solicitacoes") return { json: [] }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    navMock.setPathname("/comercial/solicitacoes/kanban")
  })

  it("renderiza o kanban com as ações de navegação", async () => {
    renderPage(<KanbanSolicitacoesPage />)

    expect(screen.getByRole("heading", { name: /Kanban — Solicitações de Desenvolvimento/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Lista" })).toHaveAttribute("href", "/comercial/solicitacoes")
    expect(screen.getByRole("link", { name: /Nova/ })).toHaveAttribute("href", "/comercial/solicitacoes/nova")
    expect(screen.getByRole("button", { name: "Flutuar" })).toBeInTheDocument()
  })
})
