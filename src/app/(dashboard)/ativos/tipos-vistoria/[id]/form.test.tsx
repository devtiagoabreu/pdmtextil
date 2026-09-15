// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import TipoVistoriaFormPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

describe("TipoVistoriaFormPage", () => {
  describe("novo", () => {
    it("renderiza heading Novo Tipo de Vistoria", () => {
      navMock.setPathname("/ativos/tipos-vistoria/novo")
      navMock.setParams({ id: "novo" })
      const fetchMock = createFetchMock(() => ({ json: null }))
      vi.stubGlobal("fetch", fetchMock.fn)

      renderPage(<TipoVistoriaFormPage />)

      expect(screen.getByRole("heading", { name: "Novo Tipo de Vistoria" })).toBeDefined()
    })

    it("adiciona item de checklist ao clicar Adicionar item", () => {
      navMock.setPathname("/ativos/tipos-vistoria/novo")
      navMock.setParams({ id: "novo" })
      const fetchMock = createFetchMock(() => ({ json: null }))
      vi.stubGlobal("fetch", fetchMock.fn)

      renderPage(<TipoVistoriaFormPage />)

      expect(screen.getByText(/Nenhum item adicionado/)).toBeDefined()

      fireEvent.click(screen.getByRole("button", { name: /Adicionar item/ }))

      const inputs = screen.getAllByPlaceholderText("Pergunta da vistoria")
      expect(inputs.length).toBe(1)

      fireEvent.click(screen.getByRole("button", { name: /Adicionar item/ }))

      expect(screen.getAllByPlaceholderText("Pergunta da vistoria").length).toBe(2)
    })

    it("valida nome obrigatório ao submeter", async () => {
      navMock.setPathname("/ativos/tipos-vistoria/novo")
      navMock.setParams({ id: "novo" })
      const fetchMock = createFetchMock(() => ({ json: null }))
      vi.stubGlobal("fetch", fetchMock.fn)

      renderPage(<TipoVistoriaFormPage />)

      const form = document.querySelector("form")!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(toastMock.error).toHaveBeenCalledWith("Nome é obrigatório")
      })
    })

    it("cria via POST e redireciona", async () => {
      navMock.setPathname("/ativos/tipos-vistoria/novo")
      navMock.setParams({ id: "novo" })
      const fetchMock = createFetchMock(() => ({ status: 201, json: { id: 10 } }))
      vi.stubGlobal("fetch", fetchMock.fn)

      renderPage(<TipoVistoriaFormPage />)

      fireEvent.change(screen.getByPlaceholderText(/Extintor/), { target: { value: "Grupo Gerador" } })

      const form = document.querySelector("form")!
      fireEvent.submit(form)

      await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Tipo de vistoria criado!"))
      expect(navMock.router.push).toHaveBeenCalledWith("/ativos/tipos-vistoria")
      const call = findCall(fetchMock.calls, "/api/ativos/tipos-vistoria", "POST")
      expect(call).toBeDefined()
      expect(call?.body?.nome).toBe("Grupo Gerador")
    })
  })

  describe("edição", () => {
    it("carrega dados, checklist e periodicidade OUTRA com diasIntervalo", async () => {
      navMock.setPathname("/ativos/tipos-vistoria/1")
      navMock.setParams({ id: "1" })
      const fetchMock = createFetchMock(({ method, url }) => {
        if (method === "GET" && url === "/api/ativos/tipos-vistoria/1") {
          return {
            json: {
              id: 1,
              nome: "Extintor",
              setor: "SEGURANCA",
              periodicidade: "OUTRA",
              diasIntervalo: 90,
              baseLegal: "NR-23",
              checklist: [
                { pergunta: "Bateria OK?", tipo: "SIM_NAO", obrigatorio: true },
                { pergunta: "Peso correto?", tipo: "SIM_NAO", obrigatorio: true },
              ],
              ativo: true,
            },
          }
        }
        return { status: 404, json: { error: "Rota não mockada" } }
      })
      vi.stubGlobal("fetch", fetchMock.fn)

      renderPage(<TipoVistoriaFormPage />)

      expect(await screen.findByRole("heading", { name: "Editar Tipo de Vistoria" })).toBeDefined()
      expect(await screen.findByDisplayValue("Extintor")).toBeDefined()
      expect(screen.getByDisplayValue("NR-23")).toBeDefined()

      const perguntas = screen.getAllByPlaceholderText("Pergunta da vistoria")
      expect(perguntas.length).toBe(2)
      expect(screen.getByDisplayValue("Bateria OK?")).toBeDefined()
      expect(screen.getByDisplayValue("Peso correto?")).toBeDefined()

      expect(screen.getByDisplayValue("90")).toBeDefined()
    })

    it("envia PUT com checklist e redireciona", async () => {
      navMock.setPathname("/ativos/tipos-vistoria/1")
      navMock.setParams({ id: "1" })
      const fetchMock = createFetchMock(({ method, url }) => {
        if (method === "GET" && url === "/api/ativos/tipos-vistoria/1") {
          return {
            json: {
              id: 1,
              nome: "Extintor",
              setor: "SEGURANCA",
              periodicidade: "MENSAL",
              diasIntervalo: null,
              baseLegal: "",
              checklist: [
                { pergunta: "Bateria OK?", tipo: "SIM_NAO", obrigatorio: true },
              ],
              ativo: true,
            },
          }
        }
        if (method === "PUT" && url === "/api/ativos/tipos-vistoria/1") {
          return { json: { ok: true } }
        }
        return { status: 404, json: { error: "Rota não mockada" } }
      })
      vi.stubGlobal("fetch", fetchMock.fn)

      renderPage(<TipoVistoriaFormPage />)

      await screen.findByRole("heading", { name: "Editar Tipo de Vistoria" })

      fireEvent.click(screen.getByRole("button", { name: /Atualizar/ }))

      await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Tipo de vistoria atualizado!"))
      const call = findCall(fetchMock.calls, "/api/ativos/tipos-vistoria/1", "PUT")
      expect(call).toBeDefined()
      expect(call?.body?.checklist).toHaveLength(1)
      expect(call?.body?.checklist[0].pergunta).toBe("Bateria OK?")
    })
  })
})
