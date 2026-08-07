// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import NotificacoesPage from "./page"
import { createFetchMock, renderPage, findCall, navMock } from "@/test/harness"

const notificacoes = [
  {
    id: 1,
    titulo: "Novo lead cadastrado",
    mensagem: "Malharia Silva entrou no funil",
    tipo: "lead_novo",
    lida: false,
    link: null,
    metadados: null,
    createdAt: "2024-01-05T10:00:00",
  },
  {
    id: 2,
    titulo: "Lead finalizado",
    mensagem: "Venda concluída",
    tipo: "lead_finalizado",
    lida: false,
    link: "/comercial/crm/leads/2",
    metadados: null,
    createdAt: "2024-01-06T10:00:00",
  },
]

function buildHandler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/crm/notificacoes") return { json: { lista: notificacoes, naoLidas: 2 } }
    if (method === "GET" && url === "/api/crm/notificacoes?naoLidas=true") {
      return { json: { lista: notificacoes.filter((n: any) => !n.lida), naoLidas: 2 } }
    }
    if (method === "PATCH") return { json: {} }
    return { json: null }
  }
}

function render() {
  navMock.setPathname("/comercial/crm/notificacoes")
  const mock = createFetchMock(buildHandler())
  vi.stubGlobal("fetch", mock.fn)
  const { container } = renderPage(<NotificacoesPage />)
  return { mock, container }
}

describe("NotificacoesPage", () => {
  it("renderiza a lista de notificações", async () => {
    const { mock } = render()

    expect(await screen.findByRole("heading", { name: "Notificações" })).toBeInTheDocument()
    await screen.findByText("Novo lead cadastrado")
    expect(screen.getByText("Malharia Silva entrou no funil")).toBeInTheDocument()
    expect(screen.getByText("Lead finalizado")).toBeInTheDocument()
    expect(screen.getByText("Venda concluída")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Marcar todas como lidas" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Ver detalhes/ })).toBeInTheDocument()
    expect(findCall(mock.calls, "/api/crm/notificacoes", "GET")).toBeDefined()
  })

  it("filtra apenas as notificações não lidas", async () => {
    const { mock } = render()
    await screen.findByText("Novo lead cadastrado")

    fireEvent.click(screen.getByRole("button", { name: /Não lidas/ }))

    await waitFor(() =>
      expect(findCall(mock.calls, "/api/crm/notificacoes?naoLidas=true", "GET")).toBeDefined()
    )
  })

  it("marca uma notificação como lida via PATCH", async () => {
    const { container, mock } = render()
    await screen.findByText("Novo lead cadastrado")

    fireEvent.click(container.querySelectorAll("svg.lucide-check")[0].closest("button")!)

    await waitFor(() =>
      expect(findCall(mock.calls, "/api/crm/notificacoes/1/ler", "PATCH")).toBeDefined()
    )
  })

  it("marca todas as notificações como lidas", async () => {
    const { mock } = render()
    await screen.findByText("Novo lead cadastrado")

    fireEvent.click(screen.getByRole("button", { name: "Marcar todas como lidas" }))

    await waitFor(() => {
      const patches = mock.calls.filter((c: any) => c.method === "PATCH")
      expect(patches.map((c: any) => c.url).sort()).toEqual([
        "/api/crm/notificacoes/1/ler",
        "/api/crm/notificacoes/2/ler",
      ])
    })
  })

  it("mostra estado vazio quando não há notificações", async () => {
    navMock.setPathname("/comercial/crm/notificacoes")
    const mock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/notificacoes") {
        return { json: { lista: [], naoLidas: 0 } }
      }
      return { json: null }
    })
    vi.stubGlobal("fetch", mock.fn)
    renderPage(<NotificacoesPage />)

    expect(await screen.findByText("Nenhuma notificação")).toBeInTheDocument()
  })

  it("mostra estado vazio no filtro de não lidas", async () => {
    navMock.setPathname("/comercial/crm/notificacoes")
    const mock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/notificacoes") {
        return { json: { lista: notificacoes, naoLidas: 2 } }
      }
      if (method === "GET" && url === "/api/crm/notificacoes?naoLidas=true") {
        return { json: { lista: [], naoLidas: 0 } }
      }
      return { json: null }
    })
    vi.stubGlobal("fetch", mock.fn)
    renderPage(<NotificacoesPage />)

    await screen.findByText("Novo lead cadastrado")
    fireEvent.click(screen.getByRole("button", { name: /Não lidas/ }))

    expect(await screen.findByText("Nenhuma notificação não lida")).toBeInTheDocument()
  })
})
