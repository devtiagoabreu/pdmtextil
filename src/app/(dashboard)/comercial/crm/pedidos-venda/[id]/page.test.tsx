// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import PedidoVendaDetailPage from "./page"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"

const pedido = {
  id: 1,
  oportunidadeId: 1,
  oportunidadeTitulo: "Malha penteada",
  numero: "PV-001",
  dataEmissao: "2026-09-01",
  status: "ABERTO",
  observacao: "Conferir grade antes de faturar",
  origem: "MANUAL",
  referenciaExterna: null,
  itens: [
    { id: 1, pedidoVendaId: 1, produto: "Malha penteada azul", codigo: "MP-01", unidade: "METROS", quantidade: "100", valorUnitario: "12.5", valorTotal: "1250" },
  ],
}

function buildHandler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/crm/pedidos-venda/1") return { json: pedido }
    if (method === "PUT" && url === "/api/crm/pedidos-venda/1") return { json: pedido }
    if (method === "GET" && url === "/api/crm/oportunidades") return { json: [{ id: 1, titulo: "Malha penteada" }] }
    return { json: null }
  }
}

describe("PedidoVendaDetailPage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    fetchMock = createFetchMock(buildHandler())
    vi.stubGlobal("fetch", fetchMock.fn)
    navMock.setPathname("/comercial/crm/pedidos-venda/1")
    navMock.setParams({ id: "1" })
  })

  it("renderiza o detalhe com itens e valor total", async () => {
    renderPage(<PedidoVendaDetailPage />)

    expect(await screen.findByRole("heading", { name: /PV-001/ })).toBeInTheDocument()
    expect(screen.getByText("Malha penteada")).toBeInTheDocument()
    expect(screen.getByText("Aberto")).toBeInTheDocument()
    expect(screen.getByText("Malha penteada azul")).toBeInTheDocument()
    expect(screen.getByText("R$ 1.250,00", { selector: "p" })).toBeInTheDocument()
    expect(screen.getByText("Conferir grade antes de faturar")).toBeInTheDocument()
  })

  it("salva edições via PUT", async () => {
    renderPage(<PedidoVendaDetailPage />)
    await screen.findByRole("heading", { name: /PV-001/ })

    fireEvent.click(screen.getByRole("button", { name: "Editar" }))
    fireEvent.click(screen.getByRole("button", { name: "Salvar Alterações" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/pedidos-venda/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toMatchObject({ status: "ABERTO", itens: [{ produto: "Malha penteada azul" }] })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Pedido de venda atualizado"))
    expect(screen.queryByRole("button", { name: "Salvar Alterações" })).not.toBeInTheDocument()
  })
})