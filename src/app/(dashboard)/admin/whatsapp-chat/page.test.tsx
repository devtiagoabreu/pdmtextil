// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { createFetchMock, renderPage } from "@/test/harness"
import WhatsAppChatPage from "./page"

const JID = "5519988887777@s.whatsapp.net"

function buildFetchMock() {
  return createFetchMock(({ method, url }) => {
    if (method === "GET" && url.startsWith("/api/crm/whatsapp/conversas")) {
      return {
        status: 200,
        json: [
          {
            remoteJid: JID,
            nome: "Maria Silva",
            ultimaMensagem: "Ola",
            ultimoTipo: "RECEBIDA",
            ultimaData: "2026-09-05T10:00:00Z",
            naoLidas: 1,
            total: 3,
            leadId: null,
            link: null,
          },
        ],
      }
    }
    if (method === "GET" && url.startsWith(`/api/crm/whatsapp/chat?remoteJid=${encodeURIComponent(JID)}`)) {
      return {
        status: 200,
        json: {
          mensagens: [
            { id: 1, remoteJid: JID, mensagem: "Ola", tipo: "RECEBIDA", status: "RECEBIDA", createdAt: "2026-09-05T10:00:00Z" },
            { id: 2, remoteJid: JID, mensagem: "Enviada 1", tipo: "ENVIADA", status: "ENTREGUE", createdAt: "2026-09-05T10:01:00Z" },
            { id: 3, remoteJid: JID, mensagem: "Enviada 2", tipo: "ENVIADA", status: "LIDA", createdAt: "2026-09-05T10:02:00Z" },
            { id: 4, remoteJid: JID, mensagem: "Enviada 3", tipo: "ENVIADA", status: "ERRO", createdAt: "2026-09-05T10:03:00Z" },
            { id: 5, remoteJid: JID, mensagem: "Enviada 4", tipo: "ENVIADA", status: "ENVIADA", createdAt: "2026-09-05T10:04:00Z" },
          ],
          conversa: { remoteJid: JID, estado: "HUMANO_ASSUMINDO", dados: {}, updatedAt: "2026-09-05T10:00:00Z" },
          lead: { id: 42, nome: "Maria Silva", celular: "5519988887777", tipoPessoa: "PJ", status: "NOVO" },
        },
      }
    }
    return { status: 404, json: { error: `não mockado: ${method} ${url}` } }
  })
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn())
})

describe("WhatsAppChatPage", () => {
  it("renderiza a lista de conversas", async () => {
    const fetchMock = buildFetchMock()
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<WhatsAppChatPage />)
    expect(await screen.findByText("Maria Silva")).toBeInTheDocument()
  })

  it("exibe os icones de status de mensagens enviadas (ENTREGUE, LIDA, ERRO, ENVIADA)", async () => {
    const fetchMock = buildFetchMock()
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<WhatsAppChatPage />)

    const conv = await screen.findByText("Maria Silva")
    fireEvent.click(conv)

    await waitFor(() => {
      expect(screen.getByTestId("status-ENTREGUE")).toBeInTheDocument()
    })
    expect(screen.getByTestId("status-LIDA")).toBeInTheDocument()
    expect(screen.getByTestId("status-ERRO")).toBeInTheDocument()
    expect(screen.getByTestId("status-ENVIADA")).toBeInTheDocument()
  })
})
