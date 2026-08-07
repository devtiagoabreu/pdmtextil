// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import SmtpConfigPage from "./page"
import { createFetchMock, findCall, renderPage, toastMock } from "@/test/harness"

function setup(configJson: any = {}) {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/admin/config/smtp") return { json: configJson }
    if (method === "PUT" && url === "/api/admin/config/smtp") return { json: { ok: true } }
    if (method === "POST" && url === "/api/admin/config/email-teste") return { json: { message: "Email de teste enviado!" } }
    if (method === "DELETE" && url === "/api/admin/config/smtp") return { json: { ok: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("SmtpConfigPage", () => {
  it("renderiza o heading e o formulário", async () => {
    setup()
    renderPage(<SmtpConfigPage />)

    expect(await screen.findByRole("heading", { name: "SMTP" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument()
  })

  it("valida email e senha de app obrigatórios", async () => {
    const fetchMock = setup()
    renderPage(<SmtpConfigPage />)
    await screen.findByRole("heading", { name: "SMTP" })

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Email e senha de app são obrigatórios"))
    expect(findCall(fetchMock.calls, "/api/admin/config/smtp", "PUT")).toBeUndefined()
  })

  it("salva a configuração via PUT", async () => {
    const fetchMock = setup()
    renderPage(<SmtpConfigPage />)
    await screen.findByRole("heading", { name: "SMTP" })

    fireEvent.change(screen.getByPlaceholderText("seuemail@gmail.com"), { target: { value: "ti@empresa.com" } })
    fireEvent.change(screen.getByPlaceholderText("Senha de app do Gmail"), { target: { value: "app-pass" } })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/admin/config/smtp", "PUT")
      expect(call).toBeDefined()
      expect(call?.body?.host).toBe("smtp.gmail.com")
      expect(call?.body?.port).toBe(587)
      expect(call?.body?.user).toBe("ti@empresa.com")
      expect(call?.body?.pass).toBe("app-pass")
      expect(call?.body?.fromName).toBe("PDM Têxtil")
      expect(call?.body?.ativo).toBe(true)
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Configuração salva!"))
  })

  it("envia email de teste via POST quando há configuração", async () => {
    const fetchMock = setup({ id: 1, host: "smtp.gmail.com", port: 587, user: "ti@empresa.com", pass: "x", fromName: "PDM Têxtil", ativo: true })
    renderPage(<SmtpConfigPage />)
    expect(await screen.findByText("Testar Envio")).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText("teste@exemplo.com"), { target: { value: "destino@empresa.com" } })
    fireEvent.click(screen.getByRole("button", { name: "Testar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/admin/config/email-teste", "POST")
      expect(call).toBeDefined()
      expect(call?.body?.to).toBe("destino@empresa.com")
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Email de teste enviado!"))
  })
})
