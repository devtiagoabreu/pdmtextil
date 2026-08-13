// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { ListasTab } from "./listas-tab"
import { createFetchMock, renderPage, toastMock, findCall } from "@/test/harness"

const lista = { id: 1, nome: "Clientes SP", descricao: null }

const contatos = [
  { id: 1, listaId: 1, nome: "Ana", email: "ana@faturamento.com" },
  { id: 2, listaId: 1, nome: "Escritório Contábil", email: "escritorio@contabil.com" },
  { id: 3, listaId: 1, nome: "Faturamento", email: "faturamento@empresa.com" },
  { id: 4, listaId: 1, nome: "Contador", email: "escritorio@contabil.com" },
  { id: 5, listaId: 1, nome: "Financeiro", email: "faturamento@empresa.com" },
]

function setup(contatosMock = contatos) {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/admin/email-massa/listas") return { json: [{ ...lista, totalContatos: contatosMock.length }] }
    if (method === "GET" && url === "/api/admin/email-massa/listas/1") return { json: { ...lista, contatos: contatosMock } }
    return { json: { id: 1 } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

async function abrirEdicao() {
  fireEvent.click(await screen.findByRole("button", { name: "Editar lista Clientes SP" }))
  await screen.findByRole("heading", { name: "Editar Lista" })
}

describe("ListasTab", () => {
  it("abre edição e destaca os emails repetidos", async () => {
    setup()
    renderPage(<ListasTab onListaDeletada={() => {}} />)

    await abrirEdicao()

    expect(screen.getByText("Ana")).toBeInTheDocument()
    expect(screen.getByText("2 email(s) repetido(s) na lista — mantém 1 contato por email")).toBeInTheDocument()
    expect(screen.getAllByText("repetido").length).toBe(4)
    expect(screen.getByText("5 contato(s)")).toBeInTheDocument()
  })

  it("busca por email filtra os contatos e remove os encontrados", async () => {
    setup()
    renderPage(<ListasTab onListaDeletada={() => {}} />)
    await abrirEdicao()

    fireEvent.change(screen.getByRole("textbox", { name: "Buscar contato por nome ou email" }), {
      target: { value: "escritorio@contabil.com" },
    })

    expect(screen.getByText("Escritório Contábil")).toBeInTheDocument()
    expect(screen.getByText("Contador")).toBeInTheDocument()
    expect(screen.queryByText("Ana")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Remover 2 encontrado(s)" }))

    expect(toastMock.success).toHaveBeenCalledWith("Removidos 2 contato(s)")
    expect(screen.getByText("Nenhum contato encontrado para a busca")).toBeInTheDocument()
    expect(screen.getByText("1 email(s) repetido(s) na lista — mantém 1 contato por email")).toBeInTheDocument()
  })

  it("limpa emails repetidos mantendo 1 contato por email", async () => {
    setup()
    renderPage(<ListasTab onListaDeletada={() => {}} />)
    await abrirEdicao()

    fireEvent.click(screen.getByRole("button", { name: "Limpar emails repetidos" }))

    expect(toastMock.success).toHaveBeenCalledWith("Removidos 2 email(s) repetido(s)")
    expect(screen.getByText("Escritório Contábil")).toBeInTheDocument()
    expect(screen.getByText("Faturamento")).toBeInTheDocument()
    expect(screen.queryByText("Contador")).not.toBeInTheDocument()
    expect(screen.queryByText("Financeiro")).not.toBeInTheDocument()
    expect(screen.queryByText(/email\(s\) repetido\(s\) na lista/)).not.toBeInTheDocument()
    expect(screen.getByText("3 contato(s)")).toBeInTheDocument()
  })

  it("salva a lista enviando apenas os contatos mantidos", async () => {
    const fetchMock = setup()
    renderPage(<ListasTab onListaDeletada={() => {}} />)
    await abrirEdicao()

    fireEvent.click(screen.getByRole("button", { name: "Limpar emails repetidos" }))
    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }))

    await waitFor(() => {
      expect(findCall(fetchMock.calls, "/api/admin/email-massa/listas/1", "PUT")).toBeTruthy()
    })
    const contatosCall = findCall(fetchMock.calls, "/api/admin/email-massa/listas/1/contatos", "POST")
    expect(contatosCall).toBeTruthy()
    expect(contatosCall!.body.contatos).toHaveLength(3)
    expect(contatosCall!.body.contatos.map((c: any) => c.email)).toEqual([
      "ana@faturamento.com",
      "escritorio@contabil.com",
      "faturamento@empresa.com",
    ])
    expect(toastMock.success).toHaveBeenCalledWith("Lista atualizada")
  })

  it("limita a renderização a 200 contatos por vez", async () => {
    const muitos = Array.from({ length: 205 }, (_, i) => ({
      id: i + 1,
      listaId: 1,
      nome: `Contato ${i}`,
      email: `contato${i}@empresa.com`,
    }))
    setup(muitos)
    renderPage(<ListasTab onListaDeletada={() => {}} />)
    await abrirEdicao()

    expect(screen.getByText("205 contato(s) — exibindo 200, use a busca para refinar")).toBeInTheDocument()
    expect(screen.getAllByRole("row")).toHaveLength(201)
  })
})
