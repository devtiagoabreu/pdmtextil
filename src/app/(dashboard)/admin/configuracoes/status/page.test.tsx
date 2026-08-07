// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import StatusPage from "./page"
import { createFetchMock, findCall, renderPage, toastMock } from "@/test/harness"

const statuses = [
  { id: 1, nome: "PENDENTE", rotulo: "Pendente", tipo: "SOLICITACAO_DESENVOLVIMENTO", cor: "#f59e0b", ordem: 1, ativo: true },
  { id: 2, nome: "CANCELADO", rotulo: "", tipo: "AMOSTRA", cor: null, ordem: 2, ativo: false },
]

function setup() {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/admin/status") return { json: statuses }
    if (method === "POST" && url === "/api/admin/status") return { status: 201, json: { id: 9 } }
    if (method === "PUT" && url === "/api/admin/status") return { json: { ok: true } }
    if (method === "DELETE" && url === "/api/admin/status") return { json: { ok: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("StatusPage", () => {
  it("renderiza heading e tabela de status", async () => {
    setup()
    renderPage(<StatusPage />)

    expect(await screen.findByRole("heading", { name: "Status" })).toBeInTheDocument()
    expect(screen.getByText("PENDENTE")).toBeInTheDocument()
    expect(screen.getByText("Pendente")).toBeInTheDocument()
    expect(screen.getByText("Solic. Desenv.")).toBeInTheDocument()
    expect(screen.getByText("#f59e0b")).toBeInTheDocument()
    expect(screen.getByText("CANCELADO")).toBeInTheDocument()
    const rowCancelado = screen.getByText("CANCELADO").closest("tr")!
    expect(within(rowCancelado).getByText("Amostra")).toBeInTheDocument()
  })

  it("mostra estado vazio quando não há status", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/status") return { json: [] }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<StatusPage />)

    expect(await screen.findByText("Nenhum status encontrado")).toBeInTheDocument()
  })

  it("cria status via POST no form inline", async () => {
    const fetchMock = setup()
    renderPage(<StatusPage />)
    await screen.findByText("PENDENTE")

    fireEvent.click(screen.getByRole("button", { name: /Novo Status/ }))
    fireEvent.change(screen.getByPlaceholderText("EX: PENDENTE"), { target: { value: "FATURADO" } })
    fireEvent.change(screen.getByPlaceholderText("Ex: Pendente"), { target: { value: "Faturado" } })
    fireEvent.click(screen.getByRole("button", { name: "Criar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/admin/status", "POST")
      expect(call).toBeDefined()
      expect(call?.body?.nome).toBe("FATURADO")
      expect(call?.body?.rotulo).toBe("Faturado")
      expect(call?.body?.tipo).toBe("SOLICITACAO_DESENVOLVIMENTO")
      expect(call?.body?.ativo).toBe(true)
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Status criado"))
  })

  it("exclui status via confirm chamando DELETE", async () => {
    const fetchMock = setup()
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true)
    renderPage(<StatusPage />)
    await screen.findByText("PENDENTE")

    const row = screen.getByText("PENDENTE").closest("tr")!
    fireEvent.click(within(row).getByRole("button", { name: "Excluir" }))

    expect(confirmSpy).toHaveBeenCalledWith("Tem certeza que deseja excluir este status?")
    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/admin/status", "DELETE")
      expect(call).toBeDefined()
      expect(call?.body?.id).toBe(1)
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Status excluído"))
    confirmSpy.mockRestore()
  })
})
