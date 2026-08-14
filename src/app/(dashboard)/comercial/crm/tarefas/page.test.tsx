// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import TarefasPage from "./page"
import { createFetchMock, renderPage, findCall, navMock } from "@/test/harness"

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { role: "ADMIN" } } }),
}))

const tarefasPendentes = [
  {
    id: 1,
    titulo: "Ligar para Tecidos Silva",
    descricao: "Confirmar pedido",
    tipo: "LIGACAO",
    status: "PENDENTE",
    dataPrevista: "2026-08-10",
    empresaNome: "Tecidos Silva",
  },
  {
    id: 2,
    titulo: "Revisar proposta",
    descricao: "",
    tipo: "PROPOSTA",
    status: "PENDENTE",
    dataPrevista: null,
    empresaNome: null,
  },
]

const tarefasConcluidas = [
  {
    id: 3,
    titulo: "Enviar contrato",
    descricao: "Contrato assinado",
    tipo: "TAREFA",
    status: "CONCLUIDO",
    dataPrevista: null,
    empresaNome: null,
  },
]

function buildHandler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/crm/tarefas?status=PENDENTE") return { json: tarefasPendentes }
    if (method === "GET" && url === "/api/crm/tarefas?status=CONCLUIDO") return { json: tarefasConcluidas }
    if (method === "GET" && url === "/api/crm/tarefas?") return { json: [...tarefasPendentes, ...tarefasConcluidas] }
    if (method === "GET" && url === "/api/crm/tarefas?hoje=true") return { json: tarefasPendentes }
    if (method === "GET" && url === "/api/crm/tarefas?mine=true") return { json: [...tarefasPendentes, ...tarefasConcluidas] }
    if (method === "GET" && url === "/api/crm/tarefas?status=PENDENTE&mine=true") return { json: tarefasPendentes }
    if (method === "GET" && url === "/api/crm/tarefas?status=CONCLUIDO&mine=true") return { json: tarefasConcluidas }
    if (method === "GET" && url === "/api/crm/tarefas?hoje=true&mine=true") return { json: tarefasPendentes }
    if (method === "GET" && url === "/api/crm/pessoas") return { json: [{ id: 1, razaoSocial: "Tecidos Silva" }] }
    if (method === "PUT" && url === "/api/crm/tarefas/1") return { json: {} }
    if (method === "PUT" && url === "/api/crm/tarefas/3") return { json: {} }
    if (method === "POST" && url === "/api/crm/tarefas") return { json: { id: 4 }, status: 201 }
    return { json: null }
  }
}

function render() {
  navMock.setPathname("/comercial/crm/tarefas")
  const mock = createFetchMock(buildHandler())
  vi.stubGlobal("fetch", mock.fn)
  renderPage(<TarefasPage />)
  return mock
}

describe("TarefasPage", () => {
  it("renderiza a lista de tarefas pendentes", async () => {
    const mock = render()

    expect(await screen.findByRole("heading", { name: "Tarefas" })).toBeInTheDocument()
    await screen.findByText("Ligar para Tecidos Silva")
    expect(screen.getByText("Confirmar pedido")).toBeInTheDocument()
    expect(screen.getByText("Ligação")).toBeInTheDocument()
    expect(screen.getByText("Revisar proposta")).toBeInTheDocument()
    expect(screen.getByText("Tecidos Silva")).toBeInTheDocument()
    expect(screen.getByText("2 tarefa(s)")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Nova Tarefa" })).toBeInTheDocument()
    expect(findCall(mock.calls, "/api/crm/tarefas?status=PENDENTE&mine=true")).toBeDefined()
  })

  it("troca o filtro e refaz a busca", async () => {
    const mock = render()
    await screen.findByText("Ligar para Tecidos Silva")

    fireEvent.click(screen.getByRole("button", { name: "Hoje" }))
    await waitFor(() => expect(findCall(mock.calls, "/api/crm/tarefas?hoje=true&mine=true")).toBeDefined())

    fireEvent.click(screen.getAllByRole("button", { name: "Todas" })[1])
    await waitFor(() => expect(findCall(mock.calls, "/api/crm/tarefas?mine=true")).toBeDefined())

    fireEvent.click(screen.getByRole("button", { name: "Concluídas" }))
    await waitFor(() => expect(findCall(mock.calls, "/api/crm/tarefas?status=CONCLUIDO&mine=true")).toBeDefined())
    expect(await screen.findByText("Enviar contrato")).toBeInTheDocument()
  })

  it("filtra apenas as minhas tarefas", async () => {
    const mock = render()
    await screen.findByText("Ligar para Tecidos Silva")

    expect(findCall(mock.calls, "/api/crm/tarefas?status=PENDENTE&mine=true")).toBeDefined()

    fireEvent.click(screen.getAllByRole("button", { name: "Todas" })[0])
    await waitFor(() => expect(findCall(mock.calls, "/api/crm/tarefas?status=PENDENTE")).toBeDefined())

    fireEvent.click(screen.getByRole("button", { name: "Minhas" }))
    await waitFor(() =>
      expect(findCall(mock.calls, "/api/crm/tarefas?status=PENDENTE&mine=true")).toBeDefined()
    )
  })

  it("conclui uma tarefa via PUT", async () => {
    const mock = render()
    await screen.findByText("Ligar para Tecidos Silva")

    fireEvent.click(screen.getAllByTitle("Concluir")[0])

    await waitFor(() => {
      const call = findCall(mock.calls, "/api/crm/tarefas/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ status: "CONCLUIDO" })
    })
  })

  it("reabre uma tarefa concluída via PUT", async () => {
    const mock = render()
    await screen.findByText("Ligar para Tecidos Silva")

    fireEvent.click(screen.getByRole("button", { name: "Concluídas" }))
    await screen.findByText("Enviar contrato")

    fireEvent.click(screen.getByTitle("Reabrir"))

    await waitFor(() => {
      const call = findCall(mock.calls, "/api/crm/tarefas/3", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ status: "PENDENTE", dataConclusao: null })
    })
  })

  it("mostra estado vazio quando não há tarefas", async () => {
    navMock.setPathname("/comercial/crm/tarefas")
    const mock = createFetchMock(() => ({ json: [] }))
    vi.stubGlobal("fetch", mock.fn)
    renderPage(<TarefasPage />)

    expect(await screen.findByText("Nenhuma tarefa encontrada")).toBeInTheDocument()
    expect(screen.getByText("0 tarefa(s)")).toBeInTheDocument()
  })

  it("cria uma nova tarefa via diálogo", async () => {
    const mock = render()
    await screen.findByText("Ligar para Tecidos Silva")

    fireEvent.click(screen.getByRole("button", { name: "Nova Tarefa" }))
    expect(await screen.findByRole("heading", { name: "Nova Tarefa" })).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText("Ex: Ligar para o cliente"), {
      target: { value: "Visitar cliente" },
    })
    await screen.findByRole("option", { name: "Tecidos Silva" })
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "REUNIAO" } })
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "1" } })

    fireEvent.click(screen.getByRole("button", { name: "Criar Tarefa" }))

    await waitFor(() => {
      const call = findCall(mock.calls, "/api/crm/tarefas", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({
        titulo: "Visitar cliente",
        descricao: "",
        tipo: "REUNIAO",
        dataPrevista: null,
        empresaId: 1,
      })
    })
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Nova Tarefa" })).not.toBeInTheDocument()
    )
  })
})
