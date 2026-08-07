// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import EditarUsuarioPage from "./page"
import { createFetchMock, findCall, navMock, renderPage, toastMock } from "@/test/harness"

const usuario = { id: 5, name: "Ana Souza", email: "ana@empresa.com", role: "COMERCIAL", ativo: true }
const roles = [{ id: 1, name: "COMERCIAL", label: "Comercial", ativo: true }]

function setup() {
  navMock.setPathname("/admin/usuarios/5")
  navMock.setParams({ id: "5" })
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/admin/usuarios/5") return { json: usuario }
    if (method === "GET" && url === "/api/admin/roles") return { json: roles }
    if (method === "PUT" && url === "/api/admin/usuarios/5") return { json: { ok: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("EditarUsuarioPage", () => {
  it("carrega os dados e renderiza o heading", async () => {
    setup()
    renderPage(<EditarUsuarioPage />)

    expect(await screen.findByRole("heading", { name: "Editar Usuário" })).toBeInTheDocument()
    expect(screen.getByDisplayValue("Ana Souza")).toBeInTheDocument()
    expect(screen.getByDisplayValue("ana@empresa.com")).toBeInTheDocument()
  })

  it("valida nome e email obrigatórios", async () => {
    const fetchMock = setup()
    renderPage(<EditarUsuarioPage />)
    await screen.findByDisplayValue("Ana Souza")

    fireEvent.change(screen.getByDisplayValue("Ana Souza"), { target: { value: "" } })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Nome e email são obrigatórios"))
    expect(findCall(fetchMock.calls, "/api/admin/usuarios/5", "PUT")).toBeUndefined()
  })

  it("salva via PUT e redireciona para a lista", async () => {
    const fetchMock = setup()
    renderPage(<EditarUsuarioPage />)
    await screen.findByDisplayValue("Ana Souza")

    fireEvent.change(screen.getByDisplayValue("ana@empresa.com"), { target: { value: "ana.nova@empresa.com" } })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/admin/usuarios/5", "PUT")
      expect(call).toBeDefined()
      expect(call?.body?.name).toBe("Ana Souza")
      expect(call?.body?.email).toBe("ana.nova@empresa.com")
      expect(call?.body?.role).toBe("COMERCIAL")
      expect(call?.body?.ativo).toBe(true)
      expect(call?.body?.password).toBeUndefined()
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Usuário atualizado!"))
    expect(navMock.router.push).toHaveBeenCalledWith("/admin/usuarios")
  })

  it("inclui a senha no PUT quando preenchida", async () => {
    const fetchMock = setup()
    renderPage(<EditarUsuarioPage />)
    await screen.findByDisplayValue("Ana Souza")

    fireEvent.change(screen.getByPlaceholderText("Mínimo 6 caracteres"), { target: { value: "nova-senha" } })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/admin/usuarios/5", "PUT")
      expect(call).toBeDefined()
      expect(call?.body?.password).toBe("nova-senha")
    })
  })
})
