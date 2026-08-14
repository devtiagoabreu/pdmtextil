// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import CrmContatosPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock } from "@/test/harness"
import { listSmokeSpec } from "@/test/list-smoke-spec"

const { sessionMock } = vi.hoisted(() => ({
  sessionMock: { data: { user: { role: "ADMIN" as string } } },
}))
vi.mock("next-auth/react", () => ({
  useSession: () => sessionMock,
}))

const data = [
  {
    id: 1,
    nome: "Carlos Silva",
    cargo: "Comprador",
    email: "carlos@alpha.com",
    celular: "(11) 90000-0000",
    empresaId: 1,
    empresaRazaoSocial: "Tecelagem Alpha",
    principal: true,
    createdAt: "2026-07-01T10:00:00Z",
  },
  {
    id: 2,
    nome: "Ana Souza",
    cargo: null,
    email: null,
    celular: null,
    empresaId: 2,
    empresaNomeFantasia: "Beta Confecções",
    principal: false,
    createdAt: "2026-07-02T10:00:00Z",
  },
]

listSmokeSpec({
  title: "ContatosPage",
  component: <CrmContatosPage />,
  apiUrl: "/api/crm/contatos",
  heading: "Contatos",
  emptyText: "Nenhum contato encontrado",
  searchPlaceholder: "Buscar contatos...",
  newLinkText: "Novo Contato",
  newHref: "/comercial/crm/contatos/novo",
  editHref: (item) => `/comercial/crm/contatos/${item.id}`,
  editLinkText: "Editar",
  primaryField: "nome",
  data,
  firstItemText: "Carlos Silva",
  secondItemText: "Ana Souza",
  matchQuery: "Silva",
})

describe("ContatosPage exclusão", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    sessionMock.data.user.role = "ADMIN"
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/contatos") return { json: [data[0]] }
      if (method === "DELETE" && url === "/api/crm/contatos/1") return { json: { success: true } }
      return { json: null }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("admin exclui contato pela tabela via modal", async () => {
    renderPage(<CrmContatosPage />)

    fireEvent.click(await screen.findByRole("button", { name: "Excluir contato" }))
    const dialog = screen.getByRole("dialog", { name: "Excluir contato?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/contatos/1", "DELETE")
      expect(call).toBeDefined()
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith('Contato "Carlos Silva" excluído'))
  })

  it("não mostra o botão de excluir para não-administradores", async () => {
    sessionMock.data.user.role = "VENDEDOR"
    renderPage(<CrmContatosPage />)

    await screen.findByText("Carlos Silva")
    expect(screen.queryByRole("button", { name: "Excluir contato" })).not.toBeInTheDocument()
  })
})
