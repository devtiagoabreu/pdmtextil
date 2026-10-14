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

  it("apresenta o app em linguagem simples", () => {
    render(<LandingPage />)
    expect(
      screen.getByRole("heading", { name: /o que é o pdm pro têxtil/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/organiza todo o trabalho da sua fábrica de tecidos/i)).toBeInTheDocument()
  })

  it("cita os criadores do PDM", () => {
    render(<LandingPage />)
    expect(screen.getByText(/tiago de abreu e sérgio costa/i)).toBeInTheDocument()
  })
})
