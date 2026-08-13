// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { AgendarTab } from "./agendar-tab"
import { createFetchMock, renderPage, toastMock } from "@/test/harness"
import type { Agendado, Disparo } from "../types"

const agendado: Agendado = {
  id: 4,
  nome: "07.08 | Feira Equipotel",
  para: "todos",
  assunto: "Promo Feira",
  preheader: null,
  html: "<p>oi</p>",
  listas: null,
  modoEnvio: "individual",
  remetente: "sistema",
  agendadoPara: "2026-08-07T12:00:00.000Z",
  status: "agendado",
  enviadoEm: null,
  erro: null,
  criadoPor: 16,
  createdAt: "2026-08-06T19:00:00.000Z",
  updatedAt: "2026-08-06T19:00:00.000Z",
}

const rascunho: Agendado = { ...agendado, id: 5, nome: "Rascunho 1", status: "rascunho" }

const progresso: Disparo = {
  id: 42,
  nome: "07.08 | Feira Equipotel",
  para: "todos",
  assunto: "Promo Feira",
  modoEnvio: "individual",
  remetente: "sistema",
  remessaId: "abc",
  status: "fila",
  total: 4711,
  enviados: 100,
  falhas: 0,
  pendentes: 4611,
  lidos: 0,
  cliques: 0,
  erro: null,
  criadoPor: 16,
  criadoEm: "2026-08-07T16:36:59.000Z",
  iniciadoEm: null,
  concluidoEm: null,
}

function handler(agendados: Agendado[]) {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/admin/email-massa/agendados") return { json: agendados }
    if (method === "POST" && url === "/api/admin/email-massa/agendados/executar") {
      return { json: { executados: 0 } }
    }
    return { json: null }
  }
}

describe("AgendarTab", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", createFetchMock(handler([agendado, rascunho])).fn)
  })

  it("renderiza os agendamentos com botão Enviar agora no agendado", async () => {
    renderPage(
      <AgendarTab
        onCarregarNoEditor={vi.fn()}
        onNovoDisparo={vi.fn()}
        onEnviarAgendado={vi.fn()}
        disparoProgresso={null}
      />,
    )

    expect(await screen.findByText("07.08 | Feira Equipotel")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Enviar agora/ })).toBeInTheDocument()
    expect(screen.getByText("Rascunho 1")).toBeInTheDocument()
  })

  it("chama onEnviarAgendado ao clicar em Enviar agora", async () => {
    const onEnviarAgendado = vi.fn()
    renderPage(
      <AgendarTab
        onCarregarNoEditor={vi.fn()}
        onNovoDisparo={vi.fn()}
        onEnviarAgendado={onEnviarAgendado}
        disparoProgresso={null}
      />,
    )

    await screen.findByText("07.08 | Feira Equipotel")
    fireEvent.click(screen.getByRole("button", { name: /Enviar agora/ }))
    expect(onEnviarAgendado).toHaveBeenCalledWith(expect.objectContaining({ id: 4, status: "agendado" }))
  })

  it("mostra a barra de progresso quando há envio em andamento", async () => {
    renderPage(
      <AgendarTab
        onCarregarNoEditor={vi.fn()}
        onNovoDisparo={vi.fn()}
        onEnviarAgendado={vi.fn()}
        disparoProgresso={progresso}
      />,
    )

    await screen.findByText("07.08 | Feira Equipotel")
    const bar = screen.getByRole("progressbar")
    expect(bar).toHaveAttribute("aria-valuenow", "2")
    expect(screen.getByText("Envio em andamento")).toBeInTheDocument()
    expect(screen.getByText(/100 de 4711 processados/)).toBeInTheDocument()
  })

  it("exclui o rascunho via modal de confirmação e refaz o fetch", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/email-massa/agendados") return { json: [agendado, rascunho] }
      if (method === "POST" && url === "/api/admin/email-massa/agendados/executar") return { json: { executados: 0 } }
      if (method === "DELETE" && url === "/api/admin/email-massa/agendados/5") return { json: { success: true } }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(
      <AgendarTab
        onCarregarNoEditor={vi.fn()}
        onNovoDisparo={vi.fn()}
        onEnviarAgendado={vi.fn()}
        disparoProgresso={null}
      />,
    )

    await screen.findByText("Rascunho 1")
    fireEvent.click(screen.getByRole("button", { name: "Excluir Rascunho 1" }))

    expect(screen.getByText("Excluir agendamento?")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Excluído"))
    expect(fetchMock.calls.some((c) => c.method === "DELETE" && c.url === "/api/admin/email-massa/agendados/5")).toBe(true)
  })
})
