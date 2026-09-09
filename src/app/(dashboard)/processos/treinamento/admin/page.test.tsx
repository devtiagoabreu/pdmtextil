// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import AdminTreinamentoPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

const modulos = [
  {
    id: 1,
    titulo: "Visão Geral",
    descricao: "Primeiros passos na Engenharia de Processos",
    icone: "BookOpen",
    cor: "#0ea5e9",
    ordem: 1,
    ativo: true,
    createdAt: "2026-01-01",
    licoes: [
      { id: 10, moduloId: 1, titulo: "O que é um processo", ordem: 1, ativo: true, pathnameRelacionado: "/processos" },
    ],
  },
  {
    id: 2,
    titulo: "Módulo Vazio",
    descricao: null,
    icone: null,
    cor: null,
    ordem: 2,
    ativo: true,
    createdAt: "2026-01-02",
    licoes: [],
  },
]

function buildHandler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/processos/treinamento") return { json: modulos }
    if (method === "POST" && url === "/api/processos/treinamento/modulos") return { status: 201, json: { id: 3 } }
    if (method === "DELETE" && url === "/api/processos/treinamento/10") return { json: { ok: true } }
    if (method === "DELETE" && url === "/api/processos/treinamento/modulos/1") return { json: { ok: true } }
    return { json: null }
  }
}

describe("AdminTreinamentoPage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    navMock.setPathname("/processos/treinamento/admin")
    fetchMock = createFetchMock(buildHandler())
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("renderiza módulos e lições com heading", async () => {
    renderPage(<AdminTreinamentoPage />)

    expect(screen.getByRole("heading", { name: "Gerenciar Treinamento" })).toBeInTheDocument()
    expect(await screen.findByText("Visão Geral")).toBeInTheDocument()
    expect(screen.getByText("O que é um processo")).toBeInTheDocument()
    expect(screen.getByText("Módulo Vazio")).toBeInTheDocument()
    expect(screen.getByText("Nenhuma lição neste módulo")).toBeInTheDocument()
  })

  it("cria um módulo via POST", async () => {
    renderPage(<AdminTreinamentoPage />)
    await screen.findByText("Visão Geral")

    fireEvent.click(screen.getByRole("button", { name: "Novo Módulo" }))
    fireEvent.change(screen.getByPlaceholderText("Título do módulo"), { target: { value: "Módulo Teste" } })
    fireEvent.change(screen.getByPlaceholderText("Descrição (opcional)"), { target: { value: "Descrição teste" } })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/processos/treinamento/modulos", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ titulo: "Módulo Teste", descricao: "Descrição teste", icone: "GraduationCap", cor: "#0ea5e9" })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Módulo criado"))
  })

  it("remove uma lição via DELETE", async () => {
    renderPage(<AdminTreinamentoPage />)
    await screen.findByText("O que é um processo")

    fireEvent.click(screen.getAllByTitle("Remover")[0])

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/processos/treinamento/10", "DELETE")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Lição removida"))
  })

  it("remove um módulo via DELETE", async () => {
    renderPage(<AdminTreinamentoPage />)
    await screen.findByText("Visão Geral")

    fireEvent.click(screen.getAllByTitle("Remover módulo")[0])

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/processos/treinamento/modulos/1", "DELETE")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Módulo removido"))
  })

  it("contém links para editar lição e criar lição no módulo", async () => {
    renderPage(<AdminTreinamentoPage />)
    await screen.findByText("O que é um processo")

    expect(screen.getByTitle("Editar")).toHaveAttribute("href", "/processos/treinamento/admin/10")
    const novas = screen.getAllByTitle("Nova lição neste módulo")
    expect(novas.some((l) => l.getAttribute("href") === "/processos/treinamento/admin/novo?moduloId=1")).toBe(true)
  })
})