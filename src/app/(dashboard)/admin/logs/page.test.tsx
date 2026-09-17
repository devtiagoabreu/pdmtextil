// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import LogsAdminPage from "./page"
import { renderPage, createFetchMock, findCall, toastMock } from "@/test/harness"

const log = {
  id: 81,
  tipo: "ERRO",
  acao: "alterar_usuario",
  descricao: "Tentativa de alterar um usuário sem permissão",
  entidade: "usuarios",
  entidadeId: "12",
  usuarioId: 4,
  usuarioNome: "Admin",
  dados: null,
  createdAt: new Date("2026-02-20T14:30:00Z"),
}

function setup() {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url.startsWith("/api/admin/logs"))
      return { json: { itens: [log], total: 1, pagina: 1, limite: 20, totalPaginas: 1 } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("LogsAdminPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", undefined)
  })

  it("renderiza o heading e a linha do log", async () => {
    setup()
    renderPage(<LogsAdminPage />)

    expect(
      await screen.findByRole("heading", { name: "Logs de Auditoria" }, { timeout: 5000 })
    ).toBeInTheDocument()
    expect(await screen.findByText("alterar_usuario", {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByText("Admin")).toBeInTheDocument()
  })

  it("mostra estado vazio quando não há logs", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url.startsWith("/api/admin/logs"))
        return { json: { itens: [], total: 0, pagina: 1, limite: 20, totalPaginas: 0 } }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<LogsAdminPage />)

    expect(
      await screen.findByText("Nenhum log encontrado.", {}, { timeout: 5000 })
    ).toBeInTheDocument()
  })
})
