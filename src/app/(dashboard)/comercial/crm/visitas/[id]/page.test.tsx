// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import DetalheVisitaPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { role: "ADMIN" } } }),
}))

const statusesVisita = [
  { id: 1, nome: "AGENDADA", rotulo: "Agendada", tipo: "VISITA", cor: "#3b82f6", ordem: 1, ativo: true },
  { id: 2, nome: "REALIZADA", rotulo: "Realizada", tipo: "VISITA", cor: "#10b981", ordem: 3, ativo: true },
]

const visita = {
  id: 1,
  dataVisita: "2026-07-01",
  hora: "10:00",
  tipo: "PRESENCIAL",
  status: "AGENDADA",
  empresaId: 1,
  clienteId: null,
  empresaNome: "Tecelagem Alpha",
  clienteNome: null,
  nomeAvulso: null,
  oportunidadeTitulo: "Venda de malha",
  contatoNome: null,
  criadoPor: 3,
  criadoPorNome: "Tiago",
  endereco: "Rua das Rosas",
  numero: "100",
  complemento: "",
  bairro: "Centro",
  cidade: "São Paulo",
  uf: "SP",
  cep: "01000-000",
  relato: "<p>Visita de apresentação</p>",
  fotos: [],
  duracaoEstimada: 30,
  checkInTime: null,
  checkOutTime: null,
  checkInLat: null,
  checkInLng: null,
  checkOutLat: null,
  checkOutLng: null,
}

function buildHandler(data: any) {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/crm/estados") {
      return { json: [{ id: 35, uf: "SP", nome: "São Paulo" }] }
    }
    if (method === "GET" && url === "/api/crm/viagens?all=true") {
      return { json: [] }
    }
    if (method === "GET" && url === "/api/admin/status?tipo=VISITA") {
      return { json: statusesVisita }
    }
    if (method === "GET" && url === `/api/crm/visitas/${data.id}`) {
      return { json: data }
    }
    if (method === "GET" && url === "/api/crm/cidades?estadoId=35") {
      return { json: [{ id: 1, nome: "São Paulo", estadoId: 35 }] }
    }
    if (method === "GET" && url === "/api/crm/pessoas/1") {
      return { json: { id: 1, razaoSocial: "Tecelagem Alpha", endereco: "Rua das Rosas", numero: "100", bairro: "Centro", cidade: "São Paulo", uf: "SP", cep: "01000-000" } }
    }
    if (method === "GET" && url === "/api/crm/pessoas") {
      return { json: [{ id: 1, razaoSocial: "Tecelagem Alpha" }] }
    }
    if (method === "GET" && url.startsWith("/api/crm/visitas/conflictos?")) {
      return { json: { conflictos: [] } }
    }
    if (method === "PUT" && url.startsWith("/api/crm/visitas/")) {
      return { json: { ok: true } }
    }
    if (method === "POST" && url === `/api/crm/visitas/${data.id}/check`) {
      return { json: { ok: true } }
    }
    if (method === "DELETE" && url === `/api/crm/visitas/${data.id}`) {
      return { json: { ok: true } }
    }
    return { json: null }
  }
}

