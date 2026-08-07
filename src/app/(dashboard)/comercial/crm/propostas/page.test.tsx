// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import PropostasPage from "./page"
import { createFetchMock, renderPage } from "@/test/harness"
import { listSmokeSpec } from "@/test/list-smoke-spec"

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { role: "ADMIN" } } }),
}))

const propostas = [
  {
    id: 1,
    titulo: "Proposta Comercial - Tecido X",
    empresaNome: "Tecelagem Alpha",
    valor: 5000,
    status: "ENVIADA",
    createdAt: "2026-07-01T10:00:00Z",
  },
  {
    id: 2,
    titulo: "Proposta de Confecção - Malha Y",
    empresaNome: "Confecções Lima",
    valor: 1500,
    status: "ACEITA",
    createdAt: "2026-07-02T10:00:00Z",
  },
]

listSmokeSpec({
  title: "PropostasPage",
  component: <PropostasPage />,
  apiUrl: "/api/crm/propostas",
  heading: "Propostas",
  emptyText: "Nenhuma proposta encontrada",
  searchPlaceholder: "Buscar por pessoa ou título...",
  newLinkText: "Nova Proposta",
  newHref: "/comercial/crm/propostas/novo",
  editHref: (item) => `/comercial/crm/propostas/${item.id}`,
  primaryField: "titulo",
  data: propostas,
  firstItemText: "Proposta Comercial - Tecido X",
  secondItemText: "Proposta de Confecção - Malha Y",
  matchQuery: "Tecido",
})

describe("PropostasPage kanban", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/propostas") return { json: propostas }
      return { json: null }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("alterna para o kanban", async () => {
    renderPage(<PropostasPage />)

    await screen.findByText("Proposta Comercial - Tecido X")
    fireEvent.click(screen.getByRole("button", { name: "Kanban" }))

    expect(await screen.findByRole("button", { name: "Flutuar" })).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    expect(screen.getByText("Proposta Comercial - Tecido X")).toBeInTheDocument()
  })
})
