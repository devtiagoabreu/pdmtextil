// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"
import NovoRepresentantePage from "./page"

describe("NovoRepresentantePage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/representantes/novo")
  })

  it("renderiza o formulário de criação", () => {
    const fetchMock = createFetchMock(() => ({ json: {} }))
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<NovoRepresentantePage />)

    expect(screen.getByRole("heading", { name: /Novo Representante/ })).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Ex: Representações ABC")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("00.000.000/0001-00")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Salvar Representante" })).toBeInTheDocument()
  })

  it("valida os campos obrigatórios antes de salvar", async () => {
    const fetchMock = createFetchMock(() => ({ json: {} }))
    vi.stubGlobal("fetch", fetchMock.fn)

    const ui = renderPage(<NovoRepresentantePage />)
    fireEvent.submit(ui.container.querySelector("form")!)

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Nome fantasia é obrigatório"))
    expect(findCall(fetchMock.calls, "/api/representantes", "POST")).toBeUndefined()
  })

  it("cria representante via POST e redireciona para a lista", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "POST" && url === "/api/representantes") return { status: 201, json: { id: 99 } }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<NovoRepresentantePage />)
    fireEvent.change(screen.getByPlaceholderText("Ex: Representações ABC"), { target: { value: "Rep Teste" } })
    fireEvent.change(screen.getByPlaceholderText("00.000.000/0001-00"), { target: { value: "11.222.333/0001-44" } })
    fireEvent.change(screen.getByPlaceholderText("ID do gerente"), { target: { value: "3" } })
    fireEvent.click(screen.getByRole("button", { name: "Salvar Representante" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/representantes", "POST")
      expect(call).toBeDefined()
      expect(call!.body.nome).toBe("Rep Teste")
      expect(call!.body.cnpj).toBe("11.222.333/0001-44")
      expect(call!.body.gerenteId).toBe(3)
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Representante cadastrado com sucesso!"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/representantes")
  })
})
