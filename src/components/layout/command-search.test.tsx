// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { CommandSearch } from "./command-search"

const { sessionMock } = vi.hoisted(() => ({
  sessionMock: { data: { user: { role: "ADMIN" as string } } },
}))

vi.mock("next-auth/react", () => ({
  useSession: () => sessionMock,
}))

import { searchItems } from "@/lib/search-registry"

function digita(query: string) {
  fireEvent.change(screen.getByRole("combobox"), { target: { value: query } })
}

describe("CommandSearch", () => {
  beforeEach(() => {
    sessionMock.data.user.role = "ADMIN"
  })

  it("não exibe rotinas de detalhe ([id]) em nenhuma busca", () => {
    sessionMock.data.user.role = "ADMIN"
    render(<CommandSearch />)
    digita("produto")
    expect(screen.queryByText(/Detalhe/)).not.toBeInTheDocument()
    expect(screen.getAllByRole("option").length).toBeGreaterThan(0)
  })

  it("esconde páginas administrativas para usuário não-admin", () => {
    sessionMock.data.user.role = "CRM"
    render(<CommandSearch />)
    digita("usuario")
    expect(screen.queryByText("Usuários")).not.toBeInTheDocument()
    expect(screen.queryByText("Usuário (Detalhe)")).not.toBeInTheDocument()
  })

  it("mostra páginas administrativas para admin", () => {
    sessionMock.data.user.role = "ADMIN"
    render(<CommandSearch />)
    digita("usuario")
    expect(screen.getByText("Usuários")).toBeInTheDocument()
  })

  it("não abre o painel com menos de 2 caracteres", () => {
    render(<CommandSearch />)
    digita("a")
    expect(screen.queryAllByRole("option")).toHaveLength(0)
  })

  it("searchItems filtra rotas de detalhe do registry", () => {
    const results = searchItems("detalhe")
    expect(results.every((r) => !r.href.includes("[") && !r.href.includes("]"))).toBe(true)
  })
})