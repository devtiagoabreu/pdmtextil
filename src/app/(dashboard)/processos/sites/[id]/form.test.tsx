// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import ProcessoSiteFormPage from "./page"
import { createFetchMock, findCall, navMock, renderPage, toastMock } from "@/test/harness"

describe("ProcessoSiteFormPage", () => {
  describe("novo", () => {
    it("valida empresa obrigatória e salva via POST", async () => {
      navMock.setPathname("/processos/sites/novo")
      navMock.setParams({ id: "novo" })
      const fetchMock = createFetchMock(({ method, url }) => {
        if (method === "GET" && url === "/api/processos/empresas") {
          return { json: [{ id: 1, nome: "PDM Têxtil" }] }
        }
        if (method === "POST" && url === "/api/processos/sites") {
          return { status: 201, json: { id: 9 } }
        }
        return { status: 404, json: { error: "Rota não mockada" } }
      })
      vi.stubGlobal("fetch", fetchMock.fn)

      const ui = renderPage(<ProcessoSiteFormPage />)
      const form = ui.container.querySelector("form")!
      fireEvent.submit(form)
      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Nome é obrigatório"))
      expect(findCall(fetchMock.calls, "/api/processos/sites", "POST")).toBeUndefined()

      fireEvent.change(screen.getByPlaceholderText("Unidade PDM Têxtil"), { target: { value: "Unidade Blumenau" } })
      fireEvent.submit(form)
      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Selecione a empresa"))
      expect(findCall(fetchMock.calls, "/api/processos/sites", "POST")).toBeUndefined()

      fireEvent.change(screen.getByRole("combobox", { name: "Empresa *" }), { target: { value: "1" } })
      fireEvent.change(screen.getByPlaceholderText("Unidade PDM Têxtil"), { target: { value: "Unidade Blumenau" } })
      fireEvent.submit(form)

      await waitFor(() => {
        const call = findCall(fetchMock.calls, "/api/processos/sites", "POST")
        expect(call).toBeDefined()
        expect(call?.body?.empresaId).toBe(1)
        expect(call?.body?.nome).toBe("Unidade Blumenau")
        expect(call?.body?.ativo).toBe(true)
      })
      expect(navMock.router.push).toHaveBeenCalledWith("/processos/sites")
    })
  })

  describe("edição", () => {
    it("carrega dados, salva via PUT e redireciona", async () => {
      navMock.setPathname("/processos/sites/3")
      navMock.setParams({ id: "3" })
      const fetchMock = createFetchMock(({ method, url }) => {
        if (method === "GET" && url === "/api/processos/empresas") {
          return { json: [{ id: 1, nome: "PDM Têxtil" }] }
        }
        if (method === "GET" && url === "/api/processos/sites/3") {
          return {
            json: {
              id: 3,
              empresaId: 1,
              nome: "Unidade Blumenau",
              sigla: "SBLU",
              cep: "89000-000",
              endereco: "Rua das Fábricas, 100",
              cidade: "Blumenau",
              uf: "SC",
              ativo: true,
            },
          }
        }
        if (method === "PUT" && url === "/api/processos/sites/3") {
          return { json: { ok: true } }
        }
        return { status: 404, json: { error: "Rota não mockada" } }
      })
      vi.stubGlobal("fetch", fetchMock.fn)

      renderPage(<ProcessoSiteFormPage />)

      expect(await screen.findByDisplayValue("Unidade Blumenau")).toBeDefined()
      expect((screen.getByRole("combobox", { name: "Empresa *" }) as HTMLSelectElement).value).toBe("1")

      fireEvent.change(screen.getByDisplayValue("Unidade Blumenau"), { target: { value: "Unidade Blumenau 2" } })
      fireEvent.click(screen.getByRole("button", { name: /Atualizar/ }))

      await waitFor(() => expect(navMock.router.push).toHaveBeenCalledWith("/processos/sites"))
      const call = findCall(fetchMock.calls, "/api/processos/sites/3", "PUT")
      expect(call).toBeDefined()
      expect(call?.body?.nome).toBe("Unidade Blumenau 2")
      expect(call?.body?.empresaId).toBe(1)
    })
  })
})