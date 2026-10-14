// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Page from "./page"
import { renderPage, createFetchMock, navMock, routeJson, findCall } from "@/test/harness"

vi.mock("@/lib/info-content", () => ({
  getInfoContent: vi.fn(() => ({ title: "Ativos", description: "" })),
}))

const ativo = {
  id: 1,
  codigo: "A-001",
  nome: "Máquina 01",
  categoriaId: 1,
  status: "ATIVO",
  localizacao: "Galpão A",
  fabricante: "Fab",
  modelo: "M1",
  numSerie: "S1",
  dataAquisicao: "2025-01-01",
  valorAquisicao: "10000.00",
  maquinaId: null,
  responsavelId: null,
  descricao: "",
  observacoes: "Obs",
  ativo: true,
}
const categorias = [{ id: 1, nome: "Máquinas" }]

function mockAtivos() {
  return createFetchMock(
    routeJson({
      "PUT /api/ativos/1": { success: true },
      "/api/ativos/1": ativo,
      "/api/ativos/categorias": categorias,
      "/api/usuarios/ativos": [{ id: 1, nome: "Usuário" }],
    })
  )
}

describe("AtivosEditPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navMock.reset()
    vi.stubGlobal("alert", vi.fn())
    vi.stubGlobal("confirm", vi.fn(() => true))
  })

  it("renderiza edição carregando dados", async () => {
    navMock.setParams({ id: "1" })
    navMock.setPathname("/ativos/ativos/1")
    const fetchMock = mockAtivos()
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<Page />)
    expect(await screen.findByRole("heading", { name: /Editar Ativo/ })).toBeInTheDocument()
    expect(screen.getByDisplayValue("A-001")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Máquina 01")).toBeInTheDocument()
  })

  it("salva alterações (PUT)", async () => {
    const user = userEvent.setup()
    navMock.setParams({ id: "1" })
    navMock.setPathname("/ativos/ativos/1")
    const fetchMock = mockAtivos()
    vi.stubGlobal("fetch", fetchMock.fn)
    const { container } = renderPage(<Page />)
    await screen.findByDisplayValue("A-001")
    const nome = screen.getByLabelText("Nome")
    await user.clear(nome)
    await user.type(nome, "Máquina 01 Edit")
    const form = container.querySelector("form")
    expect(form).toBeTruthy()
    if (form) fireEvent.submit(form)
    const put = await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/ativos/1", "PUT")
      expect(call).toBeTruthy()
      return call
    })
    expect(put?.body?.nome).toBe("Máquina 01 Edit")
  })
})
