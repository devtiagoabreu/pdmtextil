// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import AtivoCategoriaFormPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

const AREAS_MOCK = [
  {
    id: 26,
    siteId: 6,
    siteNome: "Ativos e Vistorias",
    nome: "Segurança",
    descricao: null,
    ativo: true,
    createdAt: "",
    updatedAt: "",
  },
]

const EDIT_DATA = {
  id: 1,
  nome: "Segurança Contra Incêndio",
  areaId: 26,
  areaNome: "Segurança",
  descricao: "Extintores, mangueiras e sistemas de combate a incêndio",
  cor: "#dc2626",
  icone: null,
  ativo: true,
}

function mountNewPage() {
  navMock.setPathname("/ativos/categorias/novo")
  navMock.setParams({ id: "novo" })
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/processos/areas") return { json: AREAS_MOCK }
    if (method === "POST" && url === "/api/ativos/categorias")
      return { status: 201, json: { id: 99 } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

function mountEditPage() {
  navMock.setPathname("/ativos/categorias/1")
  navMock.setParams({ id: "1" })
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/processos/areas") return { json: AREAS_MOCK }
    if (method === "GET" && url === "/api/ativos/categorias/1") return { json: EDIT_DATA }
    if (method === "PUT" && url === "/api/ativos/categorias/1") return { json: { ok: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("AtivoCategoriaFormPage", () => {
  beforeEach(() => {
    navMock.reset()
    toastMock.success.mockClear()
    toastMock.error.mockClear()
  })

  describe("novo", () => {
    it("renderiza o formulário de criação", () => {
      mountNewPage()
      renderPage(<AtivoCategoriaFormPage />)

      expect(screen.getByRole("heading", { name: "Nova Categoria" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Criar" })).toBeInTheDocument()
    })

    it("valida o campo nome antes de salvar", async () => {
      const fetchMock = mountNewPage()
      const { container } = renderPage(<AtivoCategoriaFormPage />)

      fireEvent.submit(container.querySelector("form")!)

      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Nome é obrigatório"))
      expect(findCall(fetchMock.calls, "/api/ativos/categorias", "POST")).toBeUndefined()
    })

    it("cria via POST e redireciona", async () => {
      const fetchMock = mountNewPage()
      renderPage(<AtivoCategoriaFormPage />)

      const select = screen.getByLabelText("Área")
      await waitFor(() => expect(select).toHaveValue("26"))

      fireEvent.change(screen.getByPlaceholderText("Segurança Contra Incêndio"), {
        target: { value: "Limpeza Industrial" },
      })
      fireEvent.click(screen.getByRole("button", { name: "Criar" }))

      await waitFor(() => {
        const call = findCall(fetchMock.calls, "/api/ativos/categorias", "POST")
        expect(call).toBeDefined()
        expect(call!.body.nome).toBe("Limpeza Industrial")
        expect(call!.body.areaId).toBe(26)
      })
      await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Categoria criada!"))
      expect(navMock.router.push).toHaveBeenCalledWith("/ativos/categorias")
    })
  })

  describe("edição", () => {
    it("carrega dados e salva via PUT", async () => {
      const fetchMock = mountEditPage()
      renderPage(<AtivoCategoriaFormPage />)

      expect(await screen.findByRole("heading", { name: "Editar Categoria" })).toBeInTheDocument()
      await screen.findByDisplayValue("Segurança Contra Incêndio")

      fireEvent.click(screen.getByRole("button", { name: "Atualizar" }))

      await waitFor(() => {
        const call = findCall(fetchMock.calls, "/api/ativos/categorias/1", "PUT")
        expect(call).toBeDefined()
        expect(call!.body.nome).toBe("Segurança Contra Incêndio")
      })
      await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Categoria atualizada!"))
      expect(navMock.router.push).toHaveBeenCalledWith("/ativos/categorias")
    })
  })
})
