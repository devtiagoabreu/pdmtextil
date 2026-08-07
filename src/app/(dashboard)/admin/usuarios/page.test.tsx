// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import UsuariosPage from "./page"
import { createFetchMock, findCall, renderPage, toastMock } from "@/test/harness"

const usuarios = [
  { id: 1, email: "ana@empresa.com", name: "Ana Souza", role: "COMERCIAL", ativo: true, ultimoAcesso: null, createdAt: "2025-01-01T00:00:00Z" },
  { id: 2, email: "bruno@empresa.com", name: "Bruno Lima", role: "ADMIN", ativo: false, ultimoAcesso: null, createdAt: "2025-01-01T00:00:00Z" },
]

const roles = [
  { id: 1, name: "COMERCIAL", label: "Comercial", ativo: true },
  { id: 2, name: "ADMIN", label: "Administrador", ativo: true },
]

function setup() {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/admin/usuarios") return { json: usuarios }
    if (method === "GET" && url === "/api/admin/roles") return { json: roles }
    if (method === "POST" && url === "/api/admin/usuarios") return { status: 201, json: { id: 9 } }
    if (method === "DELETE" && url === "/api/admin/usuarios/1") return { json: { ok: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("UsuariosPage", () => {
  it("renderiza heading e dados da lista", async () => {
    setup()
    renderPage(<UsuariosPage />)

    expect(screen.getByRole("heading", { name: "Usuários" })).toBeInTheDocument()
    expect(await screen.findByText("Ana Souza")).toBeInTheDocument()
    expect(screen.getByText("ana@empresa.com")).toBeInTheDocument()
    expect(screen.getByText("Comercial")).toBeInTheDocument()
    expect(screen.getByText("Ativo")).toBeInTheDocument()
    expect(screen.getByText("Bruno Lima")).toBeInTheDocument()
    expect(screen.getByText("Administrador")).toBeInTheDocument()
    expect(screen.getByText("Inativo")).toBeInTheDocument()
  })

  it("filtra a lista pela busca", async () => {
    setup()
    renderPage(<UsuariosPage />)
    await screen.findByText("Ana Souza")

    const busca = screen.getByPlaceholderText("Buscar por nome ou email...")
    fireEvent.change(busca, { target: { value: "Ana" } })
    expect(screen.getByText("Ana Souza")).toBeInTheDocument()
    expect(screen.queryByText("Bruno Lima")).not.toBeInTheDocument()

    fireEvent.change(busca, { target: { value: "zzz-inexistente" } })
    expect(screen.queryByText("Ana Souza")).not.toBeInTheDocument()
    expect(screen.getByText("Nenhum usuário encontrado")).toBeInTheDocument()
  })

  it("mostra estado vazio quando não há usuários", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/usuarios") return { json: [] }
      if (method === "GET" && url === "/api/admin/roles") return { json: roles }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<UsuariosPage />)

    expect(await screen.findByText("Nenhum usuário encontrado")).toBeInTheDocument()
  })

  it("valida campos obrigatórios no cadastro inline", async () => {
    const fetchMock = setup()
    renderPage(<UsuariosPage />)
    await screen.findByText("Ana Souza")

    fireEvent.click(screen.getByRole("button", { name: "Novo Usuário" }))
    expect(screen.getByRole("heading", { name: "Novo Usuário" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Criar" }))

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Preencha email, nome e senha"))
    expect(findCall(fetchMock.calls, "/api/admin/usuarios", "POST")).toBeUndefined()
  })

  it("cria usuário via POST inline", async () => {
    const fetchMock = setup()
    renderPage(<UsuariosPage />)
    await screen.findByText("Ana Souza")

    fireEvent.click(screen.getByRole("button", { name: "Novo Usuário" }))
    fireEvent.change(screen.getByPlaceholderText("Nome completo"), { target: { value: "Carla Dias" } })
    fireEvent.change(screen.getByPlaceholderText("email@exemplo.com"), { target: { value: "carla@empresa.com" } })
    fireEvent.change(screen.getByPlaceholderText("Mínimo 6 caracteres"), { target: { value: "123456" } })
    fireEvent.click(screen.getByRole("button", { name: "Criar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/admin/usuarios", "POST")
      expect(call).toBeDefined()
      expect(call?.body?.email).toBe("carla@empresa.com")
      expect(call?.body?.name).toBe("Carla Dias")
      expect(call?.body?.password).toBe("123456")
      expect(call?.body?.role).toBe("COMERCIAL")
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Usuário criado!"))
  })

  it("exclui usuário via confirm chamando DELETE", async () => {
    const fetchMock = setup()
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true)
    renderPage(<UsuariosPage />)
    await screen.findByText("Ana Souza")

    const row = screen.getByText("Ana Souza").closest("tr")!
    fireEvent.click(within(row).getByRole("button"))

    expect(confirmSpy).toHaveBeenCalledWith("Excluir usuário \"Ana Souza\"?")
    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/admin/usuarios/1", "DELETE")
      expect(call).toBeDefined()
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Usuário excluído!"))
    confirmSpy.mockRestore()
  })
})
