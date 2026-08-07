// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { renderPage } from "@/test/harness"
import RelatoriosHubPage from "./page"

describe("RelatoriosHubPage", () => {
  it("renderiza o heading e os links dos relatórios", () => {
    renderPage(<RelatoriosHubPage />)
    expect(screen.getByRole("heading", { name: /Relatórios/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Atividade por Usuário/ })).toHaveAttribute("href", "/dashboard/relatorios/atividade-usuario")
  })
})
