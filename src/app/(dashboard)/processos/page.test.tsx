// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import ProcessosHomePage from "./page"
import { createFetchMock, navMock, renderPage } from "@/test/harness"

describe("ProcessosHomePage", () => {
  it("renderiza cards da ontologia com contagens", async () => {
    navMock.setPathname("/processos")
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method !== "GET") return { status: 404, json: { error: "Rota não mockada" } }
      const map: Record<string, unknown> = {
        "/api/processos/empresas": [{ id: 1 }],
        "/api/processos/sites": [{ id: 1 }, { id: 2 }],
        "/api/processos/areas": [],
        "/api/processos/processos": [{ id: 1 }],
        "/api/processos/subprocessos": [],
        "/api/processos/atividades": [],
      }
      return { json: map[url] ?? [] }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<ProcessosHomePage />)

    expect(screen.getByRole("heading", { name: "Engenharia de Processos" })).toBeInTheDocument()
    expect((await screen.findByText("Empresas")).closest("a")).toHaveAttribute("href", "/processos/empresas")
    expect(screen.getByText("Processos").closest("a")).toHaveAttribute("href", "/processos/processos")
    expect(screen.getByText("Atividades").closest("a")).toHaveAttribute("href", "/processos/atividades")

    await waitFor(() => expect(screen.getByText("Hierarquia do mapeamento")).toBeInTheDocument())
    expect(screen.getByText("2", { selector: "span" })).toBeInTheDocument()
  })
})