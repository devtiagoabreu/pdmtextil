// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import ContatoDetailPage from "./page"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"

const { sessionMock } = vi.hoisted(() => ({
  sessionMock: { data: { user: { role: "ADMIN" as string } } },
}))
vi.mock("next-auth/react", () => ({
  useSession: () => sessionMock,
}))

const contato = {
  id: 1,
  nome: "Carlos Silva",
  cargo: "Comprador",
  email: "carlos@alpha.com",
  telefone: "(11) 3000-0000",
  celular: "(11) 90000-0000",
  whatsapp: "(11) 90000-0000",
  principal: true,
  observacoes: "Contato principal da conta",
  empresaId: 1,
  empresaRazaoSocial: "Tecelagem Alpha",
}

const empresas = [{ id: 1, razaoSocial: "Tecelagem Alpha" }]

describe("ContatoDetailPage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/crm/contatos/1")
    navMock.setParams({ id: "1" })
    sessionMock.data.user.role = "ADMIN"
  })

  it("carrega e exibe os dados do contato", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/contatos/1") return { json: contato }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<ContatoDetailPage />)

    expect(await screen.findByRole("heading", { name: "Carlos Silva" })).toBeInTheDocument()
    expect(screen.getAllByText("Comprador").length).toBeGreaterThan(0)
    expect(screen.getByText("Sim")).toBeInTheDocument()
    expect(screen.getByText("carlos@alpha.com")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Tecelagem Alpha" })).toHaveAttribute(
      "href",
      "/comercial/crm/pessoas/1"
    )
  })

  it("edita e salva via PUT", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/contatos/1") return { json: contato }
      if (method === "GET" && url === "/api/crm/pessoas") return { json: empresas }
      if (method === "PUT" && url === "/api/crm/contatos/1") return { json: { ...contato, nome: "Carlos Silva Jr" } }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<ContatoDetailPage />)

    fireEvent.click(await screen.findByRole("button", { name: "Editar" }))
    const nomeInput = screen.getByDisplayValue("Carlos Silva")
    fireEvent.change(nomeInput, { target: { value: "Carlos Silva Jr" } })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/contatos/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body.nome).toBe("Carlos Silva Jr")
      expect(call!.body.empresaId).toBe(1)
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Contato atualizado"))
  })

  it("exclui o contato via modal de confirmação", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/contatos/1") return { json: contato }
      if (method === "DELETE" && url === "/api/crm/contatos/1") return { json: { ok: true } }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<ContatoDetailPage />)

    fireEvent.click(await screen.findByRole("button", { name: "Excluir" }))
    const dialog = screen.getByRole("dialog", { name: "Excluir contato?" })
    expect(within(dialog).getByText(/Tem certeza que deseja excluir/)).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/crm/contatos/1", "DELETE")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Contato excluído"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/contatos")
  })

  it("mostra mensagem quando o contato não é encontrado", async () => {
    const fetchMock = createFetchMock(() => ({ json: null }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<ContatoDetailPage />)

    expect(await screen.findByText("Contato não encontrado")).toBeInTheDocument()
  })

  it("não mostra o botão de excluir para não-administradores", async () => {
    sessionMock.data.user.role = "VENDEDOR"
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/contatos/1") return { json: contato }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<ContatoDetailPage />)

    await screen.findByRole("heading", { name: "Carlos Silva" })
    expect(screen.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument()
  })
})
