// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import ProcessoSubprocessoFormPage from "./page"
import { createFetchMock, findCall, navMock, renderPage, toastMock } from "@/test/harness"

describe("ProcessoSubprocessoFormPage", () => {
  describe("novo", () => {
    it("valida processo obrigatório e salva via POST", async () => {
      navMock.setPathname("/processos/subprocessos/novo")
      navMock.setParams({ id: "novo" })
      const fetchMock = createFetchMock(({ method, url }) => {
        if (method === "GET" && url === "/api/processos/processos") {
          return { json: [{ id: 1, nome: "Processo de Tecelagem" }] }
        }
        if (method === "POST" && url === "/api/processos/subprocessos") {
          return { status: 201, json: { id: 9 } }
        }
        return { status: 404, json: { error: "Rota não mockada" } }
      })
      vi.stubGlobal("fetch", fetchMock.fn)

      const ui = renderPage(<ProcessoSubprocessoFormPage />)
      const form = ui.container.querySelector("form")!
      fireEvent.submit(form)
      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Nome é obrigatório"))

      fireEvent.change(screen.getByPlaceholderText("Preparação dos fios"), { target: { value: "Preparação" } })
      fireEvent.submit(form)
      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Selecione o processo"))
      expect(findCall(fetchMock.calls, "/api/processos/subprocessos", "POST")).toBeUndefined()

      await screen.findByRole("option", { name: "Processo de Tecelagem" })
      fireEvent.change(screen.getByRole("combobox", { name: "Processo *" }), { target: { value: "1" } })
      fireEvent.change(screen.getByPlaceholderText("1"), { target: { value: "2" } })
      fireEvent.submit(form)

      await waitFor(() => {
        const call = findCall(fetchMock.calls, "/api/processos/subprocessos", "POST")
        expect(call).toBeDefined()
        expect(call?.body?.processoId).toBe(1)
        expect(call?.body?.nome).toBe("Preparação")
        expect(call?.body?.ordem).toBe(2)
      })
      expect(navMock.router.push).toHaveBeenCalledWith("/processos/processos/1")
    })

    it("pré-seleciona processo via ?processoId=", async () => {
      navMock.setPathname("/processos/subprocessos/novo")
      navMock.setParams({ id: "novo" })
      navMock.setSearchParams({ processoId: "3" })
      const fetchMock = createFetchMock(({ method, url }) => {
        if (method === "GET" && url === "/api/processos/processos") {
          return { json: [{ id: 3, nome: "Processo X" }] }
        }
        return { status: 404, json: { error: "Rota não mockada" } }
      })
      vi.stubGlobal("fetch", fetchMock.fn)

      renderPage(<ProcessoSubprocessoFormPage />)

      await screen.findByRole("option", { name: "Processo X" })
      expect((screen.getByRole("combobox", { name: "Processo *" }) as HTMLSelectElement).value).toBe("3")
    })
  })

  describe("edição", () => {
    it("carrega dados, salva via PUT e volta ao processo", async () => {
      navMock.setPathname("/processos/subprocessos/3")
      navMock.setParams({ id: "3" })
      const fetchMock = createFetchMock(({ method, url }) => {
        if (method === "GET" && url === "/api/processos/processos") {
          return { json: [{ id: 1, nome: "Processo de Tecelagem" }] }
        }
        if (method === "GET" && url === "/api/processos/subprocessos/3") {
          return {
            json: {
              id: 3,
              processoId: 1,
              nome: "Preparação",
              descricao: "Preparação dos fios",
              ordem: 1,
              ativo: true,
            },
          }
        }
        if (method === "PUT" && url === "/api/processos/subprocessos/3") {
          return { json: { ok: true } }
        }
        return { status: 404, json: { error: "Rota não mockada" } }
      })
      vi.stubGlobal("fetch", fetchMock.fn)

      renderPage(<ProcessoSubprocessoFormPage />)

      expect(await screen.findByDisplayValue("Preparação")).toBeDefined()
      expect((screen.getByRole("combobox", { name: "Processo *" }) as HTMLSelectElement).value).toBe("1")

      fireEvent.change(screen.getByDisplayValue("Preparação dos fios"), { target: { value: "Preparação avançada" } })
      fireEvent.click(screen.getByRole("button", { name: /Atualizar/ }))

      await waitFor(() => {
        const call = findCall(fetchMock.calls, "/api/processos/subprocessos/3", "PUT")
        expect(call).toBeDefined()
        expect(call?.body?.descricao).toBe("Preparação avançada")
      })
      expect(navMock.router.push).toHaveBeenCalledWith("/processos/processos/1")
    })
  })
})