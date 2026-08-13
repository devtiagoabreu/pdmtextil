// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import VincularVisitaModal from "./vincular-visita-modal"
import { createFetchMock, findCall, renderPage } from "@/test/harness"

function setup() {
  const onClose = vi.fn()
  const onLinked = vi.fn()
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/clientes") {
      return { status: 200, json: [{ id: 1, nome: "Cliente Alpha" }] }
    }
    if (method === "GET" && url === "/api/crm/pessoas") {
      return { status: 200, json: [{ id: 1, razaoSocial: "Pessoa Beta" }] }
    }
    if (method === "GET" && url === "/api/crm/estados") {
      return { status: 200, json: [] }
    }
    if (method === "POST" && url === "/api/clientes") {
      return { status: 201, json: { id: 2, nome: "Novo Cliente Ltda" } }
    }
    if (method === "POST" && url === "/api/crm/pessoas") {
      return { status: 201, json: { id: 3, razaoSocial: "Nova Pessoa Ltda" } }
    }
    if (method === "PUT" && url === "/api/crm/visitas/8") {
      return { status: 200, json: { id: 8 } }
    }
    return { status: 404, json: { error: `Rota não mockada: ${method} ${url}` } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  const utils = renderPage(
    <VincularVisitaModal visitaId={8} open onClose={onClose} onLinked={onLinked} />,
  )
  return { onClose, onLinked, fetchMock, container: utils.container }
}

async function openClienteStep() {
  fireEvent.click(screen.getByRole("button", { name: /Cliente/ }))
  await screen.findByRole("button", { name: /Criar novo cliente/i })
}

async function openPessoaStep() {
  fireEvent.click(screen.getByRole("button", { name: /Pessoa/ }))
  await screen.findByRole("button", { name: /Criar nova pessoa/i })
}

describe("VincularVisitaModal", () => {
  it("mostra a opção de criar novo cliente ao escolher Cliente", async () => {
    setup()
    await openClienteStep()
  })

  it("cria o cliente e vincula a visita avulsa automaticamente", async () => {
    const { onClose, onLinked, fetchMock } = setup()
    await openClienteStep()

    fireEvent.click(screen.getByRole("button", { name: /Criar novo cliente/i }))
    await screen.findByRole("heading", { name: "Novo Cliente" })

    const form = document.querySelector("form")!
    const [nomeInput, , cnpjInput] = form.querySelectorAll("input")
    fireEvent.change(nomeInput, { target: { value: "Novo Cliente Ltda" } })
    fireEvent.change(cnpjInput, { target: { value: "12.345.678/0001-90" } })

    fireEvent.click(screen.getByRole("button", { name: "Criar Cliente" }))

    await waitFor(() => {
      const post = findCall(fetchMock.calls, "/api/clientes", "POST")
      expect(post?.body).toMatchObject({ nome: "Novo Cliente Ltda", cnpj: "12.345.678/0001-90" })
      const link = findCall(fetchMock.calls, "/api/crm/visitas/8", "PUT")
      expect(link?.body).toMatchObject({ clienteId: 2, empresaId: null, nomeAvulso: null })
    })
    expect(onLinked).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it("vincula cliente existente selecionado no select", async () => {
    const { onClose, onLinked, fetchMock } = setup()
    await openClienteStep()

    await screen.findByText("Cliente Alpha")
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } })
    fireEvent.click(screen.getByRole("button", { name: "Vincular" }))

    await waitFor(() => {
      const link = findCall(fetchMock.calls, "/api/crm/visitas/8", "PUT")
      expect(link?.body).toMatchObject({ clienteId: 1, empresaId: null, nomeAvulso: null })
    })
    expect(onLinked).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it("mostra a opção de criar nova pessoa ao escolher Pessoa", async () => {
    setup()
    await openPessoaStep()
  })

  it("cria a pessoa e vincula a visita avulsa automaticamente", async () => {
    const { onClose, onLinked, fetchMock } = setup()
    await openPessoaStep()

    fireEvent.click(screen.getByRole("button", { name: /Criar nova pessoa/i }))
    await screen.findByRole("heading", { name: "Nova Pessoa (Negócio)" })

    const form = document.querySelector("form")!
    const [razaoInput, , cnpjInput] = form.querySelectorAll("input")
    fireEvent.change(razaoInput, { target: { value: "Nova Pessoa Ltda" } })
    fireEvent.change(cnpjInput, { target: { value: "12.345.678/0001-90" } })

    fireEvent.click(screen.getByRole("button", { name: "Criar" }))

    await waitFor(() => {
      const post = findCall(fetchMock.calls, "/api/crm/pessoas", "POST")
      expect(post?.body).toMatchObject({ razaoSocial: "Nova Pessoa Ltda", cnpj: "12.345.678/0001-90" })
      const link = findCall(fetchMock.calls, "/api/crm/visitas/8", "PUT")
      expect(link?.body).toMatchObject({ empresaId: 3, clienteId: null, nomeAvulso: null })
    })
    expect(onLinked).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it("vincula pessoa existente selecionada no select", async () => {
    const { onClose, onLinked, fetchMock } = setup()
    await openPessoaStep()

    await screen.findByText("Pessoa Beta")
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } })
    fireEvent.click(screen.getByRole("button", { name: "Vincular" }))

    await waitFor(() => {
      const link = findCall(fetchMock.calls, "/api/crm/visitas/8", "PUT")
      expect(link?.body).toMatchObject({ empresaId: 1, clienteId: null, nomeAvulso: null })
    })
    expect(onLinked).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})
