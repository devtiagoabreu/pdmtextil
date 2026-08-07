// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import OportunidadesPage from "./page"
import { createFetchMock, renderPage } from "@/test/harness"
import { listSmokeSpec } from "@/test/list-smoke-spec"

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { role: "ADMIN" } } }),
}))

const oportunidades = [
  {
    id: 1,
    titulo: "Venda de malha 100% algodão",
    empresaNome: "Tecelagem Alpha",
    valorEstimado: "5000",
    status: "NOVO",
    responsavelNome: "Tiago",
    probabilidade: 50,
    createdAt: "2026-07-01T10:00:00Z",
  },
  {
    id: 2,
    titulo: "Confecção de uniformes",
    empresaNome: "Confecções Lima",
    valorEstimado: "1500",
    status: "FECHADO_GANHO",
    responsavelNome: null,
    probabilidade: 0,
    createdAt: "2026-07-02T10:00:00Z",
  },
]

listSmokeSpec({
  title: "OportunidadesPage",
  component: <OportunidadesPage />,
  apiUrl: "/api/crm/oportunidades",
  heading: "Oportunidades",
  emptyText: "Nenhuma oportunidade encontrada",
  searchPlaceholder: "Buscar por título ou pessoa...",
  newLinkText: "Nova Oportunidade",
  newHref: "/comercial/crm/oportunidades/novo",
  editHref: (item) => `/comercial/crm/oportunidades/${item.id}`,
  primaryField: "titulo",
  data: oportunidades,
  firstItemText: "Venda de malha 100% algodão",
  secondItemText: "Confecção de uniformes",
  matchQuery: "malha",
})

describe("OportunidadesPage kanban", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/oportunidades") return { json: oportunidades }
      return { json: null }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("alterna para o kanban", async () => {
    renderPage(<OportunidadesPage />)

    await screen.findByText("Venda de malha 100% algodão")
    fireEvent.click(screen.getByRole("button", { name: "Kanban" }))

    expect(await screen.findByRole("button", { name: "Flutuar" })).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    expect(screen.getByText("Venda de malha 100% algodão")).toBeInTheDocument()
  })
})
