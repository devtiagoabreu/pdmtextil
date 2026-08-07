// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import { createFetchMock, renderPage, navMock } from "@/test/harness"
import NovaSolicitacaoPage from "./page"

describe("NovaSolicitacaoPage", () => {
  beforeEach(() => {
    const fetchMock = createFetchMock(() => ({ json: [] }))
    vi.stubGlobal("fetch", fetchMock.fn)
    navMock.setPathname("/comercial/solicitacoes/nova")
  })

  it("renderiza o wizard com o passo 1 visível", () => {
    renderPage(<NovaSolicitacaoPage />)

    expect(screen.getByRole("heading", { name: /Nova Solicitação/ })).toBeInTheDocument()
    expect(screen.getByText("Dados Comerciais")).toBeInTheDocument()
    expect(screen.getByText("Briefing Técnico")).toBeInTheDocument()
    expect(screen.getByText("Anexos & Envio")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Continuar para Briefing/ })).toBeInTheDocument()
  })

  it("valida os campos obrigatórios do passo 1", async () => {
    const ui = renderPage(<NovaSolicitacaoPage />)

    fireEvent.submit(ui.container.querySelector("form")!)

    expect(await screen.findByText("O tipo de solicitação é obrigatório")).toBeInTheDocument()
    expect(screen.getByText("Selecione ou digite um cliente")).toBeInTheDocument()
  })
})
