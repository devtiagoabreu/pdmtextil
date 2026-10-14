// @vitest-environment jsdom
import { describe, it, expect, beforeAll, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import LandingPage from "./page"

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () => null
  ) as unknown as typeof HTMLCanvasElement.prototype.getContext
})

describe("LandingPage", () => {
  it("oferece os botões de Login e Sobre", () => {
    render(<LandingPage />)
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login")
    const sobre = screen.getAllByRole("link", { name: /sobre/i })
    expect(sobre.some((link) => link.getAttribute("href") === "/sobre")).toBe(true)
  })

  it("mostra o título e a proposta de integração", () => {
    render(<LandingPage />)
    expect(screen.getByRole("heading", { name: "PDM·PRO·TÊXTIL" })).toBeInTheDocument()
    expect(
      screen.getByText(/integração entre as ferramentas que você já usa e as tecnologias atuais/i)
    ).toBeInTheDocument()
  })

  it("não traz o conteúdo da página Sobre", () => {
    render(<LandingPage />)
    expect(
      screen.queryByRole("heading", { name: /o que é o pdm pro têxtil/i })
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/quem criou o pdm/i)).not.toBeInTheDocument()
  })
})
