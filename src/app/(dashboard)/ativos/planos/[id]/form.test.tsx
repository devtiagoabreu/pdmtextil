// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import PlanoVistoriaFormPage from "./page"
import { createFetchMock, findCall, navMock, renderPage, toastMock } from "@/test/harness"

const USUARIOS = [
  { id: 3, name: "João", role: "ADMIN" },
  { id: 5, name: "Maria", role: "MECANICA" },
]
const ATIVOS = [{ id: 1, codigo: "A-001", nome: "Gerador" }]
const TIPOS = [{ id: 1, nome: "Grupo Gerador" }]

function mockHandler({ method, url }: { method: string; url: string }) {
  if (method === "GET" && url === "/api/ativos/ativos") return { json: ATIVOS }
  if (method === "GET" && url === "/api/ativos/tipos-vistoria") return { json: TIPOS }
  if (method === "GET" && url === "/api/usuarios/ativos") return { json: USUARIOS }
  if (method === "GET" && url === "/api/ativos/planos/1") {
    return {
      json: {
        id: 1,
        ativoId: 1,
        tipoVistoriaId: 1,
        responsavelId: 5,
        diasIntervalo: 30,
        proximaData: "2026-10-15",
        ativo: true,
      },
    }
  }
  if (method === "POST" && url === "/api/ativos/planos") return { status: 201, json: { id: 99 } }
  if (method === "PUT" && url === "/api/ativos/planos/1") return { json: { ok: true } }
  return { status: 404, json: { error: "Rota não mockada" } }
}

describe("PlanoVistoriaFormPage", () => {
  beforeEach(() => {
    navMock.reset()
    toastMock.success.mockClear()
    toastMock.error.mockClear()
  })

  describe("novo", () => {
    beforeEach(() => {
      navMock.setPathname("/ativos/planos/novo")
      navMock.setParams({ id: "novo" })
    })

    it("renderiza o formulário de criação", async () => {
      vi.stubGlobal("fetch", createFetchMock(mockHandler).fn)
      renderPage(<PlanoVistoriaFormPage />)
      expect(screen.getByRole("heading", { name: "Novo Plano de Vistoria" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Criar" })).toBeInTheDocument()
      expect(await screen.findByRole("option", { name: "João (ADMIN)" })).toBeInTheDocument()
    })

    it("exige o responsável (usuário do PDM) antes de salvar", async () => {
      vi.stubGlobal("fetch", createFetchMock(mockHandler).fn)
      const { container } = renderPage(<PlanoVistoriaFormPage />)

      const ativo = screen.getByLabelText("Ativo")
      await screen.findByRole("option", { name: "A-001 — Gerador" })
      fireEvent.change(ativo, { target: { value: "1" } })

      const tipo = screen.getByLabelText("Tipo de Vistoria")
      await screen.findByRole("option", { name: "Grupo Gerador" })
      fireEvent.change(tipo, { target: { value: "1" } })

      fireEvent.change(screen.getByLabelText("Próxima Data"), { target: { value: "2026-10-15" } })

      const fetchMock = createFetchMock(mockHandler)
      vi.stubGlobal("fetch", fetchMock.fn)
      fireEvent.submit(container.querySelector("form")!)

      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Selecione o responsável"))
      expect(findCall(fetchMock.calls, "/api/ativos/planos", "POST")).toBeUndefined()
    })
  })

  describe("edição", () => {
    beforeEach(() => {
      navMock.setPathname("/ativos/planos/1")
      navMock.setParams({ id: "1" })
    })

    it("carrega e seleciona o responsável salvo, envia via PUT", async () => {
      const fetchMock = createFetchMock(mockHandler)
      vi.stubGlobal("fetch", fetchMock.fn)
      renderPage(<PlanoVistoriaFormPage />)

      await screen.findByRole("option", { name: "Maria (MECANICA)" })
      const responsavel = screen.getByLabelText("Responsável") as HTMLSelectElement
      expect(responsavel.value).toBe("5")

      fireEvent.click(screen.getByRole("button", { name: "Atualizar" }))

      await waitFor(() =>
        expect(findCall(fetchMock.calls, "/api/ativos/planos/1", "PUT")).toBeDefined()
      )
      const call = findCall(fetchMock.calls, "/api/ativos/planos/1", "PUT")
      expect(call?.body?.responsavelId).toBe(5)
      expect(call?.body?.ativoId).toBe(1)
      expect(call?.body?.tipoVistoriaId).toBe(1)
      await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Plano atualizado!"))
      expect(navMock.router.push).toHaveBeenCalledWith("/ativos/planos")
    })
  })
})
