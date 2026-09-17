// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import ChamadoNovoPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

const AREAS_MOCK = [
  { id: 1, nome: "T.I.", siteNome: "Matriz" },
  { id: 2, nome: "Manutenção", siteNome: null },
]
const ATIVOS_MOCK = [
  { id: 10, nome: "Impressora Corte", codigo: "IMP-001" },
  { id: 11, nome: "Luminária Galpão B", codigo: "LUM-002" },
]
const PROCESSOS_MOCK = [{ id: 20, nome: "Corte", codigo: "PROC-1" }]

function mountPage() {
  navMock.setPathname("/chamados/novo")
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/processos/areas") return { json: AREAS_MOCK }
    if (method === "GET" && url === "/api/ativos") return { json: ATIVOS_MOCK }
    if (method === "GET" && url === "/api/processos/processos") return { json: PROCESSOS_MOCK }
    if (method === "POST" && url === "/api/chamados") {
      return { status: 201, json: { id: 42 } }
    }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

function preencherFormulario() {
  const form = document.querySelector("form")!
  fireEvent.change(screen.getByLabelText("Título"), {
    target: { value: "Impressora não imprime" },
  })
  fireEvent.change(screen.getByLabelText("Descrição"), {
    target: { value: "Setor de corte sem impressora" },
  })
  fireEvent.change(screen.getByLabelText("Fila (área responsável)"), {
    target: { value: "1" },
  })
  return form
}

describe("ChamadoNovoPage", () => {
  beforeEach(() => {
    navMock.reset()
    toastMock.success.mockClear()
    toastMock.error.mockClear()
  })

  it("renderiza o formulário novo com selects preenchidos", async () => {
    mountPage()
    renderPage(<ChamadoNovoPage />)

    expect(await screen.findByRole("heading", { name: "Novo Chamado" })).toBeInTheDocument()
    expect(screen.getByLabelText("Título")).toBeInTheDocument()
    expect(screen.getByLabelText("Descrição")).toBeInTheDocument()
    expect(screen.getByLabelText("Categoria")).toBeInTheDocument()
    expect(screen.getByLabelText("Prioridade")).toBeInTheDocument()

    const fila = screen.getByLabelText("Fila (área responsável)")
    expect(await screen.findByLabelText("Fila (área responsável)")).toBeInTheDocument()
    await waitFor(() => {
      expect(
        Array.from(fila.querySelectorAll("option")).some((o) => o.textContent?.includes("T.I."))
      ).toBe(true)
    })
  })

  it("valida obrigatórios", async () => {
    mountPage()
    renderPage(<ChamadoNovoPage />)
    await screen.findByLabelText("Fila (área responsável)")

    const form = document.querySelector("form")!
    fireEvent.submit(form)

    expect(toastMock.error).toHaveBeenCalledWith("Informe o título")
  })

  it("cria chamado via POST e navega para o detalhe", async () => {
    const fetchMock = mountPage()
    renderPage(<ChamadoNovoPage />)
    await screen.findByLabelText("Fila (área responsável)")

    fireEvent.submit(preencherFormulario())

    await waitFor(() =>
      expect(findCall(fetchMock.calls, "/api/chamados", "POST")).toBeDefined()
    )
    const call = findCall(fetchMock.calls, "/api/chamados", "POST")
    const body = (call?.body ?? {}) as Record<string, unknown>
    expect(body).toMatchObject({
      titulo: "Impressora não imprime",
      descricao: "Setor de corte sem impressora",
      categoria: "SOLICITACAO",
      prioridade: "MEDIA",
      areaId: 1,
      ativoId: null,
      processoId: null,
      anexos: [],
    })
    await waitFor(() => expect(navMock.router.push).toHaveBeenCalledWith("/chamados/42"))
    expect(toastMock.success).toHaveBeenCalledWith("Chamado aberto!")
  })
})