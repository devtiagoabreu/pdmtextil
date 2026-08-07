// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { screen } from "@testing-library/react"
import ConfiguracoesHubPage from "./page"
import { renderPage } from "@/test/harness"

describe("ConfiguracoesHubPage", () => {
  it("renderiza o heading e os links dos módulos", () => {
    renderPage(<ConfiguracoesHubPage />)

    expect(screen.getByRole("heading", { name: "Configurações" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Banco de Dados/ })).toHaveAttribute("href", "/admin/configuracoes/banco-dados")
    expect(screen.getByRole("link", { name: /Usuários/ })).toHaveAttribute("href", "/admin/usuarios")
    expect(screen.getByRole("link", { name: /Chaves de IA/ })).toHaveAttribute("href", "/admin/configuracoes/ai")
    expect(screen.getByRole("link", { name: /Notificações/ })).toHaveAttribute("href", "/admin/notificacoes")
  })
})
