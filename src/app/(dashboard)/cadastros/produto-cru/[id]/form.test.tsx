// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ProdutoCruFormPage from "./page"
import { createFetchMock, findCall, navMock, renderPage, toastMock } from "@/test/harness"

const produtoData = {
  id: 7,
  codigoPdm: "D28",
  descricao: "Tecido Sarja Algodão 30/1",
  solicitacaoDesenvolvimentoId: null,
  status: "DESENVOLVIMENTO",
  fichaTecnica: null,
  links: [],
  ativo: true,
  idIntegracaoErpCru: "",
  idIntegracao: "",
  composicao: [],
  estrutura: [],
  amostras: [
    {
      id: 15,
      descricao: "AMOSTRA - PILOTAGEM 001",
      status: "EM_DESENVOLVIMENTO",
      observacoes: null,
      quantidadeProduzida: null,
      idIntegracaoErpCru: null,
      links: [],
      dados: null,
      motivoAprovacao: null,
      data: "2026-08-13T00:00:00.000Z",
    },
  ],
  acabamentos: [],
}

function setup(paramsId: string, deleteAmostraResponse: { status?: number; json?: unknown } = { status: 200, json: { success: true } }) {
  navMock.setPathname(`/cadastros/produto-cru/${paramsId}`)
  navMock.setParams({ id: paramsId })
  const isEditing = paramsId !== "novo"
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && isEditing && url === `/api/cadastros/produto-cru/${paramsId}`) {
      return { json: produtoData }
    }
    if (method === "GET" && url === "/api/cadastros/fios") return { json: [] }
    if (method === "GET" && url === "/api/cadastros/bases-urdume") return { json: [] }
    if (method === "GET" && url === "/api/solicitacoes") return { json: [] }
    if (method === "GET" && url === "/api/admin/status?tipo=PRODUTO_CRU") {
      return {
        json: [
          { nome: "DESENVOLVIMENTO", rotulo: "Em Desenvolvimento" },
          { nome: "APROVADO", rotulo: "Aprovado" },
        ],
      }
    }
    if (method === "GET" && url === "/api/admin/status?tipo=AMOSTRA") return { json: [] }
    if (method === "POST" && url === "/api/cadastros/produto-cru") {
      return { status: 201, json: { id: 8 } }
    }
    if (method === "DELETE" && isEditing && url === `/api/cadastros/produto-cru/${paramsId}/amostras/15`) {
      return { status: deleteAmostraResponse.status ?? 200, json: deleteAmostraResponse.json ?? { success: true } }
    }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return { ui: renderPage(<ProdutoCruFormPage />), fetchMock }
}

function formDo(ui: ReturnType<typeof renderPage>) {
  return ui.container.querySelector("form")!
}

describe("ProdutoCruFormPage", () => {
  it("edição carrega os dados na aba Capa", async () => {
    setup("7")
    expect(await screen.findByRole("heading", { name: /Editar Produto/ })).toBeDefined()
    expect(await screen.findByDisplayValue("D28")).toBeDefined()
    expect(screen.getByDisplayValue("Tecido Sarja Algodão 30/1")).toBeDefined()
    expect((screen.getByRole("combobox", { name: "Status" }) as HTMLSelectElement).value).toBe("DESENVOLVIMENTO")
  })

  it("valida obrigatórios no submit", async () => {
    const { ui } = setup("7")
    await screen.findByDisplayValue("D28")
    await userEvent.clear(screen.getByPlaceholderText("D28"))
    await userEvent.clear(screen.getByPlaceholderText("Tecido Sarja Algodão 30/1"))
    fireEvent.submit(formDo(ui))
    expect(toastMock.error).toHaveBeenCalledWith("Código PDM e Descrição são obrigatórios")
  })

  it("não permite aprovar sem amostra aprovada", async () => {
    setup("7")
    await screen.findByDisplayValue("D28")
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Status" }), "Aprovado")
    expect(toastMock.error).toHaveBeenCalledWith(
      "—0 necessário pelo menos uma amostra de tecido cru aprovada para aprovar o produto"
    )
  })

  it("novo cria via POST e navega para o registro", async () => {
    const { ui, fetchMock } = setup("novo")
    expect(await screen.findByRole("heading", { name: /Novo Produto/ })).toBeDefined()
    await userEvent.type(screen.getByPlaceholderText("D28"), "D99")
    await userEvent.type(screen.getByPlaceholderText("Tecido Sarja Algodão 30/1"), "Tecido Novo")
    fireEvent.submit(formDo(ui))
    await waitFor(() => expect(navMock.router.push).toHaveBeenCalledWith("/cadastros/produto-cru/8"))
    const call = findCall(fetchMock.calls, "/api/cadastros/produto-cru", "POST")
    expect(call?.body?.codigoPdm).toBe("D99")
    expect(call?.body?.descricao).toBe("Tecido Novo")
  })

  async function abrirExclusaoAmostra() {
    await userEvent.click(screen.getByRole("button", { name: "Amostras" }))
    await screen.findByText("AMOSTRA - PILOTAGEM 001")
    const trash = document.getElementById("amostra-15")!.querySelector(".lucide-trash-2")!.closest("button")!
    fireEvent.click(trash)
    await screen.findByText("Confirmar exclusão")
  }

  it("exclui amostra após confirmação e remove da lista", async () => {
    const { fetchMock } = setup("7")
    await screen.findByDisplayValue("D28")
    await abrirExclusaoAmostra()
    await userEvent.click(screen.getByRole("button", { name: "Remover" }))
    const call = findCall(fetchMock.calls, "/api/cadastros/produto-cru/7/amostras/15", "DELETE")
    expect(call).toBeDefined()
    await waitFor(() => expect(screen.queryByText("AMOSTRA - PILOTAGEM 001")).toBeNull())
    expect(toastMock.success).toHaveBeenCalledWith("Amostra removida")
  })

  it("mantém a amostra e mostra erro da API quando o DELETE falha", async () => {
    setup("7", { status: 403, json: { error: "Apenas administradores podem excluir amostras" } })
    await screen.findByDisplayValue("D28")
    await abrirExclusaoAmostra()
    await userEvent.click(screen.getByRole("button", { name: "Remover" }))
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Apenas administradores podem excluir amostras"))
    expect(screen.getByText("AMOSTRA - PILOTAGEM 001")).toBeDefined()
  })
})
