// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import PessoaDetailPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

const pessoa = {
  id: 1,
  tipoPessoa: "PJ",
  razaoSocial: "Tecelagem Alpha",
  nomeFantasia: "Alpha Confecções",
  cnpj: "12.345.678/0001-90",
  segmento: "Têxtil",
  porte: "ME",
  site: "",
  telefone: "(11) 3333-3333",
  celular: "",
  email: "contato@alpha.com",
  emailNf: "",
  endereco: "Rua das Rosas",
  numero: "100",
  complemento: "",
  bairro: "Centro",
  cidade: "São Paulo",
  uf: "SP",
  cep: "01000-000",
  observacoes: "",
  status: "QUALIFICADO",
  resumoIa: null,
  sugestaoIa: null,
  createdAt: "2026-07-01T10:00:00Z",
  contatos: [
    { id: 3, nome: "Carlos Silva", cargo: "Comprador", email: "carlos@alpha.com", principal: true },
  ],
}

const representantes = [
  {
    id: 5,
    nome: "Representante Beta",
    cnpj: "11.222.333/0001-44",
    email: "beta@rep.com",
    telefone: "(11) 9999-9999",
    cidade: "Campinas",
    uf: "SP",
  },
]

const leads = [
  { id: 10, nome: "Pedro Souza", celular: "(11) 97777-0001", cargo: "Gerente", origem: "OUTRO", status: "NOVO", empresaId: 1 },
]

const oportunidades = [
  { id: 20, titulo: "Oportunidade Grande", valorEstimado: 5000, status: "Novo", empresaId: 1 },
]

const propostas = [
  { id: 30, titulo: "Proposta Tecido", valor: 1200, status: "ENVIADA", empresaId: 1 },
]

describe("PessoaDetailPage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/pessoas/1") return { json: pessoa }
      if (method === "GET" && url === "/api/crm/pessoas/1/representantes") return { json: representantes }
      if (method === "GET" && url === "/api/crm/leads?empresaId=1") return { json: leads }
      if (method === "GET" && url === "/api/crm/oportunidades?empresaId=1") return { json: oportunidades }
      if (method === "GET" && url === "/api/crm/propostas?empresaId=1") return { json: propostas }
      if (method === "POST" && url === "/api/crm/leads") {
        return { json: { id: 99, nome: "Novo Lead Teste", empresaId: 1 } }
      }
      if (method === "GET" && url === "/api/crm/estados") {
        return { json: [{ id: 35, uf: "SP", nome: "São Paulo" }] }
      }
      if (method === "GET" && url === "/api/crm/cidades?estadoId=35") {
        return { json: [{ id: 1, nome: "São Paulo", estadoId: 35 }] }
      }
      if (method === "GET" && url === "/api/crm/timeline?pessoaId=1") return { json: [] }
      if (method === "GET" && url === "/api/crm/whatsapp?empresaId=1") return { json: [] }
      if (method === "PUT" && url === "/api/crm/pessoas/1") return { json: { ...pessoa } }
      if (method === "DELETE" && url === "/api/crm/pessoas/1") return { json: { ok: true } }
      return { json: null }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("exibe os dados da pessoa com contatos, representantes, leads, oportunidades e propostas", async () => {
    navMock.setParams({ id: "1" })
    navMock.setPathname("/comercial/crm/pessoas/1")
    renderPage(<PessoaDetailPage />)

    expect(await screen.findByRole("heading", { name: /Tecelagem Alpha/ })).toBeInTheDocument()
    expect(screen.getByText("PJ")).toBeInTheDocument()
    expect(screen.getAllByText("QUALIFICADO").length).toBeGreaterThan(0)

    expect(await screen.findByText("Carlos Silva")).toBeInTheDocument()
    expect(screen.getByText("Comprador")).toBeInTheDocument()
    expect(screen.getByText("Principal")).toBeInTheDocument()

    expect(await screen.findByText("Representante Beta")).toBeInTheDocument()
    expect(screen.getByText("11.222.333/0001-44")).toBeInTheDocument()

    expect(await screen.findByText("Pedro Souza")).toBeInTheDocument()
    expect(screen.getByText("Oportunidade Grande")).toBeInTheDocument()
    expect(screen.getByText("Proposta Tecido")).toBeInTheDocument()
    expect(await screen.findByText("Nenhuma mensagem")).toBeInTheDocument()
  })

  it("cria um lead vinculado à pessoa pelo card de leads", async () => {
    navMock.setParams({ id: "1" })
    navMock.setPathname("/comercial/crm/pessoas/1")
    renderPage(<PessoaDetailPage />)

    fireEvent.click(await screen.findByTitle("Cadastrar novo lead"))

    const dialog = screen.getByRole("dialog", { name: "Novo Lead" })
    fireEvent.change(within(dialog).getAllByRole("textbox")[0], { target: { value: "Novo Lead Teste" } })
    fireEvent.click(within(dialog).getByRole("button", { name: "Criar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/leads", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual(expect.objectContaining({ nome: "Novo Lead Teste", empresaId: 1 }))
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Lead criado com sucesso"))
  })

  it("edita a pessoa via PUT", async () => {
    navMock.setParams({ id: "1" })
    navMock.setPathname("/comercial/crm/pessoas/1")
    renderPage(<PessoaDetailPage />)

    fireEvent.click(await screen.findByRole("button", { name: "Editar" }))

    const razaoInput = await screen.findByDisplayValue("Tecelagem Alpha")
    fireEvent.change(razaoInput, { target: { value: "Tecelagem Alpha Atualizada" } })

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/pessoas/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual(expect.objectContaining({ razaoSocial: "Tecelagem Alpha Atualizada" }))
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Pessoa atualizada"))
  })

  it("exclui a pessoa após confirmação", async () => {
    navMock.setParams({ id: "1" })
    navMock.setPathname("/comercial/crm/pessoas/1")
    renderPage(<PessoaDetailPage />)

    fireEvent.click(await screen.findByRole("button", { name: "Excluir" }))

    const dialog = screen.getByRole("dialog", { name: "Excluir pessoa?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/pessoas/1", "DELETE")
      expect(call).toBeDefined()
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Pessoa excluída"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/pessoas")
  })

  it("mostra pessoa não encontrada", async () => {
    navMock.setParams({ id: "999" })
    navMock.setPathname("/comercial/crm/pessoas/999")
    renderPage(<PessoaDetailPage />)

    expect(await screen.findByText("Pessoa não encontrada")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Voltar" })).toHaveAttribute("href", "/comercial/crm/pessoas")
  })
})
