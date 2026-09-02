// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import EmailConfigPage from "./page"
import { createFetchMock, renderPage, toastMock } from "@/test/harness"

function setup() {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/admin/config/smtp")
      return { json: { id: 1, host: "smtp.gmail.com", port: 587, user: "sistema@gmail.com", pass: "x", fromName: "PDM Têxtil", ativo: true } }
    if (method === "GET" && url === "/api/crm/config/email")
      return { json: { id: 1, host: "smtp.gmail.com", port: 587, user: "crm@gmail.com", pass: "x", fromName: "PDM CRM", replyTo: "comercial@pdm.com", ativo: true } }
    if (method === "GET" && url === "/api/admin/config/user-email")
      return { json: [{ id: 1, usuarioId: 2, email: "ana@gmail.com", ativo: true, limiteDiario: 1500, usuarioNome: "Ana Comercial", usuarioEmail: "ana@pdm.com" }] }
    if (method === "GET" && url === "/api/admin/usuarios")
      return { json: [{ id: 2, name: "Ana Comercial", email: "ana@pdm.com", role: "COMERCIAL" }] }
    if (method === "PUT" && url === "/api/admin/config/user-email") return { json: { success: true } }
    if (method === "DELETE" && url.startsWith("/api/admin/config/user-email")) return { json: { success: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("EmailConfigPage", () => {
  beforeEach(() => {
    vi.stubGlobal("confirm", () => true)
  })

  it("renderiza o heading e as 3 abas", async () => {
    setup()
    renderPage(<EmailConfigPage />)
    expect(await screen.findByRole("heading", { name: "Configuração de Email" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "SMTP Sistema" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Email por Usuário" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "SMTP CRM" })).toBeInTheDocument()
  })

  it("exibe o SMTP do sistema na primeira aba", async () => {
    setup()
    renderPage(<EmailConfigPage />)
    expect(await screen.findByText("SMTP Padrão do Sistema")).toBeInTheDocument()
    expect(screen.getByDisplayValue("sistema@gmail.com")).toBeInTheDocument()
  })

  it("troca para a aba Email por Usuário e lista as configurações", async () => {
    setup()
    renderPage(<EmailConfigPage />)
    await screen.findByText("SMTP Padrão do Sistema")
    fireEvent.click(screen.getByRole("tab", { name: "Email por Usuário" }))
    expect(await screen.findByText("Ana Comercial")).toBeInTheDocument()
    expect(screen.getByText("ana@gmail.com")).toBeInTheDocument()
  })

  it("troca para a aba SMTP CRM e exibe a configuração", async () => {
    setup()
    renderPage(<EmailConfigPage />)
    await screen.findByText("SMTP Padrão do Sistema")
    fireEvent.click(screen.getByRole("tab", { name: "SMTP CRM" }))
    expect(await screen.findByText("SMTP CRM")).toBeInTheDocument()
    expect(screen.getByDisplayValue("crm@gmail.com")).toBeInTheDocument()
  })
})
