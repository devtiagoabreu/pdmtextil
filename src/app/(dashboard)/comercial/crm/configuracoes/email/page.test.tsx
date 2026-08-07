// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import EmailConfigPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

const configExistente = {
  id: 1,
  host: "smtp.gmail.com",
  port: 587,
  user: "crm@dominio.com.br",
  pass: "senha-app",
  fromName: "PDM PRO TEXTIL - CRM",
  replyTo: "comercial@dominio.com.br",
  ativo: true,
}

function buildHandler(json: any) {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/crm/config/email") return { json }
    if (method === "PUT" && url === "/api/crm/config/email") return { json: { ok: true } }
    if (method === "DELETE" && url === "/api/crm/config/email") return { json: { ok: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  }
}

describe("CrmEmailConfigPage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    navMock.setPathname("/comercial/crm/configuracoes/email")
    fetchMock = createFetchMock(buildHandler({}))
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("renderiza o formulário de configuração", async () => {
    renderPage(<EmailConfigPage />)

    expect(await screen.findByRole("heading", { name: "Email CRM" })).toBeInTheDocument()
    expect(screen.getByPlaceholderText("crm@seudominio.com")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Senha de app do Gmail")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument()
  })

  it("valida email e senha obrigatórios antes de salvar", async () => {
    renderPage(<EmailConfigPage />)
    await screen.findByRole("button", { name: "Salvar" })

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Email e senha de app são obrigatórios"))
    expect(findCall(fetchMock.calls, "/api/crm/config/email", "PUT")).toBeUndefined()
  })

  it("salva a configuração via PUT", async () => {
    renderPage(<EmailConfigPage />)
    await screen.findByRole("button", { name: "Salvar" })

    fireEvent.change(screen.getByPlaceholderText("crm@seudominio.com"), { target: { value: "crm@dominio.com.br" } })
    fireEvent.change(screen.getByPlaceholderText("Senha de app do Gmail"), { target: { value: "senha-app" } })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/config/email", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({
        host: "smtp.gmail.com",
        port: 587,
        user: "crm@dominio.com.br",
        pass: "senha-app",
        fromName: "PDM PRO TEXTIL - CRM",
        replyTo: "",
        ativo: true,
      })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Configuração CRM salva!"))
  })

  it("carrega configuração existente e limpa via DELETE", async () => {
    fetchMock = createFetchMock(buildHandler(configExistente))
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<EmailConfigPage />)
    await screen.findByDisplayValue("crm@dominio.com.br")

    fireEvent.click(screen.getByRole("button", { name: /Limpar/ }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/crm/config/email", "DELETE")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Configuração removida"))
  })
})
