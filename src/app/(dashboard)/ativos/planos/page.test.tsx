// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import AtivosPlanosPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

const PLANOS_MOCK = [
  {
    id: 1,
    ativoNome: "Gerador",
    ativoCodigo: "A-001",
    tipoVistoriaNome: "Grupo Gerador",
    periodicidade: "MENSAL",
    responsavelNome: "João",
    proximaData: "2026-01-10",
    ativo: true,
  },
  {
    id: 2,
    ativoNome: "Bomba Hidráulica",
    ativoCodigo: "A-002",
    tipoVistoriaNome: "Bomba — Mensal",
    periodicidade: "MENSAL",
    responsavelNome: null,
    proximaData: null,
    ativo: true,
  },
]

function mountPage(data: unknown[] = PLANOS_MOCK) {
  navMock.setPathname("/ativos/planos")
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/ativos/planos") return { json: data }
    if (method === "DELETE" && url === "/api/ativos/planos/2") {
      return { status: 400, json: { error: "fk", fkError: true } }
    }
    if (method === "DELETE") return { json: { ok: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("AtivosPlanosPage", () => {
  beforeEach(() => {
    navMock.reset()
    toastMock.success.mockClear()
  })

  it("renderiza a lista com responsável do PDM", async () => {
    mountPage()
    renderPage(<AtivosPlanosPage />)

    expect(screen.getByRole("heading", { name: "Planos de Vistoria" })).toBeInTheDocument()
    expect(await screen.findByText("Gerador")).toBeInTheDocument()
    expect(screen.getByText("Bomba Hidráulica")).toBeInTheDocument()
    expect(screen.getByText("João")).toBeInTheDocument()
    const bombaRow = screen.getByText("Bomba Hidráulica").closest("tr")!
    expect(within(bombaRow).getAllByText("—")).toHaveLength(2)
  })

  it("filtra pela busca", async () => {
    mountPage()
    renderPage(<AtivosPlanosPage />)
    await screen.findByText("Gerador")

    const search = screen.getByPlaceholderText("Buscar por ativo, tipo de vistoria ou periodicidade...")
    fireEvent.change(search, { target: { value: "Gerador" } })
    expect(screen.getByText("Gerador")).toBeInTheDocument()
    expect(screen.queryByText("Bomba Hidráulica")).not.toBeInTheDocument()

    fireEvent.change(search, { target: { value: "zzz-inexistente" } })
    expect(screen.getByText("Nenhum plano encontrado")).toBeInTheDocument()
  })

  it("mostra estado vazio quando a API retorna vazio", async () => {
    mountPage([])
    renderPage(<AtivosPlanosPage />)

    expect(await screen.findByText("Nenhum plano encontrado")).toBeInTheDocument()
  })

  it("exclui um registro após confirmar no modal", async () => {
    const fetchMock = mountPage()
    renderPage(<AtivosPlanosPage />)
    await screen.findByText("Gerador")

    const row = screen.getByText("Gerador").closest("tr")!
    const trash = within(row).getAllByRole("button").find((b) => !b.closest("a"))!
    fireEvent.click(trash)

    const dialog = screen.getByRole("dialog", { name: "Excluir plano?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() =>
      expect(findCall(fetchMock.calls, "/api/ativos/planos/1", "DELETE")).toBeDefined(),
    )
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Plano excluído com sucesso"))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("bloqueia exclusão quando há vínculos (fkError)", async () => {
    const fetchMock = mountPage()
    renderPage(<AtivosPlanosPage />)
    await screen.findByText("Bomba Hidráulica")

    const row = screen.getByText("Bomba Hidráulica").closest("tr")!
    const trash = within(row).getAllByRole("button").find((b) => !b.closest("a"))!
    fireEvent.click(trash)

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }))
    await waitFor(() =>
      expect(findCall(fetchMock.calls, "/api/ativos/planos/2", "DELETE")).toBeDefined(),
    )
    const blockedDialog = await screen.findByRole("dialog", { name: "Exclusão não permitida" })
    expect(blockedDialog).toHaveTextContent(/não pode ser exclu/)

    fireEvent.click(within(blockedDialog).getByRole("button", { name: "OK" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("contém links de novo e edição", async () => {
    mountPage()
    renderPage(<AtivosPlanosPage />)
    await screen.findByText("Gerador")

    expect(screen.getByRole("link", { name: "Novo Plano" })).toHaveAttribute("href", "/ativos/planos/novo")
    expect(screen.getByText("Gerador").closest("a")).toHaveAttribute("href", "/ativos/planos/1")
  })
})