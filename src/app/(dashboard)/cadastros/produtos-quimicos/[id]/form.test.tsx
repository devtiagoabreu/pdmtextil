// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import ProdutoQuimicoFormPage from "./page"
import { createFetchMock, findCall, navMock, renderPage } from "@/test/harness"

describe("ProdutoQuimicoFormPage", () => {
  describe("novo", () => {
    it("salva via POST e redireciona", async () => {
      navMock.setPathname("/cadastros/produtos-quimicos/novo")
      navMock.setParams({ id: "novo" })
      const fetchMock = createFetchMock(() => ({ status: 201, json: { id: 9 } }))
      vi.stubGlobal("fetch", fetchMock.fn)

      renderPage(<ProdutoQuimicoFormPage />)

      const textbox = screen.getAllByRole("textbox")
      fireEvent.change(textbox[0], { target: { value: "PQ01" } })
      fireEvent.change(textbox[1], { target: { value: "Soda Cáustica" } })

      fireEvent.click(screen.getByRole("button", { name: /Salvar/ }))

      await waitFor(() => expect(navMock.router.push).toHaveBeenCalledWith("/cadastros/produtos-quimicos"))
      const call = findCall(fetchMock.calls, "/api/cadastros/produtos-quimicos", "POST")
      expect(call).toBeDefined()
      expect(call?.body?.codigo).toBe("PQ01")
      expect(call?.body?.nome).toBe("Soda Cáustica")
      expect(call?.body?.unidadePadrao).toBe("kg")
      expect(call?.body?.ativo).toBe(true)
    })
  })

  describe("edição", () => {
    it("carrega dados, salva via PUT e redireciona", async () => {
      navMock.setPathname("/cadastros/produtos-quimicos/3")
      navMock.setParams({ id: "3" })
      const fetchMock = createFetchMock(({ method, url }) => {
        if (method === "GET" && url === "/api/cadastros/produtos-quimicos/3") {
          return {
            json: {
              id: 3,
              codigo: "PQ03",
              nome: "Hidróxido de Sódio",
              descricao: "Descrição antiga",
              categoria: "Álcali",
              unidadePadrao: "kg",
              tipo: "TIPO_1",
              concentracao: "50%",
              densidade: 1.53,
              ph: 13,
              observacoes: "",
              fichaSeguranca: "",
              idIntegracao: "ERP-3",
              ativo: true,
            },
          }
        }
        if (method === "PUT" && url === "/api/cadastros/produtos-quimicos/3") {
          return { json: { ok: true } }
        }
        return { status: 404, json: { error: "Rota não mockada" } }
      })
      vi.stubGlobal("fetch", fetchMock.fn)

      renderPage(<ProdutoQuimicoFormPage />)

      expect(await screen.findByDisplayValue("Hidróxido de Sódio")).toBeDefined()
      expect(screen.getByDisplayValue("PQ03")).toBeDefined()
      expect(screen.getByDisplayValue("1.53")).toBeDefined()

      fireEvent.change(screen.getByDisplayValue("Descrição antiga"), { target: { value: "Descrição nova" } })
      fireEvent.click(screen.getByRole("button", { name: /Salvar/ }))

      await waitFor(() => expect(navMock.router.push).toHaveBeenCalledWith("/cadastros/produtos-quimicos"))
      const call = findCall(fetchMock.calls, "/api/cadastros/produtos-quimicos/3", "PUT")
      expect(call).toBeDefined()
      expect(call?.body?.descricao).toBe("Descrição nova")
      expect(call?.body?.densidade).toBe(1.53)
      expect(call?.body?.ph).toBe(13)
    })

    it("exclui após confirmar e redireciona", async () => {
      navMock.setPathname("/cadastros/produtos-quimicos/3")
      navMock.setParams({ id: "3" })
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true)
      const fetchMock = createFetchMock(({ method, url }) => {
        if (method === "GET" && url === "/api/cadastros/produtos-quimicos/3") {
          return { json: { id: 3, codigo: "PQ03", nome: "Hidróxido de Sódio" } }
        }
        if (method === "DELETE" && url === "/api/cadastros/produtos-quimicos/3") {
          return { json: { ok: true } }
        }
        return { status: 404, json: { error: "Rota não mockada" } }
      })
      vi.stubGlobal("fetch", fetchMock.fn)

      renderPage(<ProdutoQuimicoFormPage />)

      await screen.findByDisplayValue("Hidróxido de Sódio")
      fireEvent.click(screen.getByRole("button", { name: /Excluir/ }))

      expect(confirmSpy).toHaveBeenCalledWith("Excluir este produto químico?")
      await waitFor(() => expect(navMock.router.push).toHaveBeenCalledWith("/cadastros/produtos-quimicos"))
      expect(findCall(fetchMock.calls, "/api/cadastros/produtos-quimicos/3", "DELETE")).toBeDefined()
    })
  })
})
