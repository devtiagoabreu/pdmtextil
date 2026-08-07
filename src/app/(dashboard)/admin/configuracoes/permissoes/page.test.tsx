// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import PermissoesPage from "./page"
import { createFetchMock, findCall, renderPage, toastMock } from "@/test/harness"

const data = {
  modulos: ["CLIENTES"],
  permissoes: ["CREATE", "READ"],
  roles: [{ id: 1, name: "COMERCIAL", label: "Comercial", permissoes: { CLIENTES: ["READ"] } }],
}

function setup() {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/admin/permissoes") return { json: data }
    if (method === "PUT" && url === "/api/admin/permissoes") return { json: { ok: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("PermissoesPage", () => {
  it("renderiza heading e permissões por perfil", async () => {
    setup()
    renderPage(<PermissoesPage />)

    expect(await screen.findByRole("heading", { name: "Permissões por Perfil" })).toBeInTheDocument()
    expect(screen.getByText("Comercial")).toBeInTheDocument()
    expect(screen.getByText("CLIENTES")).toBeInTheDocument()
    expect(screen.getAllByText("CREATE").length).toBeGreaterThan(0)
  })

  it("alterna permissão e salva via PUT", async () => {
    const fetchMock = setup()
    renderPage(<PermissoesPage />)
    await screen.findByText("Comercial")

    fireEvent.click(screen.getAllByRole("checkbox")[1])
    fireEvent.click(screen.getByRole("button", { name: "Salvar Permissões" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/admin/permissoes", "PUT")
      expect(call).toBeDefined()
      expect(call?.body?.roleName).toBe("COMERCIAL")
      expect(call?.body?.permissoes?.CLIENTES).toEqual(expect.arrayContaining(["READ", "CREATE"]))
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Permissões salvas!"))
  })
})
