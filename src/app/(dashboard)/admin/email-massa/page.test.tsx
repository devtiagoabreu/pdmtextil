// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import EmailMassaPage from "./page"
import { createFetchMock, renderPage, toastMock } from "@/test/harness"

const modelos = [{ id: 1, nome: "Promoção de Verão", assunto: "Oferta imperdível", html: "<p>oi</p>" }]
const listas = [{ id: 1, nome: "Clientes SP", totalContatos: 10 }]

function setup() {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/admin/email-massa/modelos") return { json: modelos }
    if (method === "GET" && url === "/api/admin/email-massa/listas") return { json: listas }
    return { json: [] }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("EmailMassaPage", () => {
  it("renderiza heading e todas as abas", async () => {
    setup()
    renderPage(<EmailMassaPage />)

    expect(screen.getByRole("heading", { name: "Email em Massa" })).toBeInTheDocument()
    for (const aba of ["Enviar Email", "Modelos", "Listas", "Histórico", "Programar Disparo", "Dashboard"]) {
      expect(screen.getByRole("tab", { name: aba })).toBeInTheDocument()
    }
  })

  it("carrega modelos e os exibe na aba Modelos", async () => {
    setup()
    renderPage(<EmailMassaPage />)

    fireEvent.click(screen.getByRole("tab", { name: "Modelos" }))

    expect(await screen.findByText("Promoção de Verão")).toBeInTheDocument()
    expect(screen.getByText("Oferta imperdível")).toBeInTheDocument()
  })

  it("valida conteúdo vazio antes de enviar", async () => {
    setup()
    renderPage(<EmailMassaPage />)

    fireEvent.click(screen.getByRole("button", { name: "Enviar Email em Massa" }))

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Escreva o conteúdo do email"))
  })
})
