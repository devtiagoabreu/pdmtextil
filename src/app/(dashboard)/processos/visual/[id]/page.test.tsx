// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"
import ProcessoDiagramaPage from "./page"

vi.mock("@/components/processos/bpmn-editor", () => ({
  default: () => <div data-testid="bpmn-mock">Editor BPMN</div>,
}))

vi.mock("@/components/processos/canvas-excalidraw", () => ({
  default: () => <div data-testid="canvas-mock">Canvas Excalidraw</div>,
}))

const diagramaBase = {
  id: 5,
  nome: "Fluxograma de recebimento",
  tipo: "FLUXOGRAMA",
  descricao: "Recebimento de matéria-prima",
  modelo: {
    schemaVersion: "1",
    nome: "Recebimento",
    objetivo: "Receber matéria-prima",
    atividades: [{ id: "A1", nome: "Receber matéria-prima" }],
    decisoes: [{ id: "D1", pergunta: "NF conferida?" }],
    fluxos: [
      { id: "F1", de: "inicio", para: "A1", rotulo: "" },
      { id: "F2", de: "A1", para: "fim", rotulo: "" },
    ],
  },
  mermaid: null,
  markdown: null,
  bpmnXml: null,
  canvas: null,
  ativo: true,
}

const fluxoImportado = [
  "flowchart TD",
  "  inicio((Início))",
  "  A1[\"Conferir NF\"]",
  "  fim([Fim])",
  "  inicio --> A1",
  "  A1 --> fim",
].join("\n")

function montarFetch(salvo?: (obj: unknown) => void) {
  const handler = ({ method, url, body }: { method: string; url: string; body?: unknown }) => {
    if (method === "GET" && url === "/api/processos/diagramas/5") return { json: diagramaBase }
    if (method === "POST" && url === "/api/processos/diagramas") {
      return { status: 201, json: { id: 99, ...(body as object) } }
    }
    if (method === "PUT" && url === "/api/processos/diagramas/5") {
      salvo?.(body)
      return { json: { ...diagramaBase, ...(body as object) } }
    }
    return { status: 404, json: { error: "Rota não mockada" } }
  }
  const mock = createFetchMock(handler)
  vi.stubGlobal("fetch", mock.fn)
  return mock
}

describe("ProcessoDiagramaPage", () => {
  beforeEach(() => {
    navMock.reset()
    navMock.setPathname("/processos/visual/5")
    navMock.setParams({ id: "5" })
  })

  it("cria um novo diagrama a partir de /novo e navega para o editor", async () => {
    navMock.setPathname("/processos/visual/novo")
    navMock.setParams({ id: "novo" })
    const mock = montarFetch()

    renderPage(<ProcessoDiagramaPage />)
    expect(await screen.findByRole("heading", { name: "Novo Diagrama" })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: "Fluxograma de expedição" } })
    fireEvent.click(screen.getByRole("button", { name: "Criar" }))

    await waitFor(() =>
      expect(findCall(mock.calls, "/api/processos/diagramas", "POST")).toBeDefined(),
    )
    await waitFor(() => expect(navMock.router.push).toHaveBeenCalledWith("/processos/visual/99"))
  })

  it("valida nome obrigatório no cadastro novo", async () => {
    navMock.setPathname("/processos/visual/novo")
    navMock.setParams({ id: "novo" })
    montarFetch()

    renderPage(<ProcessoDiagramaPage />)
    await screen.findByRole("heading", { name: "Novo Diagrama" })
    fireEvent.submit(document.querySelector("form")!)
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Nome é obrigatório"))
    expect(navMock.router.push).not.toHaveBeenCalled()
  })

  it("carrega o editor com as abas e mostra o modelo semântico", async () => {
    const mock = montarFetch()
    renderPage(<ProcessoDiagramaPage />)

    expect(await screen.findByRole("heading", { name: "Editor de Diagrama" })).toBeInTheDocument()
    await screen.findByLabelText("Nome da atividade A1")

    for (const aba of ["Modelo semântico", "Texto Mermaid", "BPMN", "Canvas", "Exportar"]) {
      expect(screen.getByRole("button", { name: aba })).toBeInTheDocument()
    }
    expect(screen.getByDisplayValue("NF conferida?")).toBeInTheDocument()
    expect(mock.calls.length).toBeGreaterThan(0)
  })

  it("salva o modelo semântico via PUT", async () => {
    const bodies: unknown[] = []
    montarFetch((b) => bodies.push(b))
    renderPage(<ProcessoDiagramaPage />)

    await screen.findByLabelText("Nome da atividade A1")
    fireEvent.click(screen.getByRole("button", { name: /Salvar modelo/ }))

    await waitFor(() => expect(bodies.length).toBe(1))
    const corpo = bodies[0] as { nome: string; modelo: { atividades: unknown[] } }
    expect(corpo.nome).toBe("Fluxograma de recebimento")
    expect(corpo.modelo.atividades).toHaveLength(1)
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Diagrama salvo com sucesso"))
  })

  it("importa o texto Mermaid de volta para o modelo semântico", async () => {
    montarFetch()
    renderPage(<ProcessoDiagramaPage />)

    await screen.findByLabelText("Nome da atividade A1")
    fireEvent.click(screen.getByRole("button", { name: "Texto Mermaid" }))

    const textarea = screen.getByLabelText("Texto Mermaid") as HTMLTextAreaElement
    expect(textarea.value).toContain("flowchart TD")
    fireEvent.change(textarea, { target: { value: fluxoImportado } })
    fireEvent.click(screen.getByRole("button", { name: /Importar texto/ }))

    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Modelo importado do texto Mermaid"))
    fireEvent.click(screen.getByRole("button", { name: "Modelo semântico" }))
    const atividade = await screen.findByLabelText("Nome da atividade A1")
    expect((atividade as HTMLInputElement).value).toBe("Conferir NF")
  })

  it("renderiza os editores pesados nas abas BPMN e Canvas", async () => {
    montarFetch()
    renderPage(<ProcessoDiagramaPage />)

    await screen.findByLabelText("Nome da atividade A1")
    fireEvent.click(screen.getByRole("button", { name: "BPMN" }))
    expect(await screen.findByTestId("bpmn-mock")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Canvas" }))
    expect(await screen.findByTestId("canvas-mock")).toBeInTheDocument()
  })

  it("exporta mermaid, markdown e JSON do modelo", async () => {
    montarFetch()
    renderPage(<ProcessoDiagramaPage />)

    await screen.findByLabelText("Nome da atividade A1")
    fireEvent.click(screen.getByRole("button", { name: "Exportar" }))

    const mermaid = await screen.findByTestId("export-mermaid")
    expect(mermaid.textContent).toContain("flowchart TD")
    const markdown = screen.getByTestId("export-markdown")
    expect(markdown.textContent).toContain("Receber matéria-prima")
    const json = screen.getByTestId("export-json")
    expect(json.textContent).toContain('"atividades"')
  })
})