// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import ViagemDetailPage from "./page"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"

const viagem = {
  id: 1,
  titulo: "Feira Agritech",
  descricao: "Visita à feira com clientes",
  destinoCidade: "São Paulo",
  destinoUf: "SP",
  dataInicio: "2026-07-01",
  dataFim: "2026-07-05",
  status: "PLANEJADA",
  investimentos: [
    { id: 10, viagemId: 1, tipo: "PASSAGEM", valor: "500", observacao: "Voo ida e volta" },
  ],
  visitas: [
    { id: 3, dataVisita: "2026-07-02", hora: "10:00", empresaNome: "Tecelagem Alpha", clienteNome: null, nomeAvulso: null },
  ],
}

describe("ViagemDetailPage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/crm/viagens/1")
    navMock.setParams({ id: "1" })
  })

  it("carrega e exibe os detalhes da viagem", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/viagens/1") return { json: viagem }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<ViagemDetailPage />)

    expect(await screen.findByRole("heading", { name: "Feira Agritech" })).toBeInTheDocument()
    expect(screen.getByText("Planejada")).toBeInTheDocument()
    expect(screen.getAllByText("R$ 500,00").length).toBeGreaterThan(0)
    expect(screen.getByText("PASSAGEM")).toBeInTheDocument()
    expect(screen.getByText("Tecelagem Alpha")).toBeInTheDocument()
    expect(screen.getByText("Visita à feira com clientes")).toBeInTheDocument()
  })

  it("edita e salva via PUT", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/viagens/1") return { json: viagem }
      if (method === "PUT" && url === "/api/crm/viagens/1") return { json: { ...viagem, titulo: "Feira 2026" } }
      if (method === "GET" && url === "/api/crm/estados") return { json: [] }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<ViagemDetailPage />)

    fireEvent.click(await screen.findByRole("button", { name: "Editar" }))
    const tituloInput = screen.getByDisplayValue("Feira Agritech")
    fireEvent.change(tituloInput, { target: { value: "Feira 2026" } })
    fireEvent.click(screen.getByRole("button", { name: "Salvar Alterações" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/viagens/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body.titulo).toBe("Feira 2026")
      expect(call!.body.investimentos).toEqual([{ tipo: "PASSAGEM", valor: 500, observacao: "Voo ida e volta" }])
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Viagem atualizada"))
  })

  it("mostra mensagem quando a viagem não é encontrada", async () => {
    const fetchMock = createFetchMock(() => ({ json: null }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<ViagemDetailPage />)

    expect(await screen.findByText("Viagem não encontrada")).toBeInTheDocument()
  })
})
