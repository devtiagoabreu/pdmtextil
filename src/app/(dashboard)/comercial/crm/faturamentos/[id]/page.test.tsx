// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import FaturamentoDetailPage from "./page"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"

const faturamento = {
  id: 1,
  oportunidadeId: 1,
  oportunidadeTitulo: "Malha penteada",
  numero: "NF-001",
  dataEmissao: "2026-09-01",
  status: "EMITIDO",
  observacao: "Entrega em 30 dias",
  origem: "MANUAL",
  referenciaExterna: null,
  itens: [
    { id: 1, faturamentoId: 1, produto: "Malha penteada azul", codigo: "MP-01", unidade: "METROS", quantidade: "100", valorUnitario: "12.5", valorTotal: "1250" },
  ],
}

function buildHandler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/crm/faturamentos/1") return { json: faturamento }
    if (method === "PUT" && url === "/api/crm/faturamentos/1") return { json: faturamento }
    if (method === "GET" && url === "/api/crm/oportunidades") return { json: [{ id: 1, titulo: "Malha penteada" }] }
    return { json: null }
  }
}

describe("FaturamentoDetailPage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    fetchMock = createFetchMock(buildHandler())
    vi.stubGlobal("fetch", fetchMock.fn)
    navMock.setPathname("/comercial/crm/faturamentos/1")
    navMock.setParams({ id: "1" })
  })

  it("renderiza o detalhe com itens e valor total", async () => {
    renderPage(<FaturamentoDetailPage />)

    expect(await screen.findByRole("heading", { name: /NF-001/ })).toBeInTheDocument()
    expect(screen.getByText("Malha penteada")).toBeInTheDocument()
    expect(screen.getByText("Emitido")).toBeInTheDocument()
    expect(screen.getByText("Malha penteada azul")).toBeInTheDocument()
    expect(screen.getByText("R$ 1.250,00", { selector: "p" })).toBeInTheDocument()
    expect(screen.getByText("Entrega em 30 dias")).toBeInTheDocument()
  })

  it("salva edições via PUT", async () => {
    renderPage(<FaturamentoDetailPage />)
    await screen.findByRole("heading", { name: /NF-001/ })

    fireEvent.click(screen.getByRole("button", { name: "Editar" }))
    fireEvent.click(screen.getByRole("button", { name: "Salvar Alterações" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/faturamentos/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toMatchObject({ status: "EMITIDO", itens: [{ produto: "Malha penteada azul" }] })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Faturamento atualizado"))
    expect(screen.queryByRole("button", { name: "Salvar Alterações" })).not.toBeInTheDocument()
  })
})