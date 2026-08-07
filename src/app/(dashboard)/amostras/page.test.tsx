// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import AmostrasPage from "./page"
import { createFetchMock, navMock, renderPage } from "@/test/harness"

const tecidoCru = [
  {
    id: 1,
    produtoCruId: 7,
    descricao: "Amostra inicial",
    status: "EM_DESENVOLVIMENTO",
    data: "2026-07-01",
    produtoCodigo: "TEC-001",
    produtoDescricao: "Sarja Cru 200g",
    tipoAmostra: "TECIDO_CRU",
  },
]

const acabamento = [
  {
    id: 2,
    produtoCruId: 8,
    acabamentoId: 3,
    descricao: "Amostra final",
    status: "APROVADA",
    data: "2026-07-02",
    produtoCodigo: "TEC-002",
    produtoDescricao: "Sarja Acabada",
    acabamentoDescricao: "Tingimento Azul",
    tipoAmostra: "ACABAMENTO",
  },
]

const statuses = [
  { id: 1, nome: "EM_DESENVOLVIMENTO", rotulo: "Em Desenvolvimento", tipo: "AMOSTRA", cor: "#f59e0b", ordem: 1, ativo: true },
  { id: 2, nome: "APROVADA", rotulo: "Aprovada", tipo: "AMOSTRA", cor: "#22c55e", ordem: 2, ativo: true },
]

function handler(tecido = tecidoCru, acab = acabamento) {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/amostras") return { json: { tecidoCru: tecido, acabamento: acab } }
    if (method === "GET" && url === "/api/admin/status?tipo=AMOSTRA") return { json: statuses }
    return { json: null }
  }
}

describe("AmostrasPage", () => {
  beforeEach(() => {
    navMock.reset()
    navMock.setPathname("/amostras")
  })

  it("renderiza o heading e a lista de amostras de tecido cru", async () => {
    vi.stubGlobal("fetch", createFetchMock(handler()).fn)
    renderPage(<AmostrasPage />)

    expect(screen.getByRole("heading", { name: "Amostras de Desenvolvimento" })).toBeInTheDocument()
    expect(await screen.findByText("TEC-001")).toBeInTheDocument()
    expect(screen.getByText("Sarja Cru 200g")).toBeInTheDocument()
    expect(screen.getByText("Em Desenvolvimento")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Kanban" })).toHaveAttribute("href", "/amostras/kanban")
  })

  it("alterna para a aba de acabamento", async () => {
    vi.stubGlobal("fetch", createFetchMock(handler()).fn)
    renderPage(<AmostrasPage />)

    await screen.findByText("TEC-001")
    fireEvent.click(screen.getByRole("button", { name: /Acabamento/ }))

    expect(await screen.findByText("TEC-002")).toBeInTheDocument()
    expect(screen.getByText("Sarja Acabada")).toBeInTheDocument()
    expect(screen.getByText("Tingimento Azul")).toBeInTheDocument()
    expect(screen.getByText("Aprovada")).toBeInTheDocument()
  })

  it("mostra estado vazio quando não há amostras", async () => {
    vi.stubGlobal("fetch", createFetchMock(handler([], [])).fn)
    renderPage(<AmostrasPage />)

    expect(await screen.findByText("Nenhuma amostra encontrada")).toBeInTheDocument()
  })
})
