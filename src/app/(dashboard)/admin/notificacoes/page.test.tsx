// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import NotificacoesAdminPage from "./page"
import { createFetchMock, findCall, renderPage, toastMock } from "@/test/harness"

const regras = [{ tipo: "SOLICITACAO_CRIADA", roles: ["ADMIN"] }]

function setup() {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/admin/notificacao-regras") return { json: { regras } }
    if (method === "PUT" && url === "/api/admin/notificacao-regras") return { json: { ok: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("NotificacoesAdminPage", () => {
  it("renderiza o heading e as regras", async () => {
    setup()
    renderPage(<NotificacoesAdminPage />)

    expect(await screen.findByRole("heading", { name: "Notificações por Tipo" }, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByText("Solicitação Criada")).toBeInTheDocument()
  })

  it("salva as regras via PUT após alternar um checkbox", async () => {
    const fetchMock = setup()
    renderPage(<NotificacoesAdminPage />)
    await screen.findByText("Solicitação Criada", {}, { timeout: 5000 })

    fireEvent.click(screen.getAllByRole("checkbox")[1])
    fireEvent.click(screen.getByRole("button", { name: "Salvar Regras" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/admin/notificacao-regras", "PUT")
      expect(call).toBeDefined()
      expect(call?.body?.tipo).toBe("SOLICITACAO_CRIADA")
      expect(Array.isArray(call?.body?.roles)).toBe(true)
      expect(call?.body?.roles).toEqual(expect.arrayContaining(["ADMIN", "COMERCIAL"]))
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Regras de notificação salvas!"))
  })
})
