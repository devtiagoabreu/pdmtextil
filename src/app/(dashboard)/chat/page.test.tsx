// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import ChatPage from "./page"
import { createFetchMock, renderPage } from "@/test/harness"

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: "1", name: "Tiago Teste", email: "tiago@pdtextil.com.br", role: "ADMIN" } },
    status: "authenticated",
  }),
}))

const chats = [
  {
    id: 1,
    titulo: "Equipe Tecelagem",
    ultimaMensagem: "Romaneio 22742 confirmado",
    naoLidas: 2,
    entidadeTipo: "ROMANEIO",
    entidadeId: 5,
    ultimaMensagemData: "2026-08-06T10:00:00Z",
  },
  {
    id: 2,
    titulo: "Comercial SP",
    ultimaMensagem: "Orçamento enviado",
    naoLidas: 0,
    entidadeTipo: null,
    entidadeId: null,
    ultimaMensagemData: null,
  },
]

function handler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/chats") return { json: chats }
    if (method === "GET" && url === "/api/usuarios/ativos") return { json: [] }
    return { status: 404, json: { error: "Rota não mockada" } }
  }
}

describe("ChatPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", createFetchMock(handler()).fn)
  })

  it("renderiza o heading e a lista de conversas", async () => {
    renderPage(<ChatPage />)

    expect(screen.getByRole("heading", { name: "Chat Corporativo" })).toBeInTheDocument()
    expect(await screen.findByText("Equipe Tecelagem")).toBeInTheDocument()
    expect(screen.getByText("Comercial SP")).toBeInTheDocument()
    expect(screen.getByText("Romaneio 22742 confirmado")).toBeInTheDocument()
    expect(screen.getByText("2 conversa(s)")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Novo Chat" })).toBeInTheDocument()
  })

  it("mostra estado vazio quando não há conversas", async () => {
    const empty = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/chats") return { json: [] }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", empty.fn)
    renderPage(<ChatPage />)

    expect(await screen.findByText("Nenhuma conversa")).toBeInTheDocument()
    expect(screen.getByText("Selecione uma conversa")).toBeInTheDocument()
  })

  it("abre o diálogo de novo chat", async () => {
    renderPage(<ChatPage />)

    await screen.findByText("Equipe Tecelagem")
    fireEvent.click(screen.getByRole("button", { name: "Novo Chat" }))

    expect(screen.getByRole("heading", { name: "Novo Chat" })).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Assunto da conversa")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Digite sua mensagem...")).toBeInTheDocument()
  })
})
