// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { HistoricoTab } from "./historico-tab"
import { createFetchMock, renderPage } from "@/test/harness"

const envios = [
  { id: 1, email: "ana@empresa.com", nome: "Ana Souza", assunto: "Promo Julho", status: "enviado", error: null, abertoEm: "2026-07-10T10:00:00.000Z", createdAt: "2026-07-09T10:00:00.000Z", totalCliques: 3 },
  { id: 2, email: "bruno@empresa.com", nome: "Bruno Lima", assunto: "Informativo", status: "enviado", error: null, abertoEm: null, createdAt: "2026-07-11T10:00:00.000Z", totalCliques: 1 },
  { id: 3, email: "carla@empresa.com", nome: "Carla Dias", assunto: "Promo Julho", status: "erro", error: "550 rejected", abertoEm: null, createdAt: "2026-07-12T10:00:00.000Z", totalCliques: 0 },
]

function setup() {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/admin/email-massa/disparos") return { json: { disparos: [] } }
    if (method === "GET" && url === "/api/admin/email-massa/historico") {
      return { json: { envios, stats: { total: 3, enviados: 2, lidos: 1, falhas: 1, totalCliques: 4 } } }
    }
    return { json: null }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("HistoricoTab", () => {
  it("renderiza os envios do histórico", async () => {
    setup()
    renderPage(<HistoricoTab />)

    expect(await screen.findByText("ana@empresa.com")).toBeInTheDocument()
    expect(screen.getByText("bruno@empresa.com")).toBeInTheDocument()
    expect(screen.getByText("carla@empresa.com")).toBeInTheDocument()
  })

  it("ordena ao clicar no cabeçalho da coluna", async () => {
    setup()
    renderPage(<HistoricoTab />)
    await screen.findByText("ana@empresa.com")

    fireEvent.click(screen.getByRole("button", { name: /Email/ }))

    expect(screen.getByRole("columnheader", { name: /Email/ })).toHaveAttribute("aria-sort", "ascending")
    let rows = screen.getAllByRole("row").slice(1)
    expect(rows[0]).toHaveTextContent("ana@empresa.com")
    expect(rows[2]).toHaveTextContent("carla@empresa.com")

    fireEvent.click(screen.getByRole("button", { name: /Email/ }))

    expect(screen.getByRole("columnheader", { name: /Email/ })).toHaveAttribute("aria-sort", "descending")
    rows = screen.getAllByRole("row").slice(1)
    expect(rows[0]).toHaveTextContent("carla@empresa.com")
    expect(rows[2]).toHaveTextContent("ana@empresa.com")
  })

  it("ordena Cliques por padrão do maior para o menor", async () => {
    setup()
    renderPage(<HistoricoTab />)
    await screen.findByText("ana@empresa.com")

    fireEvent.click(screen.getByRole("button", { name: /Cliques/ }))

    expect(screen.getByRole("columnheader", { name: /Cliques/ })).toHaveAttribute("aria-sort", "descending")
    const rows = screen.getAllByRole("row").slice(1)
    expect(rows[0]).toHaveTextContent("ana@empresa.com")
    expect(rows[2]).toHaveTextContent("carla@empresa.com")
  })

  it("filtra com debounce ao digitar na busca", async () => {
    setup()
    renderPage(<HistoricoTab />)
    await screen.findByText("ana@empresa.com")

    fireEvent.change(screen.getByLabelText("Buscar no histórico"), { target: { value: "carla" } })

    expect(screen.getByText("ana@empresa.com")).toBeInTheDocument()

    await waitFor(() => expect(screen.queryByText("ana@empresa.com")).not.toBeInTheDocument(), { timeout: 2000 })
    expect(screen.getByText("carla@empresa.com")).toBeInTheDocument()
    expect(screen.queryByText("bruno@empresa.com")).not.toBeInTheDocument()
  })

  it("limpa a busca ao clicar no botão limpar", async () => {
    setup()
    renderPage(<HistoricoTab />)
    await screen.findByText("ana@empresa.com")

    fireEvent.change(screen.getByLabelText("Buscar no histórico"), { target: { value: "carla" } })
    await waitFor(() => expect(screen.queryByText("ana@empresa.com")).not.toBeInTheDocument(), { timeout: 2000 })

    fireEvent.click(screen.getByRole("button", { name: "Limpar busca" }))

    expect(screen.getByText("ana@empresa.com")).toBeInTheDocument()
    expect(screen.getByText("bruno@empresa.com")).toBeInTheDocument()
  })
})
