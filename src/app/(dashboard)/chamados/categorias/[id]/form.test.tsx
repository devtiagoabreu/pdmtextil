// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import ChamadoCategoriaFormPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

const CATEGORIA_MOCK = {
  id: 1,
  codigo: "INCIDENTE",
  nome: "Incidente",
  cor: "red",
  ativo: true,
  ordem: 10,
}

function mountForm(opts: { id?: string; registro?: unknown } = {}) {
  const { id, registro = CATEGORIA_MOCK } = opts
  if (id) {
    navMock.setPathname("/chamados/categorias/[id]")
    navMock.setParams({ id })
  } else {
    navMock.setPathname("/chamados/categorias/novo")
    navMock.setParams({ id: "novo" })
  }

  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === `/api/chamados/categorias/${id}`) return { json: registro }
    if (method === "POST" && url === "/api/chamados/categorias") {
      return { status: 201, json: { ...CATEGORIA_MOCK, id: 9 } }
    }
    if (method === "PUT" && url === `/api/chamados/categorias/${id}`) {
      return { json: { ...CATEGORIA_MOCK, nome: "Incidente Crítico" } }
    }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

function submitForm() {
  fireEvent.submit(document.querySelector("form")!)
}

describe("ChamadoCategoriaFormPage", () => {
  beforeEach(() => {
    navMock.reset()
    toastMock.success.mockClear()
    toastMock.error.mockClear()
  })

  it("renderiza o formulário de nova categoria", () => {
    mountForm()
    renderPage(<ChamadoCategoriaFormPage />)

    expect(screen.getByRole("heading", { name: "Nova Categoria" })).toBeInTheDocument()
    expect(screen.getByLabelText("Código")).toBeInTheDocument()
    expect(screen.getByLabelText("Nome")).toBeInTheDocument()
    expect(screen.getByLabelText("Cor")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Criar" })).toBeInTheDocument()
  })

  it("valida código e nome obrigatórios", async () => {
    mountForm()
    const { container } = renderPage(<ChamadoCategoriaFormPage />)

    submitForm()
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Informe o código"))

    fireEvent.change(screen.getByLabelText("Código"), { target: { value: "FALHA" } })
    submitForm()
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Informe o nome"))
  })

  it("cria a categoria via POST", async () => {
    const fetchMock = mountForm()
    renderPage(<ChamadoCategoriaFormPage />)

    fireEvent.change(screen.getByLabelText("Código"), { target: { value: "FALHA" } })
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Falha" } })
    submitForm()

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Categoria criada!")
    )
    const call = findCall(fetchMock.calls, "/api/chamados/categorias", "POST")
    expect(call?.body).toMatchObject({
      codigo: "FALHA",
      nome: "Falha",
      ativo: true,
    })
    expect(navMock.router.push).toHaveBeenCalledWith("/chamados/categorias")
  })

  it("carrega e edita a categoria via PUT", async () => {
    const fetchMock = mountForm({ id: "1" })
    renderPage(<ChamadoCategoriaFormPage />)

    expect(
      await screen.findByRole("heading", { name: "Editar Categoria" })
    ).toBeInTheDocument()
    expect(await screen.findByDisplayValue("INCIDENTE")).toBeInTheDocument()
    expect(await screen.findByDisplayValue("Incidente")).toBeInTheDocument()

    fireEvent.change(screen.getByDisplayValue("Incidente"), {
      target: { value: "Incidente Crítico" },
    })
    submitForm()

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Categoria atualizada!")
    )
    expect(findCall(fetchMock.calls, "/api/chamados/categorias/1", "PUT")).toBeDefined()
    expect(navMock.router.push).toHaveBeenCalledWith("/chamados/categorias")
  })

  it("exibe erro retornado pela API", async () => {
    navMock.setPathname("/chamados/categorias/novo")
    navMock.setParams({ id: "novo" })
    const fetchMock = createFetchMock(() => ({
      status: 409,
      json: { error: "Código já cadastrado" },
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<ChamadoCategoriaFormPage />)

    fireEvent.change(screen.getByLabelText("Código"), { target: { value: "INCIDENTE" } })
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Incidente" } })
    submitForm()

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Código já cadastrado"))
    expect(navMock.router.push).not.toHaveBeenCalled()
  })
})
