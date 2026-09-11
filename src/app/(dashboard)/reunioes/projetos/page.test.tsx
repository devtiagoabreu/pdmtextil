// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import ProjetosPage from "./page"
import { createFetchMock, findCall, navMock, renderPage, toastMock } from "@/test/harness"

vi.mock("next-auth/react", () => ({
  useSession: () => sessionMock,
}))

let sessionMock: { data: { user: { role: string } } | null; status: string } = {
  data: { user: { role: "ADMIN" } },
  status: "authenticated",
}

const projetos = [
  {
    id: 2,
    nome: "Integração Systêxtil",
    descricao: "Projeto do ERP Systêxtil",
    dataInicio: "2026-09-01",
    dataFim: "2026-12-15",
    status: "EM_ANDAMENTO",
    cor: "#6366f1",
    ativo: true,
    createdAt: "2026-09-10T10:00:00.000Z",
    updatedAt: "2026-09-10T10:00:00.000Z",
  },
  {
    id: 1,
    nome: "Interna",
    descricao: null,
    dataInicio: null,
    dataFim: null,
    status: "EM_ANDAMENTO",
    cor: "#64748b",
    ativo: true,
    createdAt: "2026-09-10T10:00:00.000Z",
    updatedAt: "2026-09-10T10:00:00.000Z",
  },
]

const projetoCriado = {
  id: 3,
  nome: "Projeto Novo",
  descricao: null,
  dataInicio: null,
  dataFim: null,
  status: "PLANEJADO",
  cor: null,
  ativo: true,
}

function fetchSucesso() {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (url === "/api/reunioes/projetos" && method === "GET") return { json: { projetos } }
    if (url === "/api/reunioes/projetos" && method === "POST") return { status: 201, json: { projeto: projetoCriado } }
    if (url === "/api/reunioes/projetos/2" && method === "PUT")
      return { json: { projeto: { ...projetos[0], status: "ENCERRADO" } } }
    if (url === "/api/reunioes/projetos/2" && method === "DELETE") return { json: { ok: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

async function renderizar() {
  const fetchMock = fetchSucesso()
  renderPage(<ProjetosPage />)
  await screen.findByText("Integração Systêxtil")
  return fetchMock
}

beforeEach(() => {
  navMock.setPathname("/reunioes/projetos")
  sessionMock = { data: { user: { role: "ADMIN" } }, status: "authenticated" }
})

describe("ProjetosPage", () => {
  it("renderiza a lista com badge de status e datas", async () => {
    await renderizar()

    expect(screen.getByRole("heading", { name: "Projetos de Reuniões" })).toBeInTheDocument()
    expect(screen.getByText("Integração Systêxtil")).toBeInTheDocument()
    expect(screen.getByText("Interna")).toBeInTheDocument()
    expect(screen.getAllByText("Em andamento").length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Início: .*Fim:/)).toHaveLength(2)
    expect(screen.getByText("Projeto do ERP Systêxtil")).toBeInTheDocument()
    expect(screen.getByText("Voltar para Reuniões")).toBeInTheDocument()
  })

  it("mostra estado vazio quando não há projetos", async () => {
    const fetchMock = createFetchMock(() => ({ json: { projetos: [] } }))
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<ProjetosPage />)

    expect(await screen.findByText("Nenhum projeto encontrado.")).toBeInTheDocument()
  })

  it("filtra a lista pelo texto digitado", async () => {
    await renderizar()

    fireEvent.change(screen.getByLabelText("Buscar projeto"), { target: { value: "Interna" } })

    expect(screen.getByText("Interna")).toBeInTheDocument()
    expect(screen.queryByText("Integração Systêxtil")).not.toBeInTheDocument()
  })

  it("cria projeto via modal (POST)", async () => {
    const fetchMock = await renderizar()

    fireEvent.click(screen.getByText("Novo projeto"))
    expect(await screen.findByRole("heading", { name: "Novo projeto" })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Nome *"), { target: { value: "Projeto Novo" } })

    fireEvent.submit(document.querySelector("form")!)

    await waitFor(() => {
      const chamada = findCall(fetchMock.calls, "/api/reunioes/projetos", "POST")
      expect(chamada).toBeDefined()
      expect(chamada?.body?.nome).toBe("Projeto Novo")
      expect(chamada?.body?.status).toBe("EM_ANDAMENTO")
      expect(chamada?.body?.ativo).toBe(true)
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Projeto criado com sucesso."))
  })

  it("edita projeto via modal (PUT)", async () => {
    const fetchMock = await renderizar()

    fireEvent.click(screen.getAllByRole("button", { name: "Editar" })[0])
    expect(await screen.findByRole("heading", { name: "Editar projeto" })).toBeInTheDocument()
    expect(await screen.findByDisplayValue("Integração Systêxtil")).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "ENCERRADO" } })
    fireEvent.submit(document.querySelector("form")!)

    await waitFor(() => {
      const chamada = findCall(fetchMock.calls, "/api/reunioes/projetos/2", "PUT")
      expect(chamada).toBeDefined()
      expect(chamada?.body?.nome).toBe("Integração Systêxtil")
      expect(chamada?.body?.status).toBe("ENCERRADO")
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Projeto atualizado com sucesso."))
  })

  it("não mostra botão de excluir para o projeto padrão", async () => {
    await renderizar()

    expect(screen.getAllByRole("button", { name: "Editar" }).length).toBe(2)
    expect(screen.getAllByRole("button", { name: "Excluir" }).length).toBe(1)
  })

  it("exclui projeto após confirmação (DELETE)", async () => {
    const fetchMock = await renderizar()

    fireEvent.click(screen.getAllByRole("button", { name: "Excluir" })[0])
    expect(screen.getByText('Deseja excluir o projeto "Integração Systêxtil"?')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole("button", { name: "Excluir" }).at(-1)!)

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/reunioes/projetos/2", "DELETE")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Projeto excluído."))
  })

  it("esconde ações de escrita e exclusão para quem não tem permissão", async () => {
    sessionMock = { data: { user: { role: "QUALIDADE" } }, status: "authenticated" }
    await renderizar()

    expect(screen.queryByText("Novo projeto")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument()
    expect(screen.getByText("Integração Systêxtil")).toBeInTheDocument()
  })
})