// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { HistoricoTab } from "./historico-tab"
import { createFetchMock, renderPage, toastMock, findCall } from "@/test/harness"
import { exportPDFRelatorio } from "@/lib/export-utils"

vi.mock("@/lib/export-utils", () => ({ exportPDFRelatorio: vi.fn() }))

const envios = [
  { id: 1, email: "ana@empresa.com", nome: "Ana Souza", assunto: "Promo Julho", status: "enviado", error: null, abertoEm: "2026-07-10T10:00:00.000Z", createdAt: "2026-07-09T10:00:00.000Z", totalCliques: 3 },
  { id: 2, email: "bruno@empresa.com", nome: "Bruno Lima", assunto: "Informativo", status: "enviado", error: null, abertoEm: null, createdAt: "2026-07-11T10:00:00.000Z", totalCliques: 1 },
  { id: 3, email: "carla@empresa.com", nome: "Carla Dias", assunto: "Promo Julho", status: "erro", error: "550 rejected", abertoEm: null, createdAt: "2026-07-12T10:00:00.000Z", totalCliques: 0 },
]

function setup() {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/admin/email-massa/disparos") return { json: { disparos: [] } }
    if (method === "GET" && url === "/api/admin/email-massa/historico") {
      return { json: { envios, stats: { total: 3, enviados: 2, lidos: 1, falhas: 1, totalCliques: 4 } } }
    }
    return { json: null }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("HistoricoTab", () => {
  it("renderiza os envios do histórico", async () => {
    setup()
    renderPage(<HistoricoTab />)

    expect(await screen.findByText("ana@empresa.com")).toBeInTheDocument()
    expect(screen.getByText("bruno@empresa.com")).toBeInTheDocument()
    expect(screen.getByText("carla@empresa.com")).toBeInTheDocument()
  })

  it("ordena ao clicar no cabeçalho da coluna", async () => {
    setup()
    renderPage(<HistoricoTab />)
    await screen.findByText("ana@empresa.com")

    fireEvent.click(screen.getByRole("button", { name: /Email/ }))

    expect(screen.getByRole("columnheader", { name: /Email/ })).toHaveAttribute("aria-sort", "ascending")
    let rows = screen.getAllByRole("row").slice(1)
    expect(rows[0]).toHaveTextContent("ana@empresa.com")
    expect(rows[2]).toHaveTextContent("carla@empresa.com")

    fireEvent.click(screen.getByRole("button", { name: /Email/ }))

    expect(screen.getByRole("columnheader", { name: /Email/ })).toHaveAttribute("aria-sort", "descending")
    rows = screen.getAllByRole("row").slice(1)
    expect(rows[0]).toHaveTextContent("carla@empresa.com")
    expect(rows[2]).toHaveTextContent("ana@empresa.com")
  })

  it("ordena Cliques por padrão do maior para o menor", async () => {
    setup()
    renderPage(<HistoricoTab />)
    await screen.findByText("ana@empresa.com")

    fireEvent.click(screen.getByRole("button", { name: /Cliques/ }))

    expect(screen.getByRole("columnheader", { name: /Cliques/ })).toHaveAttribute("aria-sort", "descending")
    const rows = screen.getAllByRole("row").slice(1)
    expect(rows[0]).toHaveTextContent("ana@empresa.com")
    expect(rows[2]).toHaveTextContent("carla@empresa.com")
  })

  it("filtra com debounce ao digitar na busca", async () => {
    setup()
    renderPage(<HistoricoTab />)
    await screen.findByText("ana@empresa.com")

    fireEvent.change(screen.getByLabelText("Buscar no histórico"), { target: { value: "carla" } })

    expect(screen.getByText("ana@empresa.com")).toBeInTheDocument()

    await waitFor(() => expect(screen.queryByText("ana@empresa.com")).not.toBeInTheDocument(), { timeout: 2000 })
    expect(screen.getByText("carla@empresa.com")).toBeInTheDocument()
    expect(screen.queryByText("bruno@empresa.com")).not.toBeInTheDocument()
  })

  it("limpa a busca ao clicar no botão limpar", async () => {
    setup()
    renderPage(<HistoricoTab />)
    await screen.findByText("ana@empresa.com")

    fireEvent.change(screen.getByLabelText("Buscar no histórico"), { target: { value: "carla" } })
    await waitFor(() => expect(screen.queryByText("ana@empresa.com")).not.toBeInTheDocument(), { timeout: 2000 })

    fireEvent.click(screen.getByRole("button", { name: "Limpar busca" }))

    expect(screen.getByText("ana@empresa.com")).toBeInTheDocument()
    expect(screen.getByText("bruno@empresa.com")).toBeInTheDocument()
  })

  it("Continuar envio chama o processar e mostra o resultado", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/email-massa/disparos") {
        return { json: { disparos: [{ id: 1, nome: "Promo Julho", status: "pausado", total: 10, enviados: 5, falhas: 0, pendentes: 5, erro: "Limite diário", criadoEm: "2026-07-09T10:00:00.000Z" }] } }
      }
      if (method === "GET" && url === "/api/admin/email-massa/historico") {
        return { json: { envios, stats: { total: 3, enviados: 2, lidos: 1, falhas: 1, totalCliques: 4 } } }
      }
      if (method === "POST" && url === "/api/admin/email-massa/processar") {
        return { json: { disparosProcessados: 1, enviados: 5, falhas: 1, restantes: 2, limiteTempo: false } }
      }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<HistoricoTab />)
    await screen.findByText("ana@empresa.com")

    fireEvent.click(await screen.findByRole("button", { name: /Continuar envio/ }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/admin/email-massa/processar", "POST")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Envio processado: 5 enviado(s), 1 falha(s), 2 restante(s)"))
  })

  it("Sincronizar bounces chama o endpoint e mostra o resultado", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/email-massa/disparos") return { json: { disparos: [] } }
      if (method === "GET" && url === "/api/admin/email-massa/historico") {
        return { json: { envios, stats: { total: 3, enviados: 2, lidos: 1, falhas: 1, totalCliques: 4 } } }
      }
      if (method === "POST" && url === "/api/admin/email-massa/bounces/sincronizar") {
        return { json: { processados: 195, marcados: 163 } }
      }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<HistoricoTab />)
    await screen.findByText("ana@empresa.com")

    fireEvent.click(screen.getByRole("button", { name: /Sincronizar bounces/ }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/admin/email-massa/bounces/sincronizar", "POST")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith(expect.stringContaining("163 bounce(s)")))
  })

  it("Sincronizar bounces sem resultado mostra aviso de nada encontrado", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/email-massa/disparos") return { json: { disparos: [] } }
      if (method === "GET" && url === "/api/admin/email-massa/historico") {
        return { json: { envios, stats: { total: 3, enviados: 2, lidos: 1, falhas: 1, totalCliques: 4 } } }
      }
      if (method === "POST" && url === "/api/admin/email-massa/bounces/sincronizar") {
        return { json: { processados: 0, marcados: 0 } }
      }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<HistoricoTab />)
    await screen.findByText("ana@empresa.com")

    fireEvent.click(screen.getByRole("button", { name: /Sincronizar bounces/ }))

    await waitFor(() => expect(toastMock.info).toHaveBeenCalledWith("Nenhum bounce novo encontrado"))
  })

  it("Relatório do card gera PDF com os dados do disparo", async () => {
    const disparo = { id: 2, nome: "Promo Julho", status: "concluido", total: 10, enviados: 10, falhas: 0, pendentes: 0, erro: null, criadoEm: "2026-07-09T10:00:00.000Z" }
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/email-massa/disparos") return { json: { disparos: [disparo] } }
      if (method === "GET" && url === "/api/admin/email-massa/historico") {
        return { json: { envios, stats: { total: 3, enviados: 2, lidos: 1, falhas: 1, totalCliques: 4 } } }
      }
      if (method === "GET" && url === "/api/admin/email-massa/disparos/2/relatorio") {
        return { json: { disparo, stats: { pendentes: 0, enviados: 10, falhas: 0, lidos: 5, clicados: 3, totalCliques: 6 }, envios: [{ id: 1, email: "ana@empresa.com", nome: "Ana Souza", status: "enviado", error: null, abertoEm: "2026-07-10T10:00:00.000Z", enviadoEm: "2026-07-09T10:00:00.000Z", totalCliques: 2 }], links: [{ urlOriginal: "https://pdmprotextil.com.br", total: 6 }] } }
      }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<HistoricoTab />)
    await screen.findByText("ana@empresa.com")

    fireEvent.click(await screen.findByRole("button", { name: /^Relatório$/ }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/admin/email-massa/disparos/2/relatorio", "GET")).toBeDefined())
    await waitFor(() => expect(exportPDFRelatorio).toHaveBeenCalledWith(expect.objectContaining({ filename: expect.stringContaining("relatorio-disparo-2-") })))
    const args = vi.mocked(exportPDFRelatorio).mock.calls.at(-1)![0] as any
    expect(args.title).toContain("Promo Julho")
    expect(args.stats).toEqual({ Total: 10, Enviados: 10, Lidos: 5, Cliques: 6, Clicados: 3, Falhas: 0, Pendentes: 0 })
    expect(args.tables).toHaveLength(2)
  })

  it("abre o modal de lista de falhas e cria a lista via POST", async () => {
    const disparo = { id: 2, nome: "Promo Julho", status: "concluido", total: 10, enviados: 9, falhas: 1, pendentes: 0, erro: null, criadoEm: "2026-07-09T10:00:00.000Z" }
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/email-massa/disparos") return { json: { disparos: [disparo] } }
      if (method === "GET" && url === "/api/admin/email-massa/historico") {
        return { json: { envios, stats: { total: 3, enviados: 2, lidos: 1, falhas: 1, totalCliques: 4 } } }
      }
      if (method === "POST" && url === "/api/admin/email-massa/disparos/2/criar-lista") {
        return { json: { total: 1, nome: "Falhas - Promo Julho" } }
      }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<HistoricoTab />)
    await screen.findByText("ana@empresa.com")

    fireEvent.click(await screen.findByRole("button", { name: /^Falhas$/ }))

    expect(await screen.findByRole("heading", { name: /Criar lista de contatos que falharam/ })).toBeInTheDocument()
    expect(screen.getByLabelText("Nome da lista")).toHaveValue("Falhas - Promo Julho")

    fireEvent.click(screen.getByRole("button", { name: "Criar lista" }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/admin/email-massa/disparos/2/criar-lista", "POST")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith(expect.stringContaining("1 contato(s)")))
  })
})
