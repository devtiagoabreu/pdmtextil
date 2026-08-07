// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import PaisesPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock } from "@/test/harness"
import { listSmokeSpec } from "@/test/list-smoke-spec"

const paises = [
  { id: 1, nome: "Brasil", codigo: "55", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: 2, nome: "Argentina", codigo: "54", createdAt: "2026-01-02T00:00:00.000Z" },
]

function buildHandler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/crm/paises") return { json: paises }
    if (method === "POST" && url === "/api/crm/paises") return { json: { id: 3 }, status: 201 }
    return { status: 404, json: { error: "Rota não mockada" } }
  }
}

listSmokeSpec({
  title: "PaisesConfigPage",
  component: <PaisesPage />,
  apiUrl: "/api/crm/paises",
  heading: "Países",
  emptyText: "Nenhum país cadastrado",
  searchPlaceholder: "Buscar país...",
  primaryField: "nome",
  data: paises,
  firstItemText: "Brasil",
  secondItemText: "Argentina",
  handler: buildHandler(),
})

describe("PaisesConfigPage busca e criação", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    fetchMock = createFetchMock(buildHandler())
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("filtra países pela busca", async () => {
    renderPage(<PaisesPage />)
    await screen.findByText("Brasil")

    fireEvent.change(screen.getByPlaceholderText("Buscar país..."), { target: { value: "Argent" } })

    expect(screen.getByText("Argentina")).toBeInTheDocument()
    expect(screen.queryByText("Brasil")).not.toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText("Buscar país..."), { target: { value: "zzz" } })

    expect(screen.getByText("Nenhum país encontrado")).toBeInTheDocument()
  })

  it("cria um país via POST", async () => {
    renderPage(<PaisesPage />)
    await screen.findByText("Brasil")

    fireEvent.click(screen.getByRole("button", { name: "Novo País" }))
    fireEvent.change(screen.getByPlaceholderText("Ex: Brasil"), { target: { value: "Uruguai" } })
    fireEvent.change(screen.getByPlaceholderText("Ex: 55"), { target: { value: "598" } })
    fireEvent.click(screen.getByRole("button", { name: "Criar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/paises", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ nome: "Uruguai", codigo: "598" })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("País cadastrado"))
  })
})
