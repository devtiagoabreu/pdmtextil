// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react"
import BpmnEditor from "./bpmn-editor"

const { ModelerFake, ElementoBpmn, modeling, selecionar } = vi.hoisted(() => {
  class ModelerFake {
    container: HTMLElement
    selecao: unknown[] = []
    selectionHandlers: Array<() => void> = []
    static instancia: ModelerFake | null = null

    constructor(opts: { container: HTMLElement }) {
      this.container = opts.container
      ModelerFake.instancia = this
    }

    on() {}

    get(servico: string) {
      if (servico === "canvas") return { getContainer: () => this.container, zoom: () => {} }
      if (servico === "selection") {
        return {
          get: () => this.selecao,
          on: (_e: string, cb: () => void) => {
            this.selectionHandlers.push(cb)
          },
        }
      }
      if (servico === "elementRegistry") return { getAll: () => [] }
      if (servico === "modeling") return modeling
      return {}
    }

    async importXML() {}

    async saveXML() {
      return { xml: "<bpmn:definitions/>" }
    }

    destroy() {}
  }

  const modeling = { setColor: vi.fn() }
  const ElementoBpmn = {
    id: "Task_1",
    businessObject: { di: {} },
    label: null,
  }

  function selecionar(el: unknown) {
    const m = ModelerFake.instancia
    if (!m) return
    m.selecao = el ? [el] : []
    m.selectionHandlers.forEach((cb) => cb())
  }

  return { ModelerFake, ElementoBpmn, modeling, selecionar }
})

vi.mock("bpmn-js/lib/Modeler", () => ({
  default: ModelerFake,
}))

const XML = "<bpmn:definitions xmlns:bpmn='http://www.omg.org/spec/BPMN/20100524/MODEL' />"

describe("BpmnEditor", () => {
  beforeEach(() => {
    ModelerFake.instancia = null
    modeling.setColor.mockClear()
  })

  it("renderiza o canvas e o rodapé do editor", async () => {
    const { container } = render(<BpmnEditor xml={XML} onChange={() => {}} />)
    expect(screen.getByText("BPMN 2.0 (bpmn-js)")).toBeInTheDocument()
    await waitFor(() => expect(ModelerFake.instancia).not.toBeNull())
    expect(container.querySelector(".pdm-bpmn")).toBeTruthy()
    expect(container.querySelector(".pdm-bpmn [data-escuro]")?.getAttribute("data-escuro")).toBe("false")
  })

  it("alterna o fundo do canvas entre claro e escuro", async () => {
    const { container } = render(<BpmnEditor xml={XML} onChange={() => {}} />)
    const canvas = () => container.querySelector(".pdm-bpmn [data-escuro]") as HTMLElement
    await waitFor(() => expect(ModelerFake.instancia).not.toBeNull())

    fireEvent.click(screen.getByRole("button", { name: "Fundo escuro" }))
    expect(canvas().getAttribute("data-escuro")).toBe("true")
    expect(canvas().className).toContain("bg-slate-900")

    fireEvent.click(screen.getByRole("button", { name: "Fundo claro" }))
    expect(canvas().getAttribute("data-escuro")).toBe("false")
    expect(canvas().className).toContain("bg-white")
  })

  it("abre o painel de estilos manualmente via botão", () => {
    render(<BpmnEditor xml={XML} onChange={() => {}} />)
    fireEvent.click(screen.getByRole("button", { name: "Painel de estilos" }))
    expect(screen.getByText("Selecione uma forma ou conexão para editar seus estilos.")).toBeInTheDocument()
  })

  it("abre o painel automaticamente ao selecionar um elemento", async () => {
    render(<BpmnEditor xml={XML} onChange={() => {}} />)
    await waitFor(() => expect(ModelerFake.instancia).not.toBeNull())
    act(() => selecionar(ElementoBpmn))
    expect(await screen.findByText("Preenchimento")).toBeInTheDocument()
    expect(screen.getByText("Task_1")).toBeInTheDocument()
  })

  it("aplica cor de preenchimento e borda via modeling", async () => {
    render(<BpmnEditor xml={XML} onChange={() => {}} />)
    await waitFor(() => expect(ModelerFake.instancia).not.toBeNull())
    act(() => selecionar(ElementoBpmn))
    await screen.findByText("Preenchimento")

    fireEvent.change(screen.getByLabelText("Cor de preenchimento"), { target: { value: "#00ff00" } })
    expect(modeling.setColor).toHaveBeenCalledWith(ElementoBpmn, {
      fill: "#00ff00",
      stroke: undefined,
    })
  })

  it("aplica cor de texto sem lançar erro e persiste os estilos", async () => {
    const onChange = vi.fn()
    render(<BpmnEditor xml={XML} onChange={onChange} />)
    await waitFor(() => expect(ModelerFake.instancia).not.toBeNull())
    act(() => selecionar(ElementoBpmn))
    await screen.findByText("Preenchimento")

    fireEvent.change(screen.getByLabelText("Cor do texto"), { target: { value: "#ff0000" } })

    const di = (ElementoBpmn.businessObject.di as { $attrs?: Record<string, unknown> }).$attrs
    expect(di?.["pdm:textFill"]).toBe("#ff0000")
    await waitFor(() => expect(onChange).toHaveBeenCalled())
  })
})