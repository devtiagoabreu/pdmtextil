// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import DetalheOportunidadePage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

const oportunidade = {
  id: 1,
  titulo: "Venda de malha 100% algodão",
  empresaNome: "Tecelagem Alpha",
  valorEstimado: "5000",
  probabilidade: 50,
  dataFechamentoPrevista: "2026-08-30",
  responsavelNome: "Tiago",
  descricao: "Cliente quer 5 toneladas de malha",
  status: "NOVO",
  contato: null,
  createdAt: "2026-07-01T10:00:00Z",
  propostas: [],
}

const oportunidadeComPropostas = {
  ...oportunidade,
  propostas: [
    { id: 10, titulo: "Orçamento Malha - Tecelagem Alpha", valor: "5000", status: "ENVIADA", createdAt: "2026-07-02T10:00:00Z" },
    { id: 11, titulo: "Orçamento Rev.2 - Malha", valor: "4800", status: "REVISAO", createdAt: "2026-07-05T10:00:00Z" },
  ],
}

const statuses = [
  { id: 1, nome: "NOVO", rotulo: "Novo", tipo: "OPORTUNIDADE", cor: "#3b82f6", ordem: 1, ativo: true },
  { id: 2, nome: "NEGOCIACAO", rotulo: "Negociação", tipo: "OPORTUNIDADE", cor: "#f97316", ordem: 4, ativo: true },
]

describe("DetalheOportunidadePage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/admin/status?tipo=OPORTUNIDADE") return { json: statuses }
      if (method === "GET" && url === "/api/crm/oportunidades/1") return { json: oportunidade }
      if (method === "PUT" && url === "/api/crm/oportunidades/1") return { json: oportunidade }
      if (method === "DELETE" && url === "/api/crm/oportunidades/1") return { json: { ok: true } }
      return { json: null }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("exibe os dados da oportunidade", async () => {
    navMock.setParams({ id: "1" })
    navMock.setPathname("/comercial/crm/oportunidades/1")
    renderPage(<DetalheOportunidadePage />)

    expect(await screen.findByRole("heading", { name: /Venda de malha 100% algodão/ })).toBeInTheDocument()
    expect(screen.getAllByText("Tecelagem Alpha").length).toBeGreaterThan(0)
    expect(screen.getByText("R$ 5.000,00")).toBeInTheDocument()
    expect(screen.getByText("50%")).toBeInTheDocument()
    expect(screen.getByText("NOVO")).toBeInTheDocument()
    expect(screen.getByText("Nenhum contato vinculado")).toBeInTheDocument()
    expect(screen.getByText("Cliente quer 5 toneladas de malha")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument()
  })

  it("edita o status via select e confirma com PUT", async () => {
    navMock.setParams({ id: "1" })
    navMock.setPathname("/comercial/crm/oportunidades/1")
    const { container } = renderPage(<DetalheOportunidadePage />)

    fireEvent.click(await screen.findByRole("button", { name: "NOVO" }))

    const select = screen.getByRole("combobox")
    fireEvent.change(select, { target: { value: "NEGOCIACAO" } })

    const checkButton = container.querySelector("svg.lucide-check")!.closest("button")!
    fireEvent.click(checkButton)

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/oportunidades/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ status: "NEGOCIACAO" })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Status atualizado"))
  })

  it("exclui a oportunidade após confirmação", async () => {
    navMock.setParams({ id: "1" })
    navMock.setPathname("/comercial/crm/oportunidades/1")
    renderPage(<DetalheOportunidadePage />)

    fireEvent.click(await screen.findByRole("button", { name: "Excluir" }))

    const dialog = screen.getByRole("dialog", { name: "Excluir oportunidade?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/oportunidades/1", "DELETE")
      expect(call).toBeDefined()
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Oportunidade excluída"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/oportunidades")
  })

  it("mostra oportunidade não encontrada", async () => {
    navMock.setParams({ id: "999" })
    navMock.setPathname("/comercial/crm/oportunidades/999")
    renderPage(<DetalheOportunidadePage />)

    expect(await screen.findByText("Oportunidade não encontrada")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Voltar" })).toHaveAttribute("href", "/comercial/crm/oportunidades")
  })

  it("exibe o grid de propostas vinculadas à oportunidade", async () => {
    const gridMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/status?tipo=OPORTUNIDADE") return { json: statuses }
      if (method === "GET" && url === "/api/crm/oportunidades/1") return { json: oportunidadeComPropostas }
      return { json: null }
    })
    vi.stubGlobal("fetch", gridMock.fn)
    navMock.setParams({ id: "1" })
    navMock.setPathname("/comercial/crm/oportunidades/1")
    renderPage(<DetalheOportunidadePage />)

    expect(await screen.findByText("Propostas da Oportunidade")).toBeInTheDocument()
    expect(screen.getByText("(2)")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Orçamento Malha - Tecelagem Alpha" })).toHaveAttribute(
      "href",
      "/comercial/crm/propostas/10"
    )
    expect(screen.getByRole("link", { name: "Orçamento Rev.2 - Malha" })).toHaveAttribute(
      "href",
      "/comercial/crm/propostas/11"
    )
    expect(screen.getAllByText("R$ 5.000,00").length).toBeGreaterThan(0)
  })

  it('o botão "Nova Proposta" aponta para criar vinclado à oportunidade', async () => {
    const buttonMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/status?tipo=OPORTUNIDADE") return { json: statuses }
      if (method === "GET" && url === "/api/crm/oportunidades/1") return { json: oportunidadeComPropostas }
      return { json: null }
    })
    vi.stubGlobal("fetch", buttonMock.fn)
    navMock.setParams({ id: "1" })
    navMock.setPathname("/comercial/crm/oportunidades/1")
    renderPage(<DetalheOportunidadePage />)

    await screen.findByText("Propostas da Oportunidade")
    expect(screen.getByRole("link", { name: /Nova Proposta/ })).toHaveAttribute(
      "href",
      "/comercial/crm/propostas/novo?oportunidadeId=1"
    )
  })

  it("exibe estado vazio quando a oportunidade não tem propostas", async () => {
    const emptyMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/status?tipo=OPORTUNIDADE") return { json: statuses }
      if (method === "GET" && url === "/api/crm/oportunidades/1") return { json: { ...oportunidade, propostas: [] } }
      return { json: null }
    })
    vi.stubGlobal("fetch", emptyMock.fn)
    navMock.setParams({ id: "1" })
    navMock.setPathname("/comercial/crm/oportunidades/1")
    renderPage(<DetalheOportunidadePage />)

    expect(await screen.findByText("Nenhuma proposta vinculada a esta oportunidade.")).toBeInTheDocument()
  })
})
