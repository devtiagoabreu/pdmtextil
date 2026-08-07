// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen } from "@testing-library/react"
import KanbanAmostrasPage from "./page"
import { createFetchMock, navMock, renderPage } from "@/test/harness"

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: "1", name: "Tiago Teste", email: "tiago@pdtextil.com.br", role: "ADMIN" } },
    status: "authenticated",
  }),
}))

const statuses = [
  { id: 1, nome: "EM_DESENVOLVIMENTO", rotulo: "Em Desenvolvimento", tipo: "AMOSTRA", cor: "#f59e0b", ordem: 1, ativo: true },
  { id: 2, nome: "APROVADA", rotulo: "Aprovada", tipo: "AMOSTRA", cor: "#22c55e", ordem: 2, ativo: true },
]

const amostras = {
  tecidoCru: [
    {
      id: 1,
      produtoCruId: 7,
      descricao: "Amostra inicial",
      status: "EM_DESENVOLVIMENTO",
      data: "2026-07-01",
      createdAt: "2026-07-01T10:00:00Z",
      produtoCodigo: "TEC-001",
      produtoDescricao: "Sarja Cru 200g",
      tipoAmostra: "TECIDO_CRU",
    },
  ],
  acabamento: [
    {
      id: 2,
      produtoCruId: 8,
      acabamentoId: 3,
      descricao: "Amostra final",
      status: "APROVADA",
      data: "2026-07-02",
      createdAt: "2026-07-02T10:00:00Z",
      produtoCodigo: "TEC-002",
      produtoDescricao: "Sarja Acabada",
      acabamentoDescricao: "Tingimento Azul",
      tipoAmostra: "ACABAMENTO",
    },
  ],
}

function handler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/admin/status?tipo=AMOSTRA") return { json: statuses }
    if (method === "GET" && url === "/api/amostras") return { json: amostras }
    return { json: null }
  }
}

describe("KanbanAmostrasPage", () => {
  beforeEach(() => {
    navMock.reset()
    navMock.setPathname("/amostras/kanban")
    class BroadcastChannelStub {
      postMessage() {}
      close() {}
    }
    vi.stubGlobal("BroadcastChannel", BroadcastChannelStub)
  })

  it("renderiza o heading, as colunas e os cards do kanban", async () => {
    vi.stubGlobal("fetch", createFetchMock(handler()).fn)
    renderPage(<KanbanAmostrasPage />)

    expect(screen.getByRole("heading", { name: "Kanban — Amostras de Desenvolvimento" })).toBeInTheDocument()
    expect(await screen.findByText("Em Desenvolvimento")).toBeInTheDocument()
    expect(screen.getByText("Aprovada")).toBeInTheDocument()
    expect(screen.getByText("TEC-001")).toBeInTheDocument()
    expect(screen.getByText("TEC-002")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Lista" })).toHaveAttribute("href", "/amostras")
    expect(screen.getByRole("button", { name: "Flutuar" })).toBeInTheDocument()
  })
})
