// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import ChamadoDetalhePage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

const TICKET_MOCK = {
  id: 7,
  titulo: "Impressora não imprime",
  descricao: "Setor de corte sem impressora",
  categoria: "INCIDENTE",
  status: "ABERTO",
  prioridade: "ALTA",
  areaId: 1,
  areaNome: "T.I.",
  solicitanteId: 1,
  solicitanteNome: "João",
  responsavelId: null,
  responsavelNome: null,
  ativoId: 10,
  ativoNome: "Impressora Corte",
  ativoCodigo: "IMP-001",
  processoId: null,
  processoNome: null,
  slaPrimeiraRespostaPrazo: "2026-09-18T14:00:00.000Z",
  slaResolucaoPrazo: "2026-09-19T14:00:00.000Z",
  primeiraRespostaEm: null,
  resolvidoEm: null,
  fechadoEm: null,
  createdAt: "2026-09-17T10:00:00.000Z",
  updatedAt: "2026-09-17T10:00:00.000Z",
  mensagens: [
    {
      id: 1,
      autorId: null,
      autorNome: null,
      tipo: "SISTEMA",
      mensagem: "[SLA] SLA_ALERTA_PRIMEIRA_RESPOSTA",
      createdAt: "2026-09-17T10:05:00.000Z",
    },
    {
      id: 2,
      autorId: 1,
      autorNome: "João",
      tipo: "RESPOSTA",
      mensagem: "Segue o detalhamento do problema.",
      anexos: [{ nome: "foto", url: "https://exemplo.com/foto" }],
      createdAt: "2026-09-17T11:00:00.000Z",
    },
    {
      id: 3,
      autorId: 3,
      autorNome: "Carlos",
      tipo: "NOTA",
      mensagem: "Nota interna do atendente.",
      createdAt: "2026-09-17T12:00:00.000Z",
    },
  ],
}

const AREAS_MOCK = [{ id: 1, nome: "T.I.", siteNome: "Matriz" }]
const ATIVOS_MOCK = [{ id: 10, nome: "Impressora Corte", codigo: "IMP-001" }]
const PROCESSOS_MOCK: unknown[] = []

function mountPage(data: unknown = TICKET_MOCK) {
  navMock.setPathname("/chamados/7")
  navMock.setParams({ id: "7" })
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/chamados/7") return { json: data }
    if (method === "GET" && url === "/api/processos/areas") return { json: AREAS_MOCK }
    if (method === "GET" && url === "/api/ativos") return { json: ATIVOS_MOCK }
    if (method === "GET" && url === "/api/processos/processos") return { json: PROCESSOS_MOCK }
    if (method === "POST" && url === "/api/chamados/7/mensagens") {
      return { status: 201, json: {} }
    }
    if (method === "POST" && url === "/api/chamados/7/assumir") {
      return { json: {} }
    }
    if (method === "PATCH" && url === "/api/chamados/7/status") {
      return { json: {} }
    }
    if (method === "PUT" && url === "/api/chamados/7") {
      return { json: {} }
    }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("ChamadoDetalhePage", () => {
  beforeEach(() => {
    navMock.reset()
    toastMock.success.mockClear()
    toastMock.error.mockClear()
  })

  it("renderiza detalhe, badges e mensagens", async () => {
    mountPage()
    renderPage(<ChamadoDetalhePage />)

    expect(
      await screen.findByRole("heading", { name: /Impressora não imprime/ })
    ).toBeInTheDocument()
    expect(screen.getAllByText("João").length).toBeGreaterThan(0)
    expect(screen.getByText("T.I.")).toBeInTheDocument()
    expect(screen.getByText("IMP-001 — Impressora Corte")).toBeInTheDocument()
    expect(screen.getByText("Sistema")).toBeInTheDocument()
    expect(screen.getByText("Segue o detalhamento do problema.")).toBeInTheDocument()
    expect(screen.getByText("Nota interna do atendente.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "foto" })).toHaveAttribute(
      "href",
      "https://exemplo.com/foto"
    )
  })

  it("envia mensagem via POST", async () => {
    const fetchMock = mountPage()
    renderPage(<ChamadoDetalhePage />)
    await screen.findByText("Segue o detalhamento do problema.")

    const textarea = screen.getByPlaceholderText("Escreva sua resposta...")
    fireEvent.change(textarea, { target: { value: "Nova resposta do atendimento" } })
    fireEvent.click(screen.getByLabelText("Resposta"))
    fireEvent.submit(document.querySelector("form")!)

    await waitFor(() =>
      expect(findCall(fetchMock.calls, "/api/chamados/7/mensagens", "POST")).toBeDefined()
    )
    const call = findCall(fetchMock.calls, "/api/chamados/7/mensagens", "POST")
    expect(call?.body).toMatchObject({
      tipo: "RESPOSTA",
      mensagem: "Nova resposta do atendimento",
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Mensagem enviada"))
  })

  it("assume o chamado", async () => {
    const fetchMock = mountPage()
    renderPage(<ChamadoDetalhePage />)
    await screen.findByText("Segue o detalhamento do problema.")

    fireEvent.click(screen.getByRole("button", { name: "Assumir chamado" }))

    await waitFor(() =>
      expect(findCall(fetchMock.calls, "/api/chamados/7/assumir", "POST")).toBeDefined()
    )
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Chamado assumido"))
  })

  it("muda o status via PATCH", async () => {
    const fetchMock = mountPage()
    renderPage(<ChamadoDetalhePage />)
    await screen.findByText("Segue o detalhamento do problema.")

    fireEvent.change(screen.getByLabelText("Mudar status"), { target: { value: "AGUARDANDO" } })

    await waitFor(() =>
      expect(findCall(fetchMock.calls, "/api/chamados/7/status", "PATCH")).toBeDefined()
    )
    const call = findCall(fetchMock.calls, "/api/chamados/7/status", "PATCH")
    expect(call?.body).toEqual({ status: "AGUARDANDO" })
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Status atualizado para Aguardando")
    )
  })

  it("edita o chamado via PUT", async () => {
    const fetchMock = mountPage()
    renderPage(<ChamadoDetalhePage />)
    await screen.findByText("Segue o detalhamento do problema.")

    fireEvent.click(screen.getByRole("button", { name: "Editar" }))
    const editForm = screen.getByText("Editar chamado").closest("form")!
    fireEvent.change(within(editForm).getByLabelText("Título"), {
      target: { value: "Impressora do corte com erro" },
    })
    fireEvent.submit(editForm)

    await waitFor(() =>
      expect(findCall(fetchMock.calls, "/api/chamados/7", "PUT")).toBeDefined()
    )
    const call = findCall(fetchMock.calls, "/api/chamados/7", "PUT")
    const body = (call?.body ?? {}) as Record<string, unknown>
    expect(body.titulo).toBe("Impressora do corte com erro")
    expect(body.categoria).toBe("INCIDENTE")
    expect(body.areaId).toBe(1)
    expect(body.ativoId).toBe(10)
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Chamado atualizado"))
  })
})