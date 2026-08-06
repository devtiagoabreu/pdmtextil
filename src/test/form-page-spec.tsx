import { describe, it, expect, beforeEach, vi } from "vitest"
import type { ReactElement } from "react"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "./harness"
import type { MockFetchHandler } from "./harness"

export interface FormPageSpecConfig {
  title: string
  component: ReactElement
  /** Ex: "fornecedores" → POST /api/cadastros/fornecedores, PUT/GET /api/cadastros/fornecedores/:id */
  apiBase: string
  listHref: string
  headingNew: string
  headingEdit: string
  submitNewLabel?: string
  submitEditLabel?: string
  validationToast: string
  successToastNew: string
  successToastEdit: string
  editId: number
  editData: any
  /** Valor único presente no form carregado na edição */
  editDisplayValue: string
  /** Campos obrigatórios preenchidos no fluxo de criação (via placeholder) */
  createFields: { placeholder: string; value: string }[]
  /** Asserts adicionais no body do POST (ex: campos calculados) */
  createBodyAssert?: (body: any) => void
  /** Handler extra para páginas com mais fetches (fios, bases-urdume) */
  handler?: MockFetchHandler
}

export function formPageSpec(cfg: FormPageSpecConfig) {
  const submitNewLabel = cfg.submitNewLabel ?? "Criar"
  const submitEditLabel = cfg.submitEditLabel ?? "Atualizar"
  describe(cfg.title, () => {
    let fetchMock: ReturnType<typeof createFetchMock>

    beforeEach(() => {
      const handler: MockFetchHandler = ({ method, url }) => {
        if (method === "GET" && url === `/api/cadastros/${cfg.apiBase}/${cfg.editId}`) {
          return { json: cfg.editData }
        }
        if (method === "POST" && url === `/api/cadastros/${cfg.apiBase}`) {
          return { status: 201, json: { id: 99 } }
        }
        if (method === "PUT" && url === `/api/cadastros/${cfg.apiBase}/${cfg.editId}`) {
          return { json: { ok: true } }
        }
        if (cfg.handler) return cfg.handler({ method, url })
        return { status: 404, json: { error: "Rota não mockada" } }
      }
      fetchMock = createFetchMock(handler)
      vi.stubGlobal("fetch", fetchMock.fn)
    })

    describe("novo", () => {
      beforeEach(() => {
        navMock.setPathname(`/cadastros/${cfg.apiBase}/novo`)
        navMock.setParams({ id: "novo" })
      })

      it("renderiza o formulário de criação", () => {
        renderPage(cfg.component)
        expect(screen.getByRole("heading", { name: cfg.headingNew })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: submitNewLabel })).toBeInTheDocument()
      })

      it("valida os campos obrigatórios antes de salvar", async () => {
        const ui = renderPage(cfg.component)
        fireEvent.submit(ui.container.querySelector("form")!)

        await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith(cfg.validationToast))
        expect(findCall(fetchMock.calls, `/api/cadastros/${cfg.apiBase}`, "POST")).toBeUndefined()
      })

      it("cria via POST e redireciona", async () => {
        renderPage(cfg.component)
        for (const field of cfg.createFields) {
          fireEvent.change(screen.getByPlaceholderText(field.placeholder), {
            target: { value: field.value },
          })
        }
        fireEvent.click(screen.getByRole("button", { name: submitNewLabel }))

        await waitFor(() => {
          const call = findCall(fetchMock.calls, `/api/cadastros/${cfg.apiBase}`, "POST")
          expect(call).toBeDefined()
          if (cfg.createBodyAssert) cfg.createBodyAssert(call!.body)
        })
        await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith(cfg.successToastNew))
        expect(navMock.router.push).toHaveBeenCalledWith(cfg.listHref)
      })
    })

    describe("edição", () => {
      beforeEach(() => {
        navMock.setPathname(`/cadastros/${cfg.apiBase}/${cfg.editId}`)
        navMock.setParams({ id: String(cfg.editId) })
      })

      it("carrega os dados e salva via PUT", async () => {
        renderPage(cfg.component)
        const heading = await screen.findByRole("heading", { name: cfg.headingEdit })
        expect(heading).toBeInTheDocument()
        await screen.findByDisplayValue(cfg.editDisplayValue)

        fireEvent.click(screen.getByRole("button", { name: submitEditLabel }))

        await waitFor(() => {
          const call = findCall(fetchMock.calls, `/api/cadastros/${cfg.apiBase}/${cfg.editId}`, "PUT")
          expect(call).toBeDefined()
          expect(call!.body.id).toBe(cfg.editId)
        })
        await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith(cfg.successToastEdit))
        expect(navMock.router.push).toHaveBeenCalledWith(cfg.listHref)
      })
    })
  })
}
