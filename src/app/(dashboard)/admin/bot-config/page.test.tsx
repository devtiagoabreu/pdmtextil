// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import BotConfigAdminPage from "./page"
import { createFetchMock, findCall, renderPage, toastMock } from "@/test/harness"

const config = {
  pj: [1],
  pf: [],
  usuarios: [
    { id: 1, name: "Ana", email: "ana@empresa.com", role: "COMERCIAL", ativo: true, celWhatsapp: "5519999999999" },
    { id: 2, name: "Beto", email: "beto@empresa.com", role: "COMERCIAL", ativo: true, celWhatsapp: null },
    { id: 3, name: "Carla", email: "carla@empresa.com", role: "ADMIN", ativo: false, celWhatsapp: null },
  ],
}

function setup() {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/admin/bot-config") return { json: config }
    if (method === "PUT" && url === "/api/admin/bot-config") return { json: { ok: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("BotConfigAdminPage", () => {
  it("renderiza o heading e os usuários configurados", async () => {
    setup()
    renderPage(<BotConfigAdminPage />)

    expect(await screen.findByRole("heading", { name: "Config Bot WhatsApp" }, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByText("Pessoa Jurídica (PJ)")).toBeInTheDocument()
    expect(screen.getByText("Pessoa Física (PF)")).toBeInTheDocument()
    expect(screen.getAllByText("Ana")).toHaveLength(2)
    expect(screen.getAllByText("1 usuário inativo oculto")).toHaveLength(2)
  })

  it("marca PF para Ana e envia PUT com as listas atualizadas", async () => {
    const fetchMock = setup()
    renderPage(<BotConfigAdminPage />)
    await screen.findByText("Pessoa Física (PF)", {}, { timeout: 5000 })

    const anas = screen.getAllByText("Ana")
    const anaPf = anas.find(el => el.closest("section")?.textContent?.includes("Pessoa Física"))
    const checkboxPf = anaPf!.closest("label")!.querySelector("input")!
    fireEvent.click(checkboxPf)
    fireEvent.click(screen.getByRole("button", { name: "Salvar Configuração" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/admin/bot-config", "PUT")
      expect(call).toBeDefined()
      expect(call?.body?.pj).toEqual([1])
      expect(call?.body?.pf).toEqual([1])
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Configuração do bot salva!"))
  })
})