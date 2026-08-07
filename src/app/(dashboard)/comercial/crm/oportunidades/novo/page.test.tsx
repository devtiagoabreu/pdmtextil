// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import NovaOportunidadePage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

describe("NovaOportunidadePage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/estados") {
        return { json: [{ id: 35, uf: "SP", nome: "São Paulo" }] }
      }
      if (method === "GET" && url === "/api/admin/status?tipo=OPORTUNIDADE") {
        return {
          json: [
            { id: 1, nome: "NOVO", rotulo: "Novo", tipo: "OPORTUNIDADE", cor: "#3b82f6", ordem: 1, ativo: true },
            { id: 2, nome: "NEGOCIACAO", rotulo: "Negociação", tipo: "OPORTUNIDADE", cor: "#f97316", ordem: 4, ativo: true },
          ],
        }
      }
      if (method === "GET" && url === "/api/crm/pessoas") {
        return { json: [{ id: 1, razaoSocial: "Tecelagem Alpha" }] }
      }
      if (method === "GET" && url === "/api/crm/leads") {
        return { json: [{ id: 2, nome: "Carlos Lead" }] }
      }
      if (method === "GET" && url === "/api/usuarios") {
        return { json: [{ id: 3, name: "Ana Vendas" }] }
      }
      if (method === "POST" && url === "/api/crm/oportunidades") {
        return { json: { id: 4 } }
      }
      return { json: null }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("renderiza o formulário de nova oportunidade", async () => {
    renderPage(<NovaOportunidadePage />)

    expect(await screen.findByRole("heading", { name: "Nova Oportunidade" })).toBeInTheDocument()
    expect(screen.getByText(/Título/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Ex: Venda de malha 100% algodão")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument()
  })

  it("valida Título obrigatório", async () => {
    const { container } = renderPage(<NovaOportunidadePage />)
    await screen.findByRole("heading", { name: "Nova Oportunidade" })

    fireEvent.submit(container.querySelector("form")!)
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Título é obrigatório"))
  })

  it("cria oportunidade via POST e navega para a lista", async () => {
    const { container } = renderPage(<NovaOportunidadePage />)
    await screen.findByRole("heading", { name: "Nova Oportunidade" })

    fireEvent.change(screen.getByPlaceholderText("Ex: Venda de malha 100% algodão"), {
      target: { value: "Venda de malha 100% algodão" },
    })

    await waitFor(() => expect(screen.getByRole("option", { name: "Tecelagem Alpha" })).toBeInTheDocument())
    await waitFor(() => expect(screen.getByRole("option", { name: "Carlos Lead" })).toBeInTheDocument())
    await waitFor(() => expect(screen.getByRole("option", { name: "Ana Vendas" })).toBeInTheDocument())
    await waitFor(() => expect(screen.getByRole("option", { name: "NOVO" })).toBeInTheDocument())

    const selects = screen.getAllByRole("combobox")
    fireEvent.change(selects[0], { target: { value: "1" } })
    fireEvent.change(selects[1], { target: { value: "2" } })
    fireEvent.change(selects[2], { target: { value: "3" } })

    fireEvent.change(screen.getByPlaceholderText("R$ 0,00"), { target: { value: "5000" } })
    fireEvent.change(container.querySelector('input[type="date"]')!, { target: { value: "2026-08-30" } })
    fireEvent.change(screen.getAllByRole("spinbutton")[1], { target: { value: "50" } })
    fireEvent.change(screen.getByPlaceholderText("Detalhes da oportunidade..."), {
      target: { value: "Cliente quer 5 toneladas de malha" },
    })

    fireEvent.submit(container.querySelector("form")!)

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/oportunidades", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({
        titulo: "Venda de malha 100% algodão",
        descricao: "Cliente quer 5 toneladas de malha",
        valorEstimado: "5000",
        empresaId: 1,
        leadId: 2,
        responsavelId: 3,
        dataFechamentoPrevista: "2026-08-30",
        probabilidade: 50,
        status: "NOVO",
      })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Oportunidade criada com sucesso"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/oportunidades")
  })
})
