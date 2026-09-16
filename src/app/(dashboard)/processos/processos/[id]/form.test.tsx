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

      fireEvent.change(screen.getByPlaceholderText("Processo de Tecelagem"), {
        target: { value: "Processo de Tecelagem" },
      })
      fireEvent.submit(form)
      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Selecione a área"))

      fireEvent.change(screen.getByRole("combobox", { name: "Área *" }), { target: { value: "1" } })
      fireEvent.change(screen.getByLabelText("Código"), { target: { value: "PR-001" } })

      fireEvent.click(screen.getByRole("button", { name: "Adicionar entrada" }))
      fireEvent.change(screen.getByRole("textbox", { name: "Entradas 1" }), {
        target: { value: "Fio de algodão" },
      })
      fireEvent.click(screen.getByRole("button", { name: "Adicionar entrada" }))
      fireEvent.change(screen.getByRole("textbox", { name: "Entradas 2" }), {
        target: { value: "Corante" },
      })

      fireEvent.click(screen.getByRole("button", { name: "Adicionar saída" }))
      fireEvent.change(screen.getByRole("textbox", { name: "Saídas 1" }), {
        target: { value: "Tecido acabado" },
      })
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

    it("preenche indicadores, riscos e controles pelo editor de listas e salva via POST", async () => {
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

      fireEvent.change(screen.getByPlaceholderText("Processo de Tecelagem"), {
        target: { value: "Recebimento de Matéria-Prima" },
      })
      await screen.findByRole("option", { name: "Produção" })
      fireEvent.change(screen.getByRole("combobox", { name: "Área *" }), { target: { value: "1" } })

      fireEvent.click(screen.getByRole("button", { name: /Adicionar indicador/ }))
      fireEvent.change(screen.getByLabelText("Nome", { selector: "#indicadores-0-nome" }), {
        target: { value: "Atraso de entrega" },
      })
      fireEvent.change(screen.getByLabelText("Unidade", { selector: "#indicadores-0-unidade" }), {
        target: { value: "%" },
      })
      fireEvent.change(screen.getByLabelText("Meta", { selector: "#indicadores-0-meta" }), {
        target: { value: "< 3%" },
      })
      fireEvent.change(
        screen.getByLabelText("Frequência", { selector: "#indicadores-0-frequencia" }),
        { target: { value: "semanal" } }
      )

      fireEvent.click(screen.getByRole("button", { name: /Adicionar risco/ }))
      fireEvent.change(screen.getByLabelText("Descrição", { selector: "#riscos-0-descricao" }), {
        target: { value: "Produto divergente do pedido" },
      })
      fireEvent.change(
        screen.getByLabelText("Probabilidade", { selector: "#riscos-0-probabilidade" }),
        { target: { value: "Média" } }
      )
      fireEvent.change(screen.getByLabelText("Impacto", { selector: "#riscos-0-impacto" }), {
        target: { value: "Alta" },
      })
      fireEvent.change(
        screen.getByLabelText("Ação de controle", { selector: "#riscos-0-controle" }),
        { target: { value: "Conferência no recebimento" } }
      )

      fireEvent.click(screen.getByRole("button", { name: /Adicionar controle/ }))
      fireEvent.change(screen.getByLabelText("Descrição", { selector: "#controles-0-descricao" }), {
        target: { value: "Conferência de peso e rolos" },
      })
      fireEvent.change(
        screen.getByLabelText("Responsável", { selector: "#controles-0-responsavel" }),
        { target: { value: "Conferente" } }
      )

      fireEvent.change(screen.getByPlaceholderText("https://..."), {
        target: { value: "https://sistema.com.br/instrucao" },
      })
      fireEvent.change(screen.getByPlaceholderText("Foto, laudo..."), {
        target: { value: "Instrução de trabalho" },
      })
      fireEvent.click(screen.getByRole("button", { name: "Adicionar link" }))
      fireEvent.submit(form)

      await waitFor(() => {
        const call = findCall(fetchMock.calls, "/api/processos/processos", "POST")
        expect(call).toBeDefined()
        expect(call?.body?.indicadores).toEqual([
          { nome: "Atraso de entrega", unidade: "%", meta: "< 3%", frequencia: "semanal" },
        ])
        expect(call?.body?.riscos).toEqual([
          {
            descricao: "Produto divergente do pedido",
            probabilidade: "Média",
            impacto: "Alta",
            controle: "Conferência no recebimento",
          },
        ])
        expect(call?.body?.controles).toEqual([
          { descricao: "Conferência de peso e rolos", responsavel: "Conferente", frequencia: "" },
        ])
        expect(call?.body?.links).toEqual([
          { url: "https://sistema.com.br/instrucao", descricao: "Instrução de trabalho" },
        ])
      })
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
              links: [{ url: "https://example.com/pop", descricao: "POP de tecelagem" }],
              observacoes: "",
              ativo: true,
            },
          }
        }
        if (method === "GET" && url === "/api/processos/subprocessos?processoId=3") {
          return { json: [{ id: 9, nome: "Preparação", descricao: null, ordem: 1, ativo: true }] }
        }
        if (method === "GET" && url === "/api/processos/atividades?processoId=3") {
          return {
            json: [
              {
                id: 8,
                subprocessoId: 9,
                subprocessoNome: "Preparação",
                nome: "Encarar",
                tipo: "MANUAL",
                responsavel: null,
                ordem: 1,
              },
            ],
          }
        }
        if (method === "PUT" && url === "/api/processos/processos/3") {
          return { json: { ok: true } }
        }
        return { status: 404, json: { error: "Rota não mockada" } }
      })
      vi.stubGlobal("fetch", fetchMock.fn)

      renderPage(<ProcessoProcessoFormPage />)

      expect(await screen.findByDisplayValue("Processo de Tecelagem")).toBeDefined()
      expect((screen.getByRole("combobox", { name: "Área *" }) as HTMLSelectElement).value).toBe(
        "1"
      )
      expect((screen.getByRole("combobox", { name: "Status" }) as HTMLSelectElement).value).toBe(
        "APROVADO"
      )
      expect(await screen.findAllByText("Preparação")).toHaveLength(2)
      expect(screen.getByText("Encarar")).toBeDefined()

      fireEvent.change(screen.getByDisplayValue("Produzir tecidos"), {
        target: { value: "Produzir tecidos premium" },
      })
      fireEvent.click(screen.getByRole("button", { name: /Atualizar/ }))

      await waitFor(() => expect(navMock.router.push).toHaveBeenCalledWith("/processos/processos"))
      const call = findCall(fetchMock.calls, "/api/processos/processos/3", "PUT")
      expect(call).toBeDefined()
      expect(call?.body?.objetivo).toBe("Produzir tecidos premium")
      expect(call?.body?.entradas).toEqual(["Fio de algodão"])
      expect(call?.body?.cliente).toBeUndefined()
      expect(call?.body?.indicadores).toEqual([
        { nome: "OEE", unidade: "", meta: "95%", frequencia: "" },
      ])
      expect(call?.body?.links).toEqual([
        { url: "https://example.com/pop", descricao: "POP de tecelagem" },
      ])
    })
  })
})
