// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import EmailMassaPage from "./page"
import { createFetchMock, renderPage, toastMock } from "@/test/harness"

const modelos = [{ id: 1, nome: "Promoção de Verão", assunto: "Oferta imperdível", html: "<p>oi</p>" }]
const listas = [{ id: 1, nome: "Clientes SP", totalContatos: 10 }]

function setup(config: { email?: string; ativo?: boolean } | null = null) {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/admin/email-massa/modelos") return { json: modelos }
    if (method === "GET" && url === "/api/admin/email-massa/listas") return { json: listas }
    if (method === "GET" && url === "/api/user/email-config") {
      return { json: config ? { config: { email: config.email, ativo: config.ativo ?? true } } : { config: null } }
    }
    return { json: [] }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("EmailMassaPage", () => {
  it("renderiza heading e todas as abas", async () => {
    setup()
    renderPage(<EmailMassaPage />)

    expect(screen.getByRole("heading", { name: "Email em Massa" })).toBeInTheDocument()
    for (const aba of ["Enviar Email", "Modelos", "Listas", "Histórico", "Programar Disparo", "Dashboard"]) {
      expect(screen.getByRole("tab", { name: aba })).toBeInTheDocument()
    }
  })

  it("carrega modelos e os exibe na aba Modelos", async () => {
    setup()
    renderPage(<EmailMassaPage />)

    fireEvent.click(screen.getByRole("tab", { name: "Modelos" }))

    expect(await screen.findByText("Promoção de Verão")).toBeInTheDocument()
    expect(screen.getByText("Oferta imperdível")).toBeInTheDocument()
  })

  it("exclui um modelo via modal de confirmação", async () => {
    const fetchMock = setup()
    renderPage(<EmailMassaPage />)

    fireEvent.click(screen.getByRole("tab", { name: "Modelos" }))
    await screen.findByText("Promoção de Verão")

    fireEvent.click(screen.getByRole("button", { name: "Deletar modelo Promoção de Verão" }))

    expect(screen.getByText("Deletar modelo?")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Deletar" }))

    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Modelo deletado"))
    expect(fetchMock.calls.some((c) => c.method === "DELETE" && c.url === "/api/admin/email-massa/modelos/1")).toBe(true)
  })

  it("valida conteúdo vazio antes de enviar", async () => {
    setup()
    renderPage(<EmailMassaPage />)

    fireEvent.click(screen.getByRole("button", { name: "Enviar Email em Massa" }))

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Escreva o conteúdo do email"))
  })

  it("exibe disparo em andamento e estatísticas na aba Histórico", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/email-massa/modelos") return { json: modelos }
      if (method === "GET" && url === "/api/admin/email-massa/listas") return { json: listas }
      if (method === "GET" && url === "/api/admin/email-massa/disparos") {
        return { json: { disparos: [{ id: 2, nome: "07.08 | Feira Equipotel", status: "enviando", total: 4711, enviados: 380, falhas: 2, pendentes: 10, lidos: 0, cliques: 0 }] } }
      }
      if (method === "GET" && url === "/api/admin/email-massa/historico") {
        return { json: { envios: [], stats: { total: 0, enviados: 0, lidos: 0, falhas: 0, totalCliques: 9 } } }
      }
      return { json: [] }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<EmailMassaPage />)

    fireEvent.click(screen.getByRole("tab", { name: "Histórico" }))

    expect(await screen.findByText("Histórico de Envios")).toBeInTheDocument()
    expect(await screen.findByText("07.08 | Feira Equipotel")).toBeInTheDocument()
    expect(screen.getByText(/382 de 4711/)).toBeInTheDocument()
    expect(screen.getByText("Enviando")).toBeInTheDocument()
    expect(screen.getByText("380")).toBeInTheDocument()
    expect(screen.getByText("Falhas")).toBeInTheDocument()
  })

  it("mostra aviso quando o usuário não tem email configurado", async () => {
    setup(null)
    renderPage(<EmailMassaPage />)

    expect(await screen.findByText(/Nenhuma configuração encontrada/)).toBeInTheDocument()
    const radio = screen.getByLabelText("Meu Email") as HTMLInputElement
    expect(radio).toBeDisabled()
  })

  it("habilita Meu Email quando o usuário tem configuração ativa", async () => {
    setup({ email: "usuario@gmail.com", ativo: true })
    renderPage(<EmailMassaPage />)

    expect(await screen.findByLabelText("Meu Email (usuario@gmail.com)")).toBeInTheDocument()
    const radio = screen.getByLabelText("Meu Email (usuario@gmail.com)") as HTMLInputElement
    expect(radio).toBeEnabled()
  })

  it("mostra Meu Email como inativa e desabilitado quando a configuração está inativa", async () => {
    setup({ email: "usuario@gmail.com", ativo: false })
    renderPage(<EmailMassaPage />)

    expect(await screen.findByText(/inativa/)).toBeInTheDocument()
    const radio = screen.getByRole("radio", { name: /Meu Email \(usuario@gmail\.com\)/ }) as HTMLInputElement
    expect(radio).toBeDisabled()
  })

  it("exibe as três opções de remetente: Sistema, Meu Email e CRM", async () => {
    setup({ email: "usuario@gmail.com", ativo: true })
    renderPage(<EmailMassaPage />)

    expect(await screen.findByLabelText(/Meu Email \(usuario@gmail\.com\)/)).toBeInTheDocument()
    const sistema = screen.getByRole("radio", { name: /Sistema.*SMTP padrão/ })
    const meuEmail = screen.getByRole("radio", { name: /Meu Email/ })
    const crm = screen.getByRole("radio", { name: /CRM.*SMTP CRM/ })
    expect(sistema).toBeInTheDocument()
    expect(meuEmail).toBeInTheDocument()
    expect(crm).toBeInTheDocument()
  })
})
