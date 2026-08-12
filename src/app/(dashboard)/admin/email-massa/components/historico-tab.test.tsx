// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import { HistoricoTab } from "./historico-tab"
import { createFetchMock, renderPage, toastMock, findCall } from "@/test/harness"
import { exportPDFRelatorio } from "@/lib/export-utils"

vi.mock("@/lib/export-utils", () => ({ exportPDFRelatorio: vi.fn() }))

const envios = [
  { id: 1, email: "ana@empresa.com", nome: "Ana Souza", assunto: "Promo Julho", status: "enviado", error: null, abertoEm: "2026-07-10T10:00:00.000Z", createdAt: "2026-07-09T10:00:00.000Z", totalCliques: 3, disparoId: 2, disparoNome: "Promo Julho" },
  { id: 2, email: "bruno@empresa.com", nome: "Bruno Lima", assunto: "Informativo", status: "enviado", error: null, abertoEm: null, createdAt: "2026-07-11T10:00:00.000Z", totalCliques: 1, disparoId: 2, disparoNome: "Promo Julho" },
  { id: 3, email: "carla@empresa.com", nome: "Carla Dias", assunto: "Promo Julho", status: "falhou", error: "550 rejected", abertoEm: null, createdAt: "2026-07-12T10:00:00.000Z", totalCliques: 0, disparoId: 3, disparoNome: "Informativo" },
]

const stats = { total: 3, enviados: 2, lidos: 1, falhas: 1, totalCliques: 4 }

