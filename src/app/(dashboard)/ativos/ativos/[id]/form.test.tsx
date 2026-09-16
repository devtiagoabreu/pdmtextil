// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import AtivoFormPage from "./page"
import { createFetchMock, findCall, navMock, renderPage, toastMock } from "@/test/harness"

const USUARIOS = [
  { id: 3, name: "João", role: "ADMIN" },
  { id: 5, name: "Maria", role: "MECANICA" },
]
const CATEGORIAS = [{ id: 1, nome: "Segurança Contra Incêndio" }]

function mockHandler({ method, url }: { method: string; url: string }) {
  if (method === "GET" && url === "/api/ativos/categorias") return { json: CATEGORIAS }
  if (method === "GET" && url === "/api/usuarios/ativos") return { json: USUARIOS }
  if (method === "GET" && url === "/api/ativos/3") {
    return {
      json: {
        id: 3,
        codigo: "EXT-003",
        nome: "Extintor Galpão C",
        categoriaId: 1,
        localizacao: "Galpão C",
        fabricante: null,
        modelo: null,
        numSerie: null,
        anoFabricacao: null,
        dataAquisicao: "2022-01-15",
        valorAquisicao: "12000",
        valorResidual: "2000",
        vidaUtilAnos: 5,
        status: "ATIVO",
        maquinaId: null,
        responsavelId: 5,
        observacoes: null,
        ativo: true,
      },
    }
  }
  if (method === "POST" && url === "/api/ativos") return { status: 201, json: { id: 9 } }
  if (method === "PUT" && url === "/api/ativos/3") return { json: { ok: true } }
  return { status: 404, json: { error: "Rota não mockada" } }
}

describe("AtivoFormPage", () => {
  beforeEach(() => {
    navMock.reset()
    toastMock.success.mockClear()
    toastMock.error.mockClear()
  })

  describe("novo", () => {
    beforeEach(() => {
      navMock.setPathname("/ativos/ativos/novo")
      navMock.setParams({ id: "novo" })
    })

    it("renderiza o formulário de criação", async () => {
      vi.stubGlobal("fetch", createFetchMock(mockHandler).fn)
      renderPage(<AtivoFormPage />)
      expect(screen.getByRole("heading", { name: "Novo Ativo" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Criar" })).toBeInTheDocument()
      expect(await screen.findByRole("option", { name: "Maria (MECANICA)" })).toBeInTheDocument()
    })

    it("cria via POST com responsável selecionado de usuário do PDM", async () => {
      const fetchMock = createFetchMock(mockHandler)
      vi.stubGlobal("fetch", fetchMock.fn)
      renderPage(<AtivoFormPage />)

      fireEvent.change(screen.getByLabelText("Código"), { target: { value: "EXT-001" } })
      fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Extintor Galpão A" } })

      const categoria = screen.getByLabelText("Categoria")
      await screen.findByRole("option", { name: "Segurança Contra Incêndio" })
      fireEvent.change(categoria, { target: { value: "1" } })

      const responsavel = screen.getByLabelText("Responsável")
      await screen.findByRole("option", { name: "João (ADMIN)" })
      fireEvent.change(responsavel, { target: { value: "3" } })

      fireEvent.change(screen.getByLabelText("Data de Aquisição"), {
        target: { value: "2024-01-01" },
      })
      fireEvent.change(screen.getByLabelText("Valor de Aquisição (R$)"), {
        target: { value: "12000" },
      })
      fireEvent.change(screen.getByLabelText("Valor Residual (R$)"), {
        target: { value: "2000" },
      })
      fireEvent.change(screen.getByLabelText("Vida Útil (anos)"), {
        target: { value: "5" },
      })

      fireEvent.click(screen.getByRole("button", { name: "Criar" }))

      await waitFor(() => {
        const call = findCall(fetchMock.calls, "/api/ativos", "POST")
        expect(call).toBeDefined()
        expect(call?.body?.codigo).toBe("EXT-001")
        expect(call?.body?.nome).toBe("Extintor Galpão A")
        expect(call?.body?.categoriaId).toBe(1)
        expect(call?.body?.responsavelId).toBe(3)
        expect(call?.body?.dataAquisicao).toBe("2024-01-01")
        expect(call?.body?.valorAquisicao).toBe(12000)
        expect(call?.body?.valorResidual).toBe(2000)
        expect(call?.body?.vidaUtilAnos).toBe(5)
        expect(call?.body?.ativo).toBe(true)
      })
      await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Ativo criado!"))
      expect(navMock.router.push).toHaveBeenCalledWith("/ativos/ativos")
    })

    it("mostra o controle de depreciação ao preencher os valores", async () => {
      vi.stubGlobal("fetch", createFetchMock(mockHandler).fn)
      renderPage(<AtivoFormPage />)

      await screen.findByRole("option", { name: "Segurança Contra Incêndio" })
      fireEvent.change(screen.getByLabelText("Data de Aquisição"), {
        target: { value: "2026-01-01" },
      })
      fireEvent.change(screen.getByLabelText("Valor de Aquisição (R$)"), {
        target: { value: "12000" },
      })
      fireEvent.change(screen.getByLabelText("Valor Residual (R$)"), {
        target: { value: "2000" },
      })
      fireEvent.change(screen.getByLabelText("Vida Útil (anos)"), {
        target: { value: "5" },
      })

      await screen.findByText("Controle de Depreciação")
      expect(screen.getByText("R$ 10.000,00")).toBeInTheDocument()
      expect(screen.getByText("Projeção anual")).toBeInTheDocument()
    })
  })

  describe("edição", () => {
    beforeEach(() => {
      navMock.setPathname("/ativos/ativos/3")
      navMock.setParams({ id: "3" })
    })

    it("carrega e mantém o responsável salvo, envia via PUT", async () => {
      const fetchMock = createFetchMock(mockHandler)
      vi.stubGlobal("fetch", fetchMock.fn)
      renderPage(<AtivoFormPage />)

      await screen.findByDisplayValue("EXT-003")
      await screen.findByRole("option", { name: "Maria (MECANICA)" })
      const responsavel = screen.getByLabelText("Responsável") as HTMLSelectElement
      expect(responsavel.value).toBe("5")
      await screen.findByDisplayValue("12000")
      expect((screen.getByLabelText("Vida Útil (anos)") as HTMLInputElement).value).toBe("5")

      fireEvent.click(screen.getByRole("button", { name: "Atualizar" }))

      await waitFor(() =>
        expect(findCall(fetchMock.calls, "/api/ativos/3", "PUT")).toBeDefined()
      )
      const call = findCall(fetchMock.calls, "/api/ativos/3", "PUT")
      expect(call?.body?.responsavelId).toBe(5)
      expect(call?.body?.valorAquisicao).toBe(12000)
      await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Ativo atualizado!"))
      expect(navMock.router.push).toHaveBeenCalledWith("/ativos/ativos")
    })
  })
})
