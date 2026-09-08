// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import ProcessoAreaFormPage from "./page"
import { createFetchMock, findCall, navMock, renderPage, toastMock } from "@/test/harness"

describe("ProcessoAreaFormPage", () => {
  describe("novo", () => {
    it("valida site obrigatório e salva via POST", async () => {
      navMock.setPathname("/processos/areas/novo")
      navMock.setParams({ id: "novo" })
      const fetchMock = createFetchMock(({ method, url }) => {
        if (method === "GET" && url === "/api/processos/sites") {
          return { json: [{ id: 1, nome: "Unidade Blumenau" }] }
        }
        if (method === "POST" && url === "/api/processos/areas") {
          return { status: 201, json: { id: 9 } }
        }
        return { status: 404, json: { error: "Rota não mockada" } }
      })
      vi.stubGlobal("fetch", fetchMock.fn)

      const ui = renderPage(<ProcessoAreaFormPage />)
      const form = ui.container.querySelector("form")!
      fireEvent.submit(form)
      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Nome é obrigatório"))
      expect(findCall(fetchMock.calls, "/api/processos/areas", "POST")).toBeUndefined()

      fireEvent.change(screen.getByPlaceholderText("Produção / Tecelagem"), { target: { value: "Produção" } })
      fireEvent.submit(form)
      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Selecione o site"))
      expect(findCall(fetchMock.calls, "/api/processos/areas", "POST")).toBeUndefined()

      fireEvent.change(screen.getByRole("combobox", { name: "Site *" }), { target: { value: "1" } })
      fireEvent.change(screen.getByPlaceholderText("Produção / Tecelagem"), { target: { value: "Produção" } })
      fireEvent.submit(form)

      await waitFor(() => {
        const call = findCall(fetchMock.calls, "/api/processos/areas", "POST")
        expect(call).toBeDefined()
        expect(call?.body?.siteId).toBe(1)
        expect(call?.body?.nome).toBe("Produção")
        expect(call?.body?.ativo).toBe(true)
      })
      expect(navMock.router.push).toHaveBeenCalledWith("/processos/areas")
    })
  })

  describe("edição", () => {
    it("carrega dados, salva via PUT e redireciona", async () => {
      navMock.setPathname("/processos/areas/3")
      navMock.setParams({ id: "3" })
      const fetchMock = createFetchMock(({ method, url }) => {
        if (method === "GET" && url === "/api/processos/sites") {
          return { json: [{ id: 1, nome: "Unidade Blumenau" }] }
        }
        if (method === "GET" && url === "/api/processos/areas/3") {
          return {
            json: {
              id: 3,
              siteId: 1,
              nome: "Produção",
              descricao: "Linha de produção principal",
              ativo: true,
            },
          }
        }
        if (method === "PUT" && url === "/api/processos/areas/3") {
          return { json: { ok: true } }
        }
        return { status: 404, json: { error: "Rota não mockada" } }
      })
      vi.stubGlobal("fetch", fetchMock.fn)

      renderPage(<ProcessoAreaFormPage />)

      expect(await screen.findByDisplayValue("Produção")).toBeDefined()
      expect((screen.getByRole("combobox", { name: "Site *" }) as HTMLSelectElement).value).toBe("1")

      fireEvent.change(screen.getByDisplayValue("Linha de produção principal"), { target: { value: "Linha nova" } })
      fireEvent.click(screen.getByRole("button", { name: /Atualizar/ }))

      await waitFor(() => expect(navMock.router.push).toHaveBeenCalledWith("/processos/areas"))
      const call = findCall(fetchMock.calls, "/api/processos/areas/3", "PUT")
      expect(call).toBeDefined()
      expect(call?.body?.descricao).toBe("Linha nova")
    })
  })
})