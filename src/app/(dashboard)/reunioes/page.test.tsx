// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import ReunioesPage from "./page"
import { createFetchMock, findCall, navMock, renderPage, toastMock } from "@/test/harness"

vi.mock("next-auth/react", () => ({
  useSession: () => sessionMock,
}))

let sessionMock: { data: { user: { role: string } } | null; status: string } = {
  data: { user: { role: "ADMIN" } },
  status: "authenticated",
}

const lista = [
  {
    id: 1,
    titulo: "Rodada de release",
    projeto: "SYSTEXTIL",
    data: "2026-09-11T15:00:00.000Z",
    local: "Meet",
    status: "REALIZADA",
    videoUrl: null,
    createdAt: null,
    updatedAt: null,
    _count: { pautas: 2, participantes: 3, encaminhamentos: 1, links: 0 },
  },
  {
    id: 2,
    titulo: "Reunião interna de planejamento",
    projeto: "INTERNA",
    data: "2026-09-14T10:30:00.000Z",
    local: null,
    status: "AGENDADA",
    videoUrl: null,
    createdAt: null,
    updatedAt: null,
    _count: { pautas: 0, participantes: 0, encaminhamentos: 0, links: 2 },
  },
]

const detalhe = {
  id: 1,
  titulo: "Rodada de release",
  projeto: "SYSTEXTIL",
  data: "2026-09-11T15:00:00.000Z",
  local: "Meet",
  status: "REALIZADA",
  videoUrl: null,
  createdAt: null,
  updatedAt: null,
  resumoCurto: "Release 5.3 liberada",
  resumoDetalhado: null,
  resumoItensAcao: null,
  transcricao: null,
  ata: { conteudo: "Ata completa da release.", criadoPor: null },
  pautas: [{ id: 1, descricao: "Itens da release", ordem: 1 }],
  participantes: [{ id: 1, nome: "Jean", empresa: "PDM", papel: "Dev" }],
  encaminhamentos: [
    { id: 1, descricao: "Documentar release", responsavel: "Maria", prazo: "2026-09-30T12:00:00.000Z", status: "PENDENTE" },
  ],
  links: [{ id: 1, rotulo: "Docs", url: "https://docs.example.com", descricao: null, ordem: 1 }],
}

function fetchSucesso() {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (url === "/api/reunioes" && method === "GET") return { json: { reunioes: lista } }
    if (url === "/api/reunioes/1" && method === "GET") return { json: { reuniao: detalhe } }
    if (url === "/api/reunioes" && method === "POST") return { status: 201, json: { reuniao: detalhe } }
    if (url === "/api/reunioes/1" && method === "PUT") return { json: { reuniao: detalhe } }
    if (url === "/api/reunioes/1" && method === "DELETE") return { json: { ok: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

async function renderizar() {
  const fetchMock = fetchSucesso()
  renderPage(<ReunioesPage />)
  await screen.findByText("Rodada de release")
  return fetchMock
}

beforeEach(() => {
  navMock.setPathname("/reunioes")
  sessionMock = { data: { user: { role: "ADMIN" } }, status: "authenticated" }
})

describe("ReunioesPage", () => {
  it("renderiza a lista com badges de projeto, status e contagens", async () => {
    await renderizar()

    expect(screen.getByRole("heading", { name: "Reuniões" })).toBeInTheDocument()
    expect(screen.getByText("Rodada de release")).toBeInTheDocument()
    expect(screen.getByText("Reunião interna de planejamento")).toBeInTheDocument()

    expect(screen.getAllByText("Systêxtil").length).toBeGreaterThan(0)
    expect(screen.getByText("Realizada", { selector: "span" })).toBeInTheDocument()
    expect(screen.getByText("Agendada", { selector: "span" })).toBeInTheDocument()

    expect(screen.getByText("2 pautas")).toBeInTheDocument()
    expect(screen.getByText("3 participantes")).toBeInTheDocument()
    expect(screen.getByText("1 encaminhamento")).toBeInTheDocument()
    expect(screen.getByText("2 links")).toBeInTheDocument()
  })

  it("mostra estado vazio quando não há reuniões", async () => {
    const fetchMock = createFetchMock(() => ({ json: { reunioes: [] } }))
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<ReunioesPage />)

    expect(await screen.findByText("Nenhuma reunião encontrada.")).toBeInTheDocument()
  })

  it("filtra a lista pelo texto digitado", async () => {
    await renderizar()

    fireEvent.change(screen.getByLabelText("Buscar reunião"), { target: { value: "planejamento" } })

    expect(screen.getByText("Reunião interna de planejamento")).toBeInTheDocument()
    expect(screen.queryByText("Rodada de release")).not.toBeInTheDocument()
  })

  it("cria reunião via modal (POST)", async () => {
    const fetchMock = await renderizar()

    fireEvent.click(screen.getByText("Nova reunião"))
    expect(await screen.findByRole("heading", { name: "Nova reunião" })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Título *"), { target: { value: "Rodada de release" } })
    fireEvent.change(screen.getByLabelText("Data/hora *"), { target: { value: "2026-09-11T15:00" } })

    fireEvent.submit(document.querySelector("form")!)

    await waitFor(() => {
      const chamada = findCall(fetchMock.calls, "/api/reunioes", "POST")
      expect(chamada).toBeDefined()
      expect(chamada?.body?.titulo).toBe("Rodada de release")
      expect(chamada?.body?.projeto).toBe("SYSTEXTIL")
      expect(chamada?.body?.status).toBe("AGENDADA")
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Reunião criada com sucesso."))
  })

  it("edita reunião via modal (PUT)", async () => {
    const fetchMock = await renderizar()

    fireEvent.click(screen.getAllByRole("button", { name: "Editar" })[0])
    expect(await screen.findByRole("heading", { name: "Editar reunião" })).toBeInTheDocument()
    expect(await screen.findByDisplayValue("Rodada de release")).toBeInTheDocument()

    fireEvent.submit(document.querySelector("form")!)

    await waitFor(() => {
      const chamada = findCall(fetchMock.calls, "/api/reunioes/1", "PUT")
      expect(chamada).toBeDefined()
      expect(chamada?.body?.titulo).toBe("Rodada de release")
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Reunião atualizada com sucesso."))
  })

  it("exclui reunião após confirmação (DELETE)", async () => {
    const fetchMock = await renderizar()

    fireEvent.click(screen.getAllByRole("button", { name: "Excluir" })[0])
    expect(screen.getByText('Deseja excluir a reunião "Rodada de release"?')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole("button", { name: "Excluir" }).at(-1)!)

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/reunioes/1", "DELETE")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Reunião excluída."))
  })

  it("visualiza o detalhe da reunião", async () => {
    await renderizar()

    fireEvent.click(screen.getAllByRole("button", { name: "Ver" })[0])

    expect(await screen.findByText("Ata completa da release.")).toBeInTheDocument()
    expect(screen.getByText("Jean")).toBeInTheDocument()
    expect(screen.getByText("Documentar release")).toBeInTheDocument()
    expect(screen.getByText(/docs\.example\.com/)).toBeInTheDocument()
    expect(screen.getByText("Pendente")).toBeInTheDocument()
  })

  it("esconde ações de escrita e exclusão para quem não tem permissão", async () => {
    sessionMock = { data: { user: { role: "QUALIDADE" } }, status: "authenticated" }
    await renderizar()

    expect(screen.queryByText("Nova reunião")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Ver" }).length).toBe(2)
  })
})