// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import LeadDetailPage from "./page"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"

const { sessionMock } = vi.hoisted(() => ({
  sessionMock: { data: { user: { role: "ADMIN" as string } } },
}))
vi.mock("next-auth/react", () => ({
  useSession: () => sessionMock,
}))

const lead = {
  id: 1,
  nome: "João Pereira",
  tipoPessoa: "PJ",
  documento: "12.345.678/0001-90",
  email: "joao@email.com",
  celular: "(11) 91111-1111",
  telefone: "(11) 3333-3333",
  empresaNome: "Tecelagem Alpha",
  cargo: "Sócio",
  origem: "SITE",
  status: "NOVO",
  descricao: "Interessado em tecidos premium",
}

const mensagens = [
  {
    id: 1,
    mensagem: "Olá, gostaria de um orçamento",
    tipo: "RECEBIDA",
    status: "RECEBIDA",
    createdAt: "2026-07-01T10:00:00Z",
  },
]

describe("LeadDetailPage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/crm/leads/1")
    navMock.setParams({ id: "1" })
    sessionMock.data.user.role = "ADMIN"
  })

  it("carrega e exibe os dados do lead e as mensagens", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/leads/1") return { json: lead }
      if (method === "GET" && url === "/api/crm/leads/1/whatsapp") return { json: mensagens }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<LeadDetailPage />)

    expect(await screen.findByRole("heading", { name: "João Pereira" })).toBeInTheDocument()
    expect(screen.getAllByText("NOVO").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Tecelagem Alpha").length).toBeGreaterThan(0)
    expect(screen.getByText("joao@email.com")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "WhatsApp" })).toBeInTheDocument()
    expect(await screen.findByText("Olá, gostaria de um orçamento")).toBeInTheDocument()
  })

  it("edita e salva via PUT", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/leads/1") return { json: lead }
      if (method === "GET" && url === "/api/crm/leads/1/whatsapp") return { json: [] }
      if (method === "PUT" && url === "/api/crm/leads/1") return { json: { ...lead, nome: "João Pereira Junior" } }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<LeadDetailPage />)

    fireEvent.click(await screen.findByRole("button", { name: "Editar" }))
    const nomeInput = screen.getByDisplayValue("João Pereira")
    fireEvent.change(nomeInput, { target: { value: "João Pereira Junior" } })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/leads/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body.nome).toBe("João Pereira Junior")
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Lead atualizado"))
  })

  it("exclui o lead via modal de confirmação", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/leads/1") return { json: lead }
      if (method === "GET" && url === "/api/crm/leads/1/whatsapp") return { json: [] }
      if (method === "DELETE" && url === "/api/crm/leads/1") return { json: { ok: true } }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<LeadDetailPage />)

    fireEvent.click(await screen.findByRole("button", { name: "Excluir" }))
    const dialog = screen.getByRole("dialog", { name: "Excluir lead?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/crm/leads/1", "DELETE")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Lead excluído"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/leads")
  })

  it("envia uma mensagem pelo WhatsApp", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/leads/1") return { json: lead }
      if (method === "GET" && url === "/api/crm/leads/1/whatsapp") return { json: mensagens }
      if (method === "POST" && url === "/api/crm/leads/1/whatsapp") {
        return { status: 201, json: { id: 2, mensagem: "Olá!", tipo: "ENVIADA", status: "ENVIADA", createdAt: "2026-07-01T11:00:00Z" } }
      }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<LeadDetailPage />)

    const input = await screen.findByPlaceholderText("Digite uma mensagem...")
    await screen.findByText("Olá, gostaria de um orçamento")
    fireEvent.change(input, { target: { value: "Olá!" } })
    fireEvent.keyDown(input, { key: "Enter" })

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/leads/1/whatsapp", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ mensagem: "Olá!" })
    })
    expect(await screen.findByText("Olá!")).toBeInTheDocument()
  })

  it("mostra mensagem quando o lead não é encontrado", async () => {
    const fetchMock = createFetchMock(() => ({ json: null }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<LeadDetailPage />)

    expect(await screen.findByText("Lead não encontrado")).toBeInTheDocument()
  })

  it("não mostra o botão de excluir para não-administradores", async () => {
    sessionMock.data.user.role = "VENDEDOR"
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/leads/1") return { json: lead }
      if (method === "GET" && url === "/api/crm/leads/1/whatsapp") return { json: [] }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<LeadDetailPage />)

    await screen.findByRole("heading", { name: "João Pereira" })
    expect(screen.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument()
  })
})
