import { describe, it, expect, beforeEach, vi } from "vitest"
import type { ReactElement } from "react"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import { createFetchMock, renderPage, findCall, toastMock } from "./harness"
import type { MockFetchHandler } from "./harness"

export interface ListPageSpecConfig {
  title: string
  component: ReactElement
  /** Ex: "fornecedores" → GET /api/cadastros/fornecedores, DELETE /api/cadastros/fornecedores/:id */
  apiBase: string
  heading: string
  searchPlaceholder: string
  emptyText: string
  newLinkText: string
  newHref: string
  editHref: (item: any) => string
  primaryField?: string
  data: any[]
  blockedId: number
  successToast: string
  /** Termo singular usado no título do modal de exclusão: "Excluir {deleteSingular}?" */
  deleteSingular: string
  /** Consulta que casa apenas com o primeiro item */
  matchQuery: string
  /** Nome exibido do primeiro item (para localizar a linha) */
  firstItemText: string
  /** Nome exibido do segundo item (opcional, para validar ocultação na busca) */
  secondItemText?: string
  handler?: MockFetchHandler
}

export function listPageSpec(cfg: ListPageSpecConfig) {
  describe(cfg.title, () => {
    let fetchMock: ReturnType<typeof createFetchMock>
    const primary = cfg.primaryField ?? "nome"

    beforeEach(() => {
      const handler: MockFetchHandler =
        cfg.handler ??
        (({ method, url }) => {
          if (method === "GET" && url === `/api/cadastros/${cfg.apiBase}`) return { json: cfg.data }
          if (method === "DELETE") {
            if (url.endsWith(`/${cfg.blockedId}`)) {
              return { status: 400, json: { error: "fk", fkError: true } }
            }
            return { json: { ok: true } }
          }
          return { status: 404, json: { error: "Rota não mockada" } }
        })
      fetchMock = createFetchMock(handler)
      vi.stubGlobal("fetch", fetchMock.fn)
    })

    it("renderiza a lista com dados e status", async () => {
      renderPage(cfg.component)
      expect(screen.getByRole("heading", { name: cfg.heading })).toBeInTheDocument()
      for (const item of cfg.data) {
        expect(await screen.findByText(item[primary])).toBeInTheDocument()
      }
      expect(screen.getAllByText("Ativo", { selector: "span" })).toHaveLength(
        cfg.data.filter((d) => d.ativo).length,
      )
      expect(screen.getAllByText("Inativo", { selector: "span" })).toHaveLength(
        cfg.data.filter((d) => !d.ativo).length,
      )
    })

    it("filtra pela busca", async () => {
      renderPage(cfg.component)
      await screen.findByText(cfg.firstItemText)

      const search = screen.getByPlaceholderText(cfg.searchPlaceholder)
      fireEvent.change(search, { target: { value: cfg.matchQuery } })
      expect(screen.getByText(cfg.firstItemText)).toBeInTheDocument()
      if (cfg.secondItemText) {
        expect(screen.queryByText(cfg.secondItemText)).not.toBeInTheDocument()
      }

      fireEvent.change(search, { target: { value: "zzz-inexistente" } })
      expect(screen.queryByText(cfg.firstItemText)).not.toBeInTheDocument()
      expect(screen.getByText(cfg.emptyText)).toBeInTheDocument()
    })

    it("mostra estado vazio quando a API retorna vazio", async () => {
      const empty = createFetchMock(() => ({ json: [] }))
      vi.stubGlobal("fetch", empty.fn)
      renderPage(cfg.component)
      expect(await screen.findByText(cfg.emptyText)).toBeInTheDocument()
    })

    it("exclui um registro após confirmar no modal", async () => {
      renderPage(cfg.component)
      await screen.findByText(cfg.firstItemText)

      const row = screen.getByText(cfg.firstItemText).closest("tr")!
      const trash = within(row).getAllByRole("button").find((b) => !b.closest("a"))!
      fireEvent.click(trash)

      const dialog = screen.getByRole("dialog", { name: `Excluir ${cfg.deleteSingular}?` })
      fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

      await waitFor(() =>
        expect(findCall(fetchMock.calls, `/api/cadastros/${cfg.apiBase}/${cfg.data[0].id}`, "DELETE")).toBeDefined(),
      )
      await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith(cfg.successToast))
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("bloqueia exclusão quando há vínculos (fkError)", async () => {
      renderPage(cfg.component)
      const blocked = cfg.data.find((d) => d.id === cfg.blockedId)!
      await screen.findByText(blocked[primary])

      const row = screen.getByText(blocked[primary]).closest("tr")!
      const trash = within(row).getAllByRole("button").find((b) => !b.closest("a"))!
      fireEvent.click(trash)

      fireEvent.click(screen.getByRole("button", { name: "Excluir" }))
      await waitFor(() =>
        expect(findCall(fetchMock.calls, `/api/cadastros/${cfg.apiBase}/${cfg.blockedId}`, "DELETE")).toBeDefined(),
      )
      const blockedDialog = await screen.findByRole("dialog", { name: "Exclusão não permitida" })
      expect(blockedDialog).toHaveTextContent(/não pode ser exclu/)

      fireEvent.click(within(blockedDialog).getByRole("button", { name: "OK" }))
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("contém links de novo e edição", async () => {
      renderPage(cfg.component)
      await screen.findByText(cfg.firstItemText)

      expect(screen.getByRole("link", { name: cfg.newLinkText })).toHaveAttribute("href", cfg.newHref)
      expect(screen.getByText(cfg.firstItemText).closest("a")).toHaveAttribute("href", cfg.editHref(cfg.data[0]))
    })
  })
}
