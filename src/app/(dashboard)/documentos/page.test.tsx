// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { screen } from "@testing-library/react"
import DocumentosPage from "./page"
import { renderPage } from "@/test/harness"

describe("DocumentosPage", () => {
  it("renderiza o heading e os módulos de documentos", () => {
    renderPage(<DocumentosPage />)
    expect(screen.getByRole("heading", { name: "Documentos" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Romaneios/ })).toHaveAttribute("href", "/documentos/romaneios")
    expect(screen.getByText("Pré-DANFE")).toBeInTheDocument()
    expect(screen.getByText("Pedidos de Venda")).toBeInTheDocument()
  })

  it("marca os módulos indisponíveis com o selo Em breve", () => {
    renderPage(<DocumentosPage />)
    expect(screen.getAllByText("Em breve").length).toBe(4)
  })

  it("não cria link para módulos indisponíveis", () => {
    renderPage(<DocumentosPage />)
    expect(screen.queryByRole("link", { name: /Pré-DANFE/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Pedidos de Venda/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Relatórios/ })).not.toBeInTheDocument()
  })
})
