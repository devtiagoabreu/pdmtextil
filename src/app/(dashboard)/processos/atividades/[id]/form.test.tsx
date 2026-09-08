// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import ProcessoAtividadeFormPage from "./page"
import { createFetchMock, findCall, navMock, renderPage, toastMock } from "@/test/harness"

describe("ProcessoAtividadeFormPage", () => {
  describe("novo", () => {
    it("valida subprocesso obrigatório e salva via POST", async () => {
      navMock.setPathname("/processos/atividades/novo")
      navMock.setParams({ id: "novo" })
      const fetchMock = createFetchMock(({ method, url }) => {
        if (method === "GET" && url === "/api/processos/subprocessos") {
          return { json: [{ id: 1, nome: "Preparação" }] }
        }
        if (method === "POST" && url === "/api/processos/atividades") {
          return { status: 201, json: { id: 9 } }
        }
        return { status: 404, json: { error: "Rota não mockada" } }
      })
      vi.stubGlobal("fetch", fetchMock.fn)

      const ui = renderPage(<ProcessoAtividadeFormPage />)
      const form = ui.container.querySelector("form")!
      fireEvent.submit(form)
      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Nome é obrigatório"))

      fireEvent.change(screen.getByPlaceholderText("Encarar materiais"), { target: { value: "Encaramento" } })
      fireEvent.submit(form)
      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Selecione o subprocesso"))
      expect(findCall(fetchMock.calls, "/api/processos/atividades", "POST")).toBeUndefined()

      await screen.findByRole("option", { name: "Preparação" })
      fireEvent.change(screen.getByRole("combobox", { name: "Subprocesso *" }), { target: { value: "1" } })
      fireEvent.change(screen.getByRole("combobox", { name: "Tipo" }), { target: { value: "AUTOMATICA" } })
      fireEvent.submit(form)

      await waitFor(() => {
        const call = findCall(fetchMock.calls, "/api/processos/atividades", "POST")
        expect(call).toBeDefined()
        expect(call?.body?.subprocessoId).toBe(1)
        expect(call?.body?.nome).toBe("Encaramento")
        expect(call?.body?.tipo).toBe("AUTOMATICA")
      })
      expect(navMock.router.push).toHaveBeenCalledWith("/processos/atividades")
    })
  })

  describe("edição", () => {
    it("carrega dados e salva via PUT", async () => {
      navMock.setPathname("/processos/atividades/3")
      navMock.setParams({ id: "3" })
      const fetchMock = createFetchMock(({ method, url }) => {
        if (method === "GET" && url === "/api/processos/subprocessos") {
          return { json: [{ id: 1, nome: "Preparação" }] }
        }
        if (method === "GET" && url === "/api/processos/atividades/3") {
          return {
            json: {
              id: 3,
              subprocessoId: 1,
              nome: "Encaramento",
              tipo: "MANUAL",
              responsavel: "João",
              ordem: 1,
              observacoes: "",
              ativo: true,
            },
          }
        }
        if (method === "PUT" && url === "/api/processos/atividades/3") {
          return { json: { ok: true } }
        }
        return { status: 404, json: { error: "Rota não mockada" } }
      })
      vi.stubGlobal("fetch", fetchMock.fn)

      renderPage(<ProcessoAtividadeFormPage />)

      expect(await screen.findByDisplayValue("Encaramento")).toBeDefined()
      expect((screen.getByRole("combobox", { name: "Subprocesso *" }) as HTMLSelectElement).value).toBe("1")

      fireEvent.change(screen.getByDisplayValue("João"), { target: { value: "Maria" } })
      fireEvent.click(screen.getByRole("button", { name: /Atualizar/ }))

      await waitFor(() => {
        const call = findCall(fetchMock.calls, "/api/processos/atividades/3", "PUT")
        expect(call).toBeDefined()
        expect(call?.body?.responsavel).toBe("Maria")
        expect(call?.body?.tipo).toBe("MANUAL")
      })
      expect(navMock.router.push).toHaveBeenCalledWith("/processos/atividades")
    })
  })
})