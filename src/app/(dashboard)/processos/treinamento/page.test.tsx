// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import TreinamentoPage from "./page"
import { createFetchMock, renderPage, navMock } from "@/test/harness"

const modulos = [
  {
    id: 1,
    titulo: "Visão Geral",
    descricao: "Primeiros passos na Engenharia de Processos",
    icone: "BookOpen",
    cor: "#0ea5e9",
    ordem: 1,
    ativo: true,
    licoes: [
      { id: 10, titulo: "O que é um processo", ordem: 1, ativo: true, pathnameRelacionado: "/processos" },
      { id: 11, titulo: "Lição Inativa", ordem: 2, ativo: false, pathnameRelacionado: null },
    ],
  },
  {
    id: 2,
    titulo: "Módulo Inativo",
    descricao: null,
    icone: null,
    cor: null,
    ordem: 2,
    ativo: false,
    licoes: [],
  },
]

describe("TreinamentoPage", () => {
  beforeEach(() => {
    navMock.setPathname("/processos/treinamento")
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/processos/treinamento") return { json: modulos }
      return { json: null }
    }
    vi.stubGlobal("fetch", createFetchMock(handler).fn)
  })

  it("renderiza os módulos ativos com heading", async () => {
    renderPage(<TreinamentoPage />)

    expect(screen.getByRole("heading", { name: "Treinamento Engenharia de Processos" })).toBeInTheDocument()
    expect(await screen.findByText("Visão Geral")).toBeInTheDocument()
    expect(screen.getByText("Primeiros passos na Engenharia de Processos")).toBeInTheDocument()
    expect(screen.getByText("2 lições")).toBeInTheDocument()
    expect(screen.queryByText("Módulo Inativo")).not.toBeInTheDocument()
  })

  it("expande o módulo ao clicar e mostra as lições ativas", async () => {
    renderPage(<TreinamentoPage />)

    fireEvent.click(await screen.findByRole("button", { name: /Visão Geral/ }))

    expect(await screen.findByText("O que é um processo")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /O que é um processo/ })).toHaveAttribute(
      "href",
      "/processos/treinamento/10"
    )
    expect(screen.queryByText("Lição Inativa")).not.toBeInTheDocument()
  })

  it("contém links para exportar e gerenciar o treinamento", async () => {
    renderPage(<TreinamentoPage />)

    expect(screen.getByRole("link", { name: /Exportar Treinamento Completo/ })).toHaveAttribute(
      "href",
      "/processos/treinamento/exportar-pdf"
    )
    expect(screen.getByRole("link", { name: /Gerenciar/ })).toHaveAttribute(
      "href",
      "/processos/treinamento/admin"
    )
  })
})