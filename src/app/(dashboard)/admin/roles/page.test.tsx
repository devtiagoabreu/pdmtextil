// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import RolesPage from "./page"
import { createFetchMock, findCall, renderPage, toastMock } from "@/test/harness"

const roles = [
  { id: 1, name: "SUPERVISOR", label: "Supervisor", description: "Supervisiona equipes", permissions: {}, ativo: true },
  { id: 2, name: "REVISOR", label: "Revisor", description: null, permissions: {}, ativo: false },
]

function setup() {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/admin/roles") return { json: roles }
    if (method === "POST" && url === "/api/admin/roles") return { status: 201, json: { id: 9 } }
    if (method === "PUT" && url === "/api/admin/roles/1") return { json: { ok: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("RolesPage", () => {
  it("renderiza heading e dados da lista", async () => {
    setup()
    renderPage(<RolesPage />)

    expect(screen.getByRole("heading", { name: "Perfis de Acesso (Roles)" })).toBeInTheDocument()
    expect(await screen.findByText("SUPERVISOR")).toBeInTheDocument()
    expect(screen.getByText("Supervisor")).toBeInTheDocument()
    expect(screen.getByText("Supervisiona equipes")).toBeInTheDocument()
    expect(screen.getByText("Ativo")).toBeInTheDocument()
    expect(screen.getByText("REVISOR")).toBeInTheDocument()
    expect(screen.getByText("Revisor")).toBeInTheDocument()
    expect(screen.getByText("Inativo")).toBeInTheDocument()
  })

  it("mostra estado vazio quando não há roles", async () => {
    const fetchMock = createFetchMock(() => ({ json: [] }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<RolesPage />)

    expect(await screen.findByText("Nenhuma role cadastrada")).toBeInTheDocument()
  })

  it("valida nome e label obrigatórios", async () => {
    const fetchMock = setup()
    renderPage(<RolesPage />)
    await screen.findByText("SUPERVISOR")

    fireEvent.click(screen.getByRole("button", { name: "Nova Role" }))
    fireEvent.click(screen.getByRole("button", { name: "Criar" }))

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Nome e label são obrigatórios"))
    expect(findCall(fetchMock.calls, "/api/admin/roles", "POST")).toBeUndefined()
  })

  it("cria role via POST inline", async () => {
    const fetchMock = setup()
    renderPage(<RolesPage />)
    await screen.findByText("SUPERVISOR")

    fireEvent.click(screen.getByRole("button", { name: "Nova Role" }))
    fireEvent.change(screen.getByPlaceholderText("EX: SUPERVISOR"), { target: { value: "FINANCEIRO" } })
    fireEvent.change(screen.getByPlaceholderText("Ex: Supervisor"), { target: { value: "Financeiro" } })
    fireEvent.change(screen.getByPlaceholderText("O que este perfil pode fazer?"), { target: { value: "Acesso financeiro" } })
    fireEvent.click(screen.getByRole("button", { name: "Criar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/admin/roles", "POST")
      expect(call).toBeDefined()
      expect(call?.body?.name).toBe("FINANCEIRO")
      expect(call?.body?.label).toBe("Financeiro")
      expect(call?.body?.description).toBe("Acesso financeiro")
      expect(call?.body?.ativo).toBe(true)
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Role criada!"))
  })

  it("edita role via PUT inline", async () => {
    const fetchMock = setup()
    renderPage(<RolesPage />)
    await screen.findByText("SUPERVISOR")

    const row = screen.getByText("SUPERVISOR").closest("tr")!
    fireEvent.click(within(row).getByRole("button", { name: "Editar" }))

    expect(screen.getByRole("heading", { name: "Editar Role" })).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText("Ex: Supervisor"), { target: { value: "Supervisor Regional" } })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/admin/roles/1", "PUT")
      expect(call).toBeDefined()
      expect(call?.body?.name).toBe("SUPERVISOR")
      expect(call?.body?.label).toBe("Supervisor Regional")
      expect(call?.body?.ativo).toBe(true)
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Role atualizada!"))
  })
})
