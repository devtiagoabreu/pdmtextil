// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import ConversasPage from "./page"
import { createFetchMock, renderPage } from "@/test/harness"

const conversas = [
  {
    remoteJid: "5511999990000",
    nome: "João da Silva",
    ultimaMensagem: "Olá, gostaria de um orçamento",
    ultimoTipo: "RECEBIDA",
    ultimaData: "2026-08-05T14:30:00Z",
    naoLidas: 2,
    total: 5,
    leadId: 1,
    link: "/comercial/crm/leads/1",
  },
  {
    remoteJid: "5511888881111",
    nome: "Maria Souza",
    ultimaMensagem: "Obrigado!",
    ultimoTipo: "ENVIADA",
    ultimaData: "2026-08-04T10:00:00Z",
    naoLidas: 0,
    total: 3,
    leadId: null,
    link: null,
  },
]

function buildHandler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url.startsWith("/api/crm/whatsapp/conversas")) {
      const busca = url.includes("search=") ? decodeURIComponent(url.split("search=")[1]) : ""
      const filtradas = conversas.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()))
      return { json: filtradas }
    }
    if (method === "GET" && url.startsWith("/api/crm/whatsapp?remoteJid=")) return { json: [] }
    if (method === "GET" && url.startsWith("/api/crm/whatsapp/chat?remoteJid=")) return { json: { conversa: null } }
    return { status: 404, json: { error: "Rota não mockada" } }
  }
}

describe("ConversasPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", createFetchMock(buildHandler()).fn)
  })

  it("renderiza a lista de conversas e o painel vazio", async () => {
    renderPage(<ConversasPage />)

    expect(screen.getByRole("heading", { name: "Conversas WhatsApp" })).toBeInTheDocument()
    expect(await screen.findByText("João da Silva")).toBeInTheDocument()
    expect(screen.getByText("Maria Souza")).toBeInTheDocument()
    expect(screen.getByText("Olá, gostaria de um orçamento")).toBeInTheDocument()
    expect(screen.getByText("Selecione uma conversa")).toBeInTheDocument()
  })

  it("mostra estado vazio quando a API retorna vazio", async () => {
    const empty = createFetchMock(() => ({ json: [] }))
    vi.stubGlobal("fetch", empty.fn)

    renderPage(<ConversasPage />)

    expect(await screen.findByText("Nenhuma conversa encontrada")).toBeInTheDocument()
  })

  it("filtra conversas pela busca", async () => {
    renderPage(<ConversasPage />)
    await screen.findByText("João da Silva")

    fireEvent.change(screen.getByPlaceholderText("Buscar conversa..."), { target: { value: "Maria" } })

    expect(await screen.findByText("Maria Souza")).toBeInTheDocument()
    expect(screen.queryByText("João da Silva")).not.toBeInTheDocument()
  })

  it("abre uma conversa e exibe o painel de chat", async () => {
    renderPage(<ConversasPage />)
    await screen.findByText("João da Silva")

    fireEvent.click(screen.getByText("João da Silva"))

    expect(await screen.findByText("5511999990000")).toBeInTheDocument()
    expect(await screen.findByText("Nenhuma mensagem")).toBeInTheDocument()
  })
})
