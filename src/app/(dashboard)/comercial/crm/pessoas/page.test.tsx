// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import CrmPessoasPage from "./page"
import { createFetchMock, renderPage } from "@/test/harness"
import { listSmokeSpec } from "@/test/list-smoke-spec"

const pessoas = [
  {
    id: 1,
    tipoPessoa: "PJ",
    razaoSocial: "Tecelagem Alpha",
    nomeFantasia: "Alpha Confecções",
    cnpj: "12.345.678/0001-90",
    segmento: "Têxtil",
    status: "QUALIFICADO",
    responsavelNome: "Tiago",
    createdAt: "2026-07-01T10:00:00Z",
  },
  {
    id: 2,
    tipoPessoa: "PJ",
    razaoSocial: "Confecções Lima",
    nomeFantasia: "Lima",
    cnpj: "98.765.432/0001-10",
    segmento: "Confecção",
    status: "NOVO",
    responsavelNome: null,
    createdAt: "2026-07-02T10:00:00Z",
  },
]

listSmokeSpec({
  title: "PessoasPage",
  component: <CrmPessoasPage />,
  apiUrl: "/api/crm/pessoas",
  heading: "Pessoas (Negócios)",
  emptyText: "Nenhuma pessoa encontrada",
  searchPlaceholder: "Buscar pessoas...",
  newLinkText: "Nova Pessoa",
  newHref: "/comercial/crm/pessoas/novo",
  editHref: (item) => `/comercial/crm/pessoas/${item.id}`,
  primaryField: "razaoSocial",
  data: pessoas,
  firstItemText: "Tecelagem Alpha",
  secondItemText: "Confecções Lima",
  matchQuery: "Tecelagem",
})

describe("PessoasPage kanban", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/pessoas") return { json: pessoas }
      return { json: null }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("alterna para o kanban", async () => {
    renderPage(<CrmPessoasPage />)

    await screen.findByText("Tecelagem Alpha")
    fireEvent.click(screen.getByRole("button", { name: "Kanban" }))

    expect(await screen.findByRole("button", { name: "Flutuar" })).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    expect(screen.getByText("Tecelagem Alpha")).toBeInTheDocument()
  })
})
