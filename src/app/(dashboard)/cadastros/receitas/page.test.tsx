// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import ListaReceitasPage from "./page"
import { createFetchMock, navMock, renderPage } from "@/test/harness"

const simples = [
  {
    id: 1,
    tipo: "TINGIMENTO",
    tipoLabel: "Tingimento",
    possuiParametros: true,
    contextType: "acabamento",
    contextId: 10,
    acabamento: "Tingimento Azul",
    produtoId: 7,
    produtoCodigo: "D28",
    produtoDescricao: "Sarja Algodão",
  },
  {
    id: 2,
    tipo: "AMACIAMENTO",
    tipoLabel: "Amaciamento",
    possuiParametros: false,
    contextType: "acabamento",
    contextId: 11,
    acabamento: "Amaciamento",
    produtoId: 8,
    produtoCodigo: "D29",
    produtoDescricao: "Tricoline",
  },
]

const completas = [
  {
    id: 30,
    descricao: "Receita completa A",
    instrucoes: null,
    versao: 2,
    totalItens: 3,
    contextType: "amostra",
    contextId: 12,
    amostraDescricao: "Amostra B1",
    acabamento: "Tingimento Vermelho",
    produtoId: 7,
    produtoCodigo: "D28",
    produtoDescricao: "Sarja Algodão",
  },
]

function setup(simplesData = simples, completasData = completas) {
  navMock.setPathname("/cadastros/receitas")
  const fetchMock = createFetchMock(() => ({
    json: { simples: simplesData, completas: completasData },
  }))
  vi.stubGlobal("fetch", fetchMock.fn)
  return renderPage(<ListaReceitasPage />)
}

describe("ListaReceitasPage", () => {
  beforeEach(() => {
    navMock.reset()
  })

  it("mostra aba de receitas detalhadas por padrão com os dados", async () => {
    setup()
    expect(await screen.findByText("D28")).toBeDefined()
    expect(screen.getByText("Receita completa A")).toBeDefined()
    expect(screen.getByText("v2")).toBeDefined()
    expect(screen.getByText("Amostra B1")).toBeDefined()
    expect(screen.getByText("Receitas Detalhadas (1)")).toBeDefined()
    expect(screen.getByText("Receitas Simples (2)")).toBeDefined()
  })

  it("alterna para a aba de receitas simples", async () => {
    setup()
    await screen.findByText("D28")
    fireEvent.click(screen.getByRole("button", { name: /Receitas Simples/ }))
    expect(screen.getByText("TINGIMENTO")).toBeDefined()
    expect(screen.getByText("Sim")).toBeDefined()
    expect(screen.getByText("AMACIAMENTO")).toBeDefined()
    expect(screen.getAllByText("—")[0]).toBeDefined()
  })

  it("mostra estado vazio em ambas as abas", async () => {
    setup([], [])
    expect(await screen.findByText("Nenhuma receita detalhada")).toBeDefined()
    fireEvent.click(screen.getByRole("button", { name: /Receitas Simples/ }))
    expect(screen.getByText("Nenhuma receita simples")).toBeDefined()
  })
})
