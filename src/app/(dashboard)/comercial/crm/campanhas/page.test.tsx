// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import CampanhasPage from "./page"
import { createFetchMock, renderPage } from "@/test/harness"
import { listSmokeSpec } from "@/test/list-smoke-spec"

const campanhas = [
  {
    id: 1,
    nome: "Lançamento Verão",
    tipo: "EMAIL",
    status: "ATIVA",
    dataInicio: "2026-07-01",
    leadsGerados: 12,
    orcamento: 5000,
  },
  {
    id: 2,
    nome: "WhatsApp Promo",
    tipo: "WHATSAPP",
    status: "PAUSADA",
    dataInicio: "2026-07-05",
    leadsGerados: 0,
    orcamento: null,
  },
]

const statuses = [
  { id: 1, nome: "ATIVA", rotulo: "Ativa", cor: "#22c55e", ordem: 1, ativo: true },
  { id: 2, nome: "PAUSADA", rotulo: "Pausada", cor: "#f59e0b", ordem: 2, ativo: true },
  { id: 3, nome: "CONCLUIDA", rotulo: "Concluída", cor: "#64748b", ordem: 3, ativo: true },
]

listSmokeSpec({
  title: "CampanhasPage",
  component: <CampanhasPage />,
  apiUrl: "/api/crm/campanhas",
  heading: "Campanhas",
  emptyText: "Nenhuma campanha cadastrada",
  searchPlaceholder: "Buscar por nome ou tipo...",
  newLinkText: "Nova Campanha",
  newHref: "/comercial/crm/campanhas/nova",
  editHref: (item) => `/comercial/crm/campanhas/${item.id}`,
  primaryField: "nome",
  data: campanhas,
  firstItemText: "Lançamento Verão",
  secondItemText: "WhatsApp Promo",
  matchQuery: "Verão",
})

describe("CampanhasPage kanban", () => {
  beforeEach(() => {
    class BroadcastChannelStub {
      postMessage() {}
      close() {}
    }
    vi.stubGlobal("BroadcastChannel", BroadcastChannelStub)
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/campanhas") return { json: campanhas }
      if (method === "GET" && url === "/api/admin/status?tipo=CAMPANHA") return { json: statuses }
      return { json: null }
    }
    vi.stubGlobal("fetch", createFetchMock(handler).fn)
  })

  it("alterna para o kanban e mostra as colunas de status", async () => {
    renderPage(<CampanhasPage />)

    fireEvent.click(screen.getByRole("button", { name: "Kanban" }))

    expect(await screen.findByText("Ativa")).toBeInTheDocument()
    expect(screen.getByText("Pausada")).toBeInTheDocument()
    expect(screen.getByText("Concluída")).toBeInTheDocument()
    expect(screen.getByText("Lançamento Verão")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Flutuar" })).toBeInTheDocument()
  })
})