describe("DetalheVisitaPage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    fetchMock = createFetchMock(buildHandler(visita))
    vi.stubGlobal("fetch", fetchMock.fn)
    navMock.setParams({ id: "1" })
  })

  it("renderiza os detalhes da visita", async () => {
    renderPage(<DetalheVisitaPage />)

    expect(await screen.findByRole("heading", { name: "Visita — Tecelagem Alpha" })).toBeInTheDocument()
    expect(screen.getAllByText("Agendada").length).toBeGreaterThan(0)
    expect(screen.getByText("Presencial — 01/07/2026 às 10:00")).toBeInTheDocument()
    expect(screen.getAllByText("01/07/2026 às 10:00").length).toBeGreaterThan(0)
    expect(screen.getByText("30 min")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Tecelagem Alpha" })).toHaveAttribute("href", "/comercial/crm/pessoas/1")
    expect(screen.getByText("Venda de malha")).toBeInTheDocument()
    expect(screen.getByText("Rua das Rosas")).toBeInTheDocument()
    expect(screen.getByText("Visita de apresentação")).toBeInTheDocument()
    expect(screen.getByText("Check-in / Check-out")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Fazer Check-in" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument()
  })

  it("edita a visita via PUT", async () => {
    renderPage(<DetalheVisitaPage />)
    await screen.findByRole("heading", { name: "Visita — Tecelagem Alpha" })

    fireEvent.click(screen.getByRole("button", { name: "Editar" }))
    expect(await screen.findByRole("button", { name: "Salvar" })).toBeInTheDocument()

    const selects = screen.getAllByRole("combobox")
    fireEvent.change(selects[0], { target: { value: "REALIZADA" } })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/visitas/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual(expect.objectContaining({ id: 1, status: "REALIZADA", fotos: [] }))
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Visita atualizada"))
  })

  it("exclui a visita via DELETE", async () => {
    renderPage(<DetalheVisitaPage />)
    await screen.findByRole("heading", { name: "Visita — Tecelagem Alpha" })

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }))

    const dialog = await screen.findByRole("dialog", { name: "Excluir visita?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/crm/visitas/1", "DELETE")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Visita excluída"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/visitas")
  })

  it("registra check-in via POST", async () => {
    renderPage(<DetalheVisitaPage />)
    await screen.findByRole("heading", { name: "Visita — Tecelagem Alpha" })

    fireEvent.click(screen.getByRole("button", { name: "Fazer Check-in" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/visitas/1/check", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ tipo: "check_in", latitude: null, longitude: null })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Check-in registrado!"))
  })

  it("vincula uma visita avulsa a uma pessoa", async () => {
    navMock.setParams({ id: "2" })
    const avulsa = {
      id: 2,
      dataVisita: "2026-07-03",
      hora: null,
      tipo: "PRESENCIAL",
      status: "AGENDADA",
      empresaId: null,
      clienteId: null,
      empresaNome: null,
      clienteNome: null,
      nomeAvulso: "José da Silva",
      oportunidadeTitulo: null,
      contatoNome: null,
      criadoPorNome: null,
      endereco: null,
      relato: null,
      fotos: [],
      duracaoEstimada: null,
      checkInTime: null,
      checkOutTime: null,
    }
    const avulsaMock = createFetchMock(buildHandler(avulsa))
    vi.stubGlobal("fetch", avulsaMock.fn)

    renderPage(<DetalheVisitaPage />)

    expect(await screen.findByRole("heading", { name: "Visita — José da Silva" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Vincular" }))

    const dialog = await screen.findByRole("dialog", { name: "Vincular Visita Avulsa" })
    fireEvent.click(within(dialog).getByRole("button", { name: /^Pessoa/ }))

    await waitFor(() => expect(within(dialog).getByRole("option", { name: "Tecelagem Alpha" })).toBeInTheDocument())
    fireEvent.change(within(dialog).getByRole("combobox"), { target: { value: "1" } })
    fireEvent.click(within(dialog).getByRole("button", { name: "Vincular" }))

    await waitFor(() => {
      const call = findCall(avulsaMock.calls, "/api/crm/visitas/2", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ nomeAvulso: null, empresaId: 1, clienteId: null })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Visita vinculada com sucesso!"))
  })

  it("aplica o modelo de visita técnica no relato da ata", async () => {
    renderPage(<DetalheVisitaPage />)
    await screen.findByRole("heading", { name: "Visita — Tecelagem Alpha" })

    fireEvent.click(screen.getByRole("button", { name: "Editar" }))
    await screen.findByRole("button", { name: "Salvar" })

    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    expect(editor.innerHTML).toContain("Visita de apresentação")

    fireEvent.click(screen.getByRole("button", { name: "Visita tecnica" }))

    await waitFor(() => expect(editor.innerHTML).toContain("Visita tecnica para levantamento de necessidades"))
    expect(editor.innerHTML).not.toContain("Visita de apresentação")
  })

  it("mostra o card de anexos com descrições e aceita dados antigos (string[])", async () => {
    const comAnexos = {
      ...visita,
      fotos: [
        { url: "https://cloud.com/nota.jpg", descricao: "Nota fiscal da entrega" },
        "https://cloud.com/legada.jpg",
      ],
    }
    const anexosMock = createFetchMock(buildHandler(comAnexos))
    vi.stubGlobal("fetch", anexosMock.fn)

    renderPage(<DetalheVisitaPage />)
    await screen.findByRole("heading", { name: "Visita — Tecelagem Alpha" })

    expect(screen.getByText("Fotos, comprovantes, documentos e outros")).toBeInTheDocument()
    expect(screen.getByText("Nota fiscal da entrega")).toBeInTheDocument()
    expect(document.querySelector('a[href="https://cloud.com/nota.jpg"]')).not.toBeNull()
    expect(document.querySelector('a[href="https://cloud.com/legada.jpg"]')).not.toBeNull()
  })

  it("permite adicionar URL e descrever o anexo na edição", async () => {
    renderPage(<DetalheVisitaPage />)
    await screen.findByRole("heading", { name: "Visita — Tecelagem Alpha" })

    fireEvent.click(screen.getByRole("button", { name: "Editar" }))
    await screen.findByRole("button", { name: "Salvar" })

    fireEvent.click(screen.getByRole("button", { name: "URL" }))
    fireEvent.change(screen.getByPlaceholderText("https://..."), { target: { value: "https://cloud.com/comprovante.pdf" } })
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }))

    const descricaoInput = await screen.findByRole("textbox", { name: "Descrição do item 1" })
    fireEvent.change(descricaoInput, { target: { value: "Comprovante de entrega" } })

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/visitas/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual(
        expect.objectContaining({
          fotos: [{ url: "https://cloud.com/comprovante.pdf", descricao: "Comprovante de entrega" }],
        }),
      )
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Visita atualizada"))
  })

  it("Enter confirma a descrição do anexo e mostra feedback salvo", async () => {
    renderPage(<DetalheVisitaPage />)
    await screen.findByRole("heading", { name: "Visita — Tecelagem Alpha" })

    fireEvent.click(screen.getByRole("button", { name: "Editar" }))
    await screen.findByRole("button", { name: "Salvar" })

    fireEvent.click(screen.getByRole("button", { name: "URL" }))
    fireEvent.change(screen.getByPlaceholderText("https://..."), { target: { value: "https://cloud.com/nota.jpg" } })
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }))

    const descricaoInput = await screen.findByRole("textbox", { name: "Descrição do item 1" })
    fireEvent.change(descricaoInput, { target: { value: "Nota fiscal" } })
    fireEvent.keyDown(descricaoInput, { key: "Enter" })

    expect(await screen.findByText("Descrição salva")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Remover item 1" })).toBeInTheDocument()
  })

  it("permite definir a oportunidade na edição da visita", async () => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/oportunidades") {
        return { json: [{ id: 3, titulo: "Venda de malha", empresaId: 1, clienteId: null }] }
      }
      if (method === "GET" && url === "/api/crm/estados") {
        return { json: [{ id: 35, uf: "SP", nome: "São Paulo" }] }
      }
      if (method === "GET" && url === "/api/crm/viagens?all=true") {
        return { json: [] }
      }
      if (method === "GET" && url === "/api/admin/status?tipo=VISITA") {
        return { json: statusesVisita }
      }
      if (method === "GET" && url === "/api/crm/visitas/1") {
        return { json: visita }
      }
      if (method === "GET" && url === "/api/crm/cidades?estadoId=35") {
        return { json: [{ id: 1, nome: "São Paulo", estadoId: 35 }] }
      }
      if (method === "GET" && url === "/api/crm/pessoas/1") {
        return { json: { id: 1, razaoSocial: "Tecelagem Alpha", endereco: "Rua das Rosas", uf: "SP", cidade: "São Paulo" } }
      }
      if (method === "GET" && url === "/api/crm/pessoas") {
        return { json: [{ id: 1, razaoSocial: "Tecelagem Alpha" }] }
      }
      if (method === "GET" && url.startsWith("/api/crm/visitas/conflictos?")) {
        return { json: { conflictos: [] } }
      }
      if (method === "PUT" && url === "/api/crm/visitas/1") {
        return { json: { ok: true } }
      }
      return { json: null }
    }
    const mock = createFetchMock(handler)
    vi.stubGlobal("fetch", mock.fn)
    renderPage(<DetalheVisitaPage />)

    await screen.findByRole("heading", { name: "Visita — Tecelagem Alpha" })
    fireEvent.click(screen.getByRole("button", { name: "Editar" }))
    await screen.findByRole("button", { name: "Salvar" })

    const opSelect = screen.getAllByRole("combobox").find(
      (c) => c.tagName === "SELECT" && Array.from((c as HTMLSelectElement).options).some(o => o.textContent === "Venda de malha")
    ) as HTMLSelectElement
    expect(opSelect).toBeDefined()
    fireEvent.change(opSelect, { target: { value: "3" } })

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(mock.calls, "/api/crm/visitas/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual(expect.objectContaining({ oportunidadeId: 3, propostaId: null }))
    })
  })

  it("mostra mensagem quando a visita não existe", async () => {
    navMock.setParams({ id: "999" })
    const notFound = createFetchMock(() => ({ status: 404, json: { error: "não encontrada" } }))
    vi.stubGlobal("fetch", notFound.fn)

    renderPage(<DetalheVisitaPage />)

    expect(await screen.findByText("Visita não encontrada")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Voltar" })).toHaveAttribute("href", "/comercial/crm/visitas")
  })
})
