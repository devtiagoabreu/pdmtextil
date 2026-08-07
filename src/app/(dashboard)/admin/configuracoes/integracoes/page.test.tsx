// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import IntegracoesPage from "./page"
import { createFetchMock, renderPage } from "@/test/harness"

const integracoes = [
  { id: 1, nome: "ERP TOTVS", baseUrl: "https://erp.totvs.com/api", tipoAuth: "bearer", authConfig: {}, telas: ["produtos"], mapping: {}, ativo: true },
]

function setup() {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/admin/integracoes") return { json: integracoes }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
}

describe("IntegracoesPage", () => {
  it("renderiza heading e lista de integrações", async () => {
    setup()
    renderPage(<IntegracoesPage />)

    expect(await screen.findByRole("heading", { name: "Integrações" })).toBeInTheDocument()
    expect(screen.getByText("ERP TOTVS")).toBeInTheDocument()
    expect(screen.getByText("https://erp.totvs.com/api")).toBeInTheDocument()
    expect(screen.getByText("Ativo")).toBeInTheDocument()
    expect(screen.getByText("produtos")).toBeInTheDocument()
  })

  it("mostra estado vazio quando não há integrações", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/integracoes") return { json: [] }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<IntegracoesPage />)

    expect(await screen.findByText("Nenhuma integração cadastrada")).toBeInTheDocument()
  })
})