describe("HistoricoTab", () => {
  it("Continuar envio chama o processar e mostra o resultado", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/email-massa/disparos") {
        return { json: { disparos: [{ id: 1, nome: "Promo Julho", status: "pausado", total: 10, enviados: 5, falhas: 0, pendentes: 5, erro: "Limite diário", criadoEm: "2026-07-09T10:00:00.000Z" }] } }
      }
      if (method === "GET" && url === "/api/admin/email-massa/historico") {
        return { json: { envios, stats } }
      }
      if (method === "POST" && url === "/api/admin/email-massa/processar") {
        return { json: { disparosProcessados: 1, enviados: 5, falhas: 1, restantes: 2, limiteTempo: false } }
      }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<HistoricoTab />)
    await screen.findByText("Promo Julho")

    fireEvent.click(await screen.findByRole("button", { name: /Continuar envio/ }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/admin/email-massa/processar", "POST")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Envio processado: 5 enviado(s), 1 falha(s), 2 restante(s)"))
  })

  it("Sincronizar bounces chama o endpoint e mostra o resultado", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/email-massa/disparos") return { json: { disparos: [] } }
      if (method === "GET" && url === "/api/admin/email-massa/historico") {
        return { json: { envios, stats } }
      }
      if (method === "POST" && url === "/api/admin/email-massa/bounces/sincronizar") {
        return { json: { processados: 195, marcados: 163 } }
      }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<HistoricoTab />)
    await screen.findByText("Nenhum disparo registrado ainda.")

    fireEvent.click(screen.getByRole("button", { name: /Sincronizar bounces/ }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/admin/email-massa/bounces/sincronizar", "POST")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith(expect.stringContaining("163 bounce(s)")))
  })

  it("Sincronizar bounces sem resultado mostra aviso de nada encontrado", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/email-massa/disparos") return { json: { disparos: [] } }
      if (method === "GET" && url === "/api/admin/email-massa/historico") {
        return { json: { envios, stats } }
      }
      if (method === "POST" && url === "/api/admin/email-massa/bounces/sincronizar") {
        return { json: { processados: 0, marcados: 0 } }
      }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<HistoricoTab />)
    await screen.findByText("Nenhum disparo registrado ainda.")

    fireEvent.click(screen.getByRole("button", { name: /Sincronizar bounces/ }))

    await waitFor(() => expect(toastMock.info).toHaveBeenCalledWith("Nenhum bounce novo encontrado"))
  })

  it("Relatório do card gera PDF com os dados do disparo", async () => {
    const disparo = { id: 2, nome: "Promo Julho", status: "concluido", total: 10, enviados: 10, falhas: 0, pendentes: 0, erro: null, criadoEm: "2026-07-09T10:00:00.000Z" }
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/email-massa/disparos") return { json: { disparos: [disparo] } }
      if (method === "GET" && url === "/api/admin/email-massa/historico") {
        return { json: { envios, stats } }
      }
      if (method === "GET" && url === "/api/admin/email-massa/disparos/2/relatorio") {
        return { json: { disparo, stats: { pendentes: 1, enviados: 10, falhas: 2, lidos: 5, clicados: 3, totalCliques: 6 }, envios: [
          { id: 1, email: "ana@empresa.com", nome: "Ana Souza", status: "enviado", error: null, abertoEm: "2026-07-10T10:00:00.000Z", enviadoEm: "2026-07-09T10:00:00.000Z", totalCliques: 2 },
          { id: 2, email: "bruno@empresa.com", nome: "Bruno Lima", status: "enviado", error: null, abertoEm: null, enviadoEm: "2026-07-09T10:00:00.000Z", totalCliques: 0 },
          { id: 3, email: "carla@empresa.com", nome: "Carla Dias", status: "falhou", error: "550 rejected", abertoEm: null, enviadoEm: "2026-07-09T10:00:00.000Z", totalCliques: 0 },
        ], links: [{ urlOriginal: "https://pdmprotextil.com.br", total: 6 }] } }
      }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<HistoricoTab />)
    await screen.findByText("Promo Julho")

    fireEvent.click(await screen.findByRole("button", { name: /^Relatório$/ }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/admin/email-massa/disparos/2/relatorio", "GET")).toBeDefined())
    await waitFor(() => expect(exportPDFRelatorio).toHaveBeenCalledWith(expect.objectContaining({ filename: expect.stringContaining("relatorio-disparo-2-") })))
    const args = vi.mocked(exportPDFRelatorio).mock.calls.at(-1)![0] as any
    expect(args.title).toContain("Promo Julho")
    expect(args.stats).toEqual({ Total: 10, Enviados: 10, Lidos: 5, Cliques: 6, Clicados: 3, Falhas: 2, Pendentes: 1 })
    expect(args.tables).toHaveLength(4)
    expect(args.tables.map((t: any) => t.title)).toEqual(["Lidos (1)", "Enviados (1)", "Falhas (1)", "Links mais clicados"])
    expect(args.tables[0].headers).toEqual(["Email", "Nome", "Aberto em", "Enviado em", "Cliques", "Erro"])
    expect(args.tables[2].rows[0][5]).toBe("550 rejected")
  })

  it("Criar lista abre o modal de falhas a partir do combobox do disparo e cria a lista via POST", async () => {
    const disparo = { id: 2, nome: "Promo Julho", status: "concluido", total: 10, enviados: 9, falhas: 1, pendentes: 0, erro: null, criadoEm: "2026-07-09T10:00:00.000Z" }
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/email-massa/disparos") return { json: { disparos: [disparo] } }
      if (method === "GET" && url === "/api/admin/email-massa/historico") {
        return { json: { envios, stats } }
      }
      if (method === "POST" && url === "/api/admin/email-massa/disparos/2/criar-lista") {
        return { json: { total: 1, nome: "Falhas - Promo Julho" } }
      }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<HistoricoTab />)
    await screen.findByText("Promo Julho")

    fireEvent.click(await screen.findByRole("button", { name: "Criar lista" }))
    fireEvent.click(await screen.findByRole("menuitem", { name: "Falhas" }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByRole("heading", { name: /Criar lista de contatos que falharam/ })).toBeInTheDocument()
    expect(within(dialog).getByLabelText("Nome da lista")).toHaveValue("Falhas - Promo Julho")

    fireEvent.click(within(dialog).getByRole("button", { name: "Criar lista" }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/admin/email-massa/disparos/2/criar-lista", "POST")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith(expect.stringContaining("1 contato(s)")))
  })

  it("mostra mini cards com totais por status no card de disparo", async () => {
    const disparo = { id: 2, nome: "Promo Julho", status: "concluido", total: 10, enviados: 9, falhas: 1, pendentes: 0, lidos: 5, cliques: 3, erro: null, criadoEm: "2026-07-09T10:00:00.000Z" }
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/email-massa/disparos") return { json: { disparos: [disparo] } }
      if (method === "GET" && url === "/api/admin/email-massa/historico") {
        return { json: { envios, stats } }
      }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<HistoricoTab />)
    await screen.findByText("Promo Julho")

    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("9")).toBeInTheDocument()
    expect(screen.getByText("10")).toBeInTheDocument()
  })

  it("gera PDF por card a partir do dropdown do disparo", async () => {
    const disparo = { id: 2, nome: "Promo Julho", status: "concluido", total: 10, enviados: 10, falhas: 0, pendentes: 0, erro: null, criadoEm: "2026-07-09T10:00:00.000Z" }
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/email-massa/disparos") return { json: { disparos: [disparo] } }
      if (method === "GET" && url === "/api/admin/email-massa/historico") {
        return { json: { envios, stats } }
      }
      if (method === "GET" && url === "/api/admin/email-massa/disparos/2/relatorio") {
        return { json: { disparo, stats: { pendentes: 0, enviados: 10, falhas: 2, lidos: 5, clicados: 3, totalCliques: 6 }, envios: [
          { id: 1, email: "ana@empresa.com", nome: "Ana Souza", status: "enviado", error: null, abertoEm: "2026-07-10T10:00:00.000Z", enviadoEm: "2026-07-09T10:00:00.000Z", totalCliques: 2 },
          { id: 2, email: "bruno@empresa.com", nome: "Bruno Lima", status: "enviado", error: null, abertoEm: null, enviadoEm: "2026-07-09T10:00:00.000Z", totalCliques: 0 },
          { id: 3, email: "carla@empresa.com", nome: "Carla Dias", status: "falhou", error: "550 rejected", abertoEm: null, enviadoEm: "2026-07-09T10:00:00.000Z", totalCliques: 0 },
        ], links: [] } }
      }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<HistoricoTab />)
    await screen.findByText("Promo Julho")

    await screen.findByRole("button", { name: /^Relatório$/ })
    fireEvent.click(screen.getByRole("button", { name: "PDF" }))
    fireEvent.click(await screen.findByRole("menuitem", { name: "Enviados" }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/admin/email-massa/disparos/2/relatorio", "GET")).toBeDefined())
    await waitFor(() => expect(exportPDFRelatorio).toHaveBeenCalled())
    const args = vi.mocked(exportPDFRelatorio).mock.calls.at(-1)![0] as any
    expect(args.title).toContain("Enviados do Disparo #2")
    expect(args.filename).toContain("relatorio-disparo-2-enviados-")
    expect(args.stats).toEqual({ Enviados: 1 })
    expect(args.tables).toHaveLength(1)
    expect(args.tables[0].title).toBe("Enviados (1)")
    expect(args.tables[0].rows[0][0]).toBe("bruno@empresa.com")
  })

  it("gera PDF de falhas a partir do dropdown do disparo", async () => {
    const disparo = { id: 2, nome: "Promo Julho", status: "concluido", total: 10, enviados: 10, falhas: 0, pendentes: 0, erro: null, criadoEm: "2026-07-09T10:00:00.000Z" }
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/email-massa/disparos") return { json: { disparos: [disparo] } }
      if (method === "GET" && url === "/api/admin/email-massa/historico") {
        return { json: { envios, stats } }
      }
      if (method === "GET" && url === "/api/admin/email-massa/disparos/2/relatorio") {
        return { json: { disparo, stats: { pendentes: 0, enviados: 10, falhas: 2, lidos: 5, clicados: 3, totalCliques: 6 }, envios: [
          { id: 3, email: "carla@empresa.com", nome: "Carla Dias", status: "falhou", error: "550 rejected", abertoEm: null, enviadoEm: "2026-07-09T10:00:00.000Z", totalCliques: 0 },
        ], links: [] } }
      }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<HistoricoTab />)
    await screen.findByText("Promo Julho")

    await screen.findByRole("button", { name: /^Relatório$/ })
    fireEvent.click(screen.getByRole("button", { name: "PDF" }))
    fireEvent.click(await screen.findByRole("menuitem", { name: "Falhas" }))

    await waitFor(() => expect(exportPDFRelatorio).toHaveBeenCalled())
    const args = vi.mocked(exportPDFRelatorio).mock.calls.at(-1)![0] as any
    expect(args.title).toContain("Falhas do Disparo #2")
    expect(args.stats).toEqual({ Falhas: 1 })
    expect(args.tables[0].rows[0][5]).toBe("550 rejected")
  })
})
