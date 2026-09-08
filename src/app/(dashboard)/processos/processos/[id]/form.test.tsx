// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import ProcessoProcessoFormPage from "./page"
import { createFetchMock, findCall, navMock, renderPage, toastMock } from "@/test/harness"

describe("ProcessoProcessoFormPage", () => {
  describe("novo", () => {
    it("valida obrigatórios e salva via POST com arrays", async () => {
      navMock.setPathname("/processos/processos/novo")
      navMock.setParams({ id: "novo" })
      const fetchMock = createFetchMock(({ method, url }) => {
        if (method === "GET" && url === "/api/processos/areas") {
          return { json: [{ id: 1, nome: "Produção" }] }
        }
        if (method === "POST" && url === "/api/processos/processos") {
          return { status: 201, json: { id: 9 } }
        }
        return { status: 404, json: { error: "Rota não mockada" } }
      })
      vi.stubGlobal("fetch", fetchMock.fn)

      const ui = renderPage(<ProcessoProcessoFormPage />)
      const form = ui.container.querySelector("form")!
      fireEvent.submit(form)
      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Nome é obrigatório"))

      fireEvent.change(screen.getByPlaceholderText("Processo de Tecelagem"), { target: { value: "Processo de Tecelagem" } })
      fireEvent.submit(form)
      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Selecione a área"))

      fireEvent.change(screen.getByRole("combobox", { name: "Área *" }), { target: { value: "1" } })
      fireEvent.change(screen.getByLabelText("Código"), { target: { value: "PR-001" } })
      fireEvent.change(screen.getByLabelText("Entradas (uma por linha)"), { target: { value: "Fio de algodão\nCorante" } })
      fireEvent.change(screen.getByLabelText("Saídas (uma por linha)"), { target: { value: "Tecido acabado" } })
      fireEvent.submit(form)

      await waitFor(() => {
        const call = findCall(fetchMock.calls, "/api/processos/processos", "POST")
        expect(call).toBeDefined()
        expect(call?.body?.areaId).toBe(1)
        expect(call?.body?.nome).toBe("Processo de Tecelagem")
        expect(call?.body?.entradas).toEqual(["Fio de algodão", "Corante"])
        expect(call?.body?.saidas).toEqual(["Tecido acabado"])
        expect(call?.body?.indicadores).toEqual([])
        expect(call?.body?.status).toBe("RASCUNHO")
        expect(call?.body?.ativo).toBe(true)
      })
      expect(navMock.router.push).toHaveBeenCalledWith("/processos/processos")
    })

    it("rejeita JSON inválido em indicadores", async () => {
      navMock.setPathname("/processos/processos/novo")
      navMock.setParams({ id: "novo" })
      const fetchMock = createFetchMock(({ method, url }) => {
        if (method === "GET" && url === "/api/processos/areas") {
          return { json: [{ id: 1, nome: "Produção" }] }
        }
        return { status: 404, json: { error: "Rota não mockada" } }
      })
      vi.stubGlobal("fetch", fetchMock.fn)

      const ui = renderPage(<ProcessoProcessoFormPage />)
      const form = ui.container.querySelector("form")!

      fireEvent.change(screen.getByPlaceholderText("Processo de Tecelagem"), { target: { value: "Processo X" } })
      await screen.findByRole("option", { name: "Produção" })
      fireEvent.change(screen.getByRole("combobox", { name: "Área *" }), { target: { value: "1" } })
      fireEvent.change(screen.getByLabelText("Indicadores (JSON — lista de objetos)"), { target: { value: "{ inválido" } })
      fireEvent.submit(form)

      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("O campo Indicadores não é um JSON de lista válido"))
      expect(findCall(fetchMock.calls, "/api/processos/processos", "POST")).toBeUndefined()
    })
  })

  describe("edição", () => {
    it("carrega dados, salva via PUT e mostra subprocessos", async () => {
      navMock.setPathname("/processos/processos/3")
      navMock.setParams({ id: "3" })
      const fetchMock = createFetchMock(({ method, url }) => {
        if (method === "GET" && url === "/api/processos/areas") {
          return { json: [{ id: 1, nome: "Produção" }] }
        }
        if (method === "GET" && url === "/api/processos/processos/3") {
          return {
            json: {
              id: 3,
              areaId: 1,
              codigo: "PR-003",
              nome: "Processo de Tecelagem",
              objetivo: "Produzir tecidos",
              responsavel: "João",
              status: "APROVADO",
              versao: 2,
              entradas: ["Fio de algodão"],
              saidas: ["Tecido"],
              fornecedores: [],
              clientes: ["Malharia X"],
              recursos: [],
              sistemas: ["ERP"],
              equipamentos: [],
              indicadores: [{ nome: "OEE", meta: "95%" }],
              riscos: [],
              controles: [],
              observacoes: "",
              ativo: true,
            },
          }
        }
        if (method === "GET" && url === "/api/processos/subprocessos?processoId=3") {
          return { json: [{ id: 9, nome: "Preparação", descricao: null, ordem: 1, ativo: true }] }
        }
        if (method === "GET" && url === "/api/processos/atividades?processoId=3") {
          return { json: [{ id: 8, subprocessoId: 9, subprocessoNome: "Preparação", nome: "Encarar", tipo: "MANUAL", responsavel: null, ordem: 1 }] }
        }
        if (method === "PUT" && url === "/api/processos/processos/3") {
          return { json: { ok: true } }
        }
        return { status: 404, json: { error: "Rota não mockada" } }
      })
      vi.stubGlobal("fetch", fetchMock.fn)

      renderPage(<ProcessoProcessoFormPage />)

      expect(await screen.findByDisplayValue("Processo de Tecelagem")).toBeDefined()
      expect((screen.getByRole("combobox", { name: "Área *" }) as HTMLSelectElement).value).toBe("1")
      expect((screen.getByRole("combobox", { name: "Status" }) as HTMLSelectElement).value).toBe("APROVADO")
      expect(await screen.findAllByText("Preparação")).toHaveLength(2)
      expect(screen.getByText("Encarar")).toBeDefined()

      fireEvent.change(screen.getByDisplayValue("Produzir tecidos"), { target: { value: "Produzir tecidos premium" } })
      fireEvent.click(screen.getByRole("button", { name: /Atualizar/ }))

      await waitFor(() => expect(navMock.router.push).toHaveBeenCalledWith("/processos/processos"))
      const call = findCall(fetchMock.calls, "/api/processos/processos/3", "PUT")
      expect(call).toBeDefined()
      expect(call?.body?.objetivo).toBe("Produzir tecidos premium")
      expect(call?.body?.entradas).toEqual(["Fio de algodão"])
      expect(call?.body?.cliente).toBeUndefined()
      expect(call?.body?.indicadores).toEqual([{ nome: "OEE", meta: "95%" }])
    })
  })
})