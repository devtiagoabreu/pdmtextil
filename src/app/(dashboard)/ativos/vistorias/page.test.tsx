// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import AtivosVistoriasPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

const HOJE = new Date().toISOString().slice(0, 10)

const VISTORIAS_MOCK = [
  {
    id: 1,
    ativoId: 10,
    ativoNome: "Gerador",
    ativoCodigo: "A-001",
    tipoVistoriaId: 1,
    tipoVistoriaNome: "Grupo Gerador",
    planoId: 5,
    status: "PENDENTE",
    dataProgramada: "2026-01-10",
    dataRealizada: null,
    resultado: null,
    observacoes: null,
    executadoPorId: null,
    executadoPorNome: null,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    ativoId: 11,
    ativoNome: "Compressor",
    ativoCodigo: "A-002",
    tipoVistoriaId: 2,
    tipoVistoriaNome: "Compressor Ar",
    planoId: 6,
    status: "CONCLUIDA",
    dataProgramada: "2026-01-05",
    dataRealizada: "2026-01-05",
    resultado: "CONFORME",
    observacoes: null,
    executadoPorId: 1,
    executadoPorNome: "João",
    createdAt: "2026-01-01T00:00:00Z",
  },
]

describe("AtivosVistoriasPage", () => {
  it("renderiza lista com vistorias", async () => {
    navMock.setPathname("/ativos/vistorias")
    const fetchMock = createFetchMock(({ url }) => {
      if (url === "/api/ativos/vistorias") return { json: VISTORIAS_MOCK }
      if (url === "/api/usuarios/ativos") return { json: [] }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<AtivosVistoriasPage />)

    expect(await screen.findByText("Gerador")).toBeDefined()
    expect(screen.getByText("A-001")).toBeDefined()
    expect(screen.getByText("Compressor")).toBeDefined()
    const rowCompressor = screen.getByText("Compressor").closest("tr")!
    expect(within(rowCompressor).getByText("CONCLUIDA")).toBeDefined()
  })

  it("filtra por status", async () => {
    navMock.setPathname("/ativos/vistorias")
    const fetchMock = createFetchMock(({ url }) => {
      if (url === "/api/ativos/vistorias") return { json: VISTORIAS_MOCK }
      if (url === "/api/usuarios/ativos") return { json: [] }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<AtivosVistoriasPage />)

    await screen.findByText("Gerador")

    fireEvent.click(screen.getByRole("button", { name: "PENDENTE" }))

    expect(screen.getByText("Gerador")).toBeDefined()
    expect(screen.queryByText("Compressor")).toBeNull()
  })

  it("filtra apenas atrasadas", async () => {
    navMock.setPathname("/ativos/vistorias")
    const fetchMock = createFetchMock(({ url }) => {
      if (url === "/api/ativos/vistorias") return { json: VISTORIAS_MOCK }
      if (url === "/api/usuarios/ativos") return { json: [] }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<AtivosVistoriasPage />)

    await screen.findByText("Gerador")

    const checkbox = screen.getByRole("checkbox", { name: /Apenas atrasadas/ })
    fireEvent.click(checkbox)

    expect(screen.getByText("Gerador")).toBeDefined()
    expect(screen.queryByText("Compressor")).toBeNull()
  })

  it("abre dialog de execução ao clicar Executar", async () => {
    navMock.setPathname("/ativos/vistorias")
    const fetchMock = createFetchMock(({ url }) => {
      if (url === "/api/ativos/vistorias") return { json: VISTORIAS_MOCK }
      if (url === "/api/usuarios/ativos") return { json: [{ id: 1, name: "João" }] }
      if (url === "/api/ativos/tipos-vistoria/1") {
        return {
          json: {
            id: 1,
            nome: "Grupo Gerador",
            checklist: [
              { ordem: 0, pergunta: "Bateria OK?", tipo: "SIM_NAO", obrigatorio: true },
            ],
          },
        }
      }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<AtivosVistoriasPage />)

    fireEvent.click(await screen.findByRole("button", { name: /Executar/ }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText(/Executar Vistoria/)).toBeDefined()
    expect(within(dialog).getByText("Bateria OK?")).toBeDefined()
  })

  it("conclui vistoria com toast e fecha dialog", async () => {
    navMock.setPathname("/ativos/vistorias")
    const fetchMock = createFetchMock(({ method, url }) => {
      if (url === "/api/ativos/vistorias") return { json: VISTORIAS_MOCK }
      if (url === "/api/usuarios/ativos") return { json: [] }
      if (url === "/api/ativos/tipos-vistoria/1") {
        return {
          json: {
            id: 1,
            nome: "Grupo Gerador",
            checklist: [
              { ordem: 0, pergunta: "Bateria OK?", tipo: "SIM_NAO", obrigatorio: true },
            ],
          },
        }
      }
      if (method === "POST" && url === "/api/ativos/vistorias/1/concluir") {
        return { json: { ok: true } }
      }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<AtivosVistoriasPage />)

    fireEvent.click(await screen.findByRole("button", { name: /Executar/ }))

    const dialog = await screen.findByRole("dialog")

    fireEvent.click(within(dialog).getByRole("button", { name: /Concluir/ }))

    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith("Vistoria concluída com sucesso")
    })

    const concluirCall = findCall(fetchMock.calls, "/api/ativos/vistorias/1/concluir", "POST")
    expect(concluirCall).toBeDefined()
    expect(concluirCall?.body?.status).toBe("CONCLUIDA")
  })
})
