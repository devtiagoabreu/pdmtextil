import { describe, it, expect, beforeEach, vi } from "vitest"
import type { ReactElement } from "react"
import { screen, fireEvent } from "@testing-library/react"
import { createFetchMock, renderPage } from "./harness"
import type { MockFetchHandler } from "./harness"

export interface ListSmokeSpecConfig {
  title: string
  component: ReactElement
  /** URL exata do GET da lista (ex: "/api/clientes") */
  apiUrl: string
  heading: string
  emptyText: string
  searchPlaceholder?: string
  newLinkText?: string
  newHref?: string
  editHref?: (item: any) => string
  /** Texto do link de edição quando ele não envolve o nome do item (ex: "Editar") */
  editLinkText?: string
  primaryField: string
  data: any[]
  /** Texto exibido do primeiro item (para localizar a linha/card) */
  firstItemText: string
  /** Texto exibido do segundo item (para validar ocultação na busca) */
  secondItemText?: string
  /** Consulta que casa apenas com o primeiro item */
  matchQuery?: string
  handler?: MockFetchHandler
}

/**
 * Smoke test configurável para páginas de lista fora do padrão de cadastros
 * (cards grid, tabelas sem modal de exclusão, etc.). Cobre: render com dados,
 * busca, estado vazio e links novo/edição.
 */
export function listSmokeSpec(cfg: ListSmokeSpecConfig) {
  describe(cfg.title, () => {
    let fetchMock: ReturnType<typeof createFetchMock>

    beforeEach(() => {
      const handler: MockFetchHandler =
        cfg.handler ??
        (({ method, url }) => {
          if (method === "GET" && url === cfg.apiUrl) return { json: cfg.data }
          return { status: 404, json: { error: "Rota não mockada" } }
        })
      fetchMock = createFetchMock(handler)
      vi.stubGlobal("fetch", fetchMock.fn)
    })

    it("renderiza a lista com dados e heading", async () => {
      renderPage(cfg.component)
      expect(screen.getByRole("heading", { name: cfg.heading })).toBeInTheDocument()
      for (const item of cfg.data) {
        expect(await screen.findByText(item[cfg.primaryField])).toBeInTheDocument()
      }
    })

    it("mostra estado vazio quando a API retorna vazio", async () => {
      const empty = createFetchMock(() => ({ json: [] }))
      vi.stubGlobal("fetch", empty.fn)
      renderPage(cfg.component)
      expect(await screen.findByText(cfg.emptyText)).toBeInTheDocument()
    })

    const searchPlaceholder = cfg.searchPlaceholder
    const matchQuery = cfg.matchQuery
    if (searchPlaceholder && matchQuery) {
      it("filtra pela busca", async () => {
        renderPage(cfg.component)
        await screen.findByText(cfg.firstItemText)

        const search = screen.getByPlaceholderText(searchPlaceholder)
        fireEvent.change(search, { target: { value: matchQuery } })
        expect(screen.getByText(cfg.firstItemText)).toBeInTheDocument()
        if (cfg.secondItemText) {
          expect(screen.queryByText(cfg.secondItemText)).not.toBeInTheDocument()
        }

        fireEvent.change(search, { target: { value: "zzz-inexistente" } })
        expect(screen.queryByText(cfg.firstItemText)).not.toBeInTheDocument()
        expect(screen.getByText(cfg.emptyText)).toBeInTheDocument()
      })
    }

    it("contém link de novo registro", async () => {
      if (!cfg.newLinkText || !cfg.newHref) return
      renderPage(cfg.component)
      await screen.findByText(cfg.firstItemText)
      expect(screen.getByRole("link", { name: cfg.newLinkText })).toHaveAttribute("href", cfg.newHref)
    })

    it("contém link de edição por item", async () => {
      if (!cfg.editHref) return
      renderPage(cfg.component)
      await screen.findByText(cfg.firstItemText)
      const expected = cfg.editHref(cfg.data[0])
      if (cfg.editLinkText) {
        const links = screen.getAllByRole("link", { name: cfg.editLinkText })
        expect(links.some((l) => l.getAttribute("href") === expected)).toBe(true)
      } else {
        expect(screen.getByText(cfg.firstItemText).closest("a")).toHaveAttribute("href", expected)
      }
    })
  })
}
