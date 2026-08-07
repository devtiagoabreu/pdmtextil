// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import ConsultaCnpjPage from "./page"
import { createFetchMock, findCall, navMock, renderPage, toastMock } from "@/test/harness"

const CNPJ_DIGITS = "11444777000161"
const CNPJ_FORMATADO = "11.444.777/0001-61"

function handler({ method, url }: { method: string; url: string }) {
  if (method === "GET" && url === `/api/crm/consulta-cnpj?cnpj=${CNPJ_DIGITS}`) {
    return {
      json: {
        apiData: {
          razao_social: "Tecelagem Silva LTDA",
          nome_fantasia: "Tecelagem Silva",
          cnpj: CNPJ_DIGITS,
          situacao_cadastral: "ATIVA",
          matriz_filial: "MATRIZ",
          porte_empresa: "DEMAIS",
          cnae_principal: "1311-1",
          cnae_principal_descricao: "Preparação e fiação",
          logradouro: "Rua das Flores",
          numero: "100",
          bairro: "Centro",
          municipio: "Americana",
          uf: "SP",
          cep: "13465-000",
          capital_social: "100000,00",
          opcao_simples: "S",
          data_inicio_atividade: "01/01/2000",
        },
        crmPessoas: [],
        clientes: [],
      },
    }
  }
  if (method === "GET" && url.startsWith("/api/crm/consulta-cnpj")) {
    return { json: { apiData: null, crmPessoas: [], clientes: [] } }
  }
  return { status: 404, json: { error: "Rota não mockada" } }
}

function setup() {
  navMock.setPathname("/ferramentas/consulta-cnpj")
  const fetchMock = createFetchMock(handler)
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("ConsultaCnpjPage", () => {
  beforeEach(() => {
    navMock.reset()
  })

  it("renderiza o heading e o formulário de busca", () => {
    setup()
    renderPage(<ConsultaCnpjPage />)
    expect(screen.getByRole("heading", { name: "Consulta CNPJ" })).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Digite o CNPJ (com ou sem pontuação)")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Consultar" })).toBeInTheDocument()
  })

  it("consulta um CNPJ e exibe os dados da Receita", async () => {
    const fetchMock = setup()
    renderPage(<ConsultaCnpjPage />)
    fireEvent.change(screen.getByPlaceholderText("Digite o CNPJ (com ou sem pontuação)"), {
      target: { value: CNPJ_FORMATADO },
    })
    fireEvent.submit(document.querySelector("form")!)

    expect(await screen.findAllByText("Tecelagem Silva LTDA")).not.toHaveLength(0)
    expect(screen.getByText(CNPJ_FORMATADO)).toBeInTheDocument()
    expect(screen.getByText("ATIVA")).toBeInTheDocument()
    expect(screen.getByText("Nenhum registro local encontrado")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cadastrar como Pessoa CRM" })).toBeInTheDocument()
    expect(
      findCall(fetchMock.calls, `/api/crm/consulta-cnpj?cnpj=${CNPJ_DIGITS}`)
    ).toBeDefined()
  })

  it("mostra aviso quando o CNPJ não existe na Receita", async () => {
    setup()
    renderPage(<ConsultaCnpjPage />)
    fireEvent.change(screen.getByPlaceholderText("Digite o CNPJ (com ou sem pontuação)"), {
      target: { value: "99.999.999/0001-99" },
    })
    fireEvent.submit(document.querySelector("form")!)

    expect(await screen.findByText("CNPJ não encontrado na Receita Federal")).toBeInTheDocument()
  })

  it("valida CNPJ com menos de 14 dígitos", async () => {
    const fetchMock = setup()
    renderPage(<ConsultaCnpjPage />)
    fireEvent.change(screen.getByPlaceholderText("Digite o CNPJ (com ou sem pontuação)"), {
      target: { value: "123" },
    })
    fireEvent.submit(document.querySelector("form")!)

    expect(toastMock.error).toHaveBeenCalledWith("CNPJ deve ter 14 dígitos")
    expect(fetchMock.calls.length).toBe(0)
  })
})
