// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import SobrePage from "./page"

describe("SobrePage", () => {
  it("apresenta os criadores do PDM", () => {
    render(<SobrePage />)
    expect(screen.getByRole("heading", { name: /tiago de abreu/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /sérgio costa/i })).toBeInTheDocument()
  })

  it("tem chamada para acessar o sistema", () => {
    render(<SobrePage />)
    const links = screen.getAllByRole("link", { name: /acessar sistema/i })
    expect(links.some((link) => link.getAttribute("href") === "/login")).toBe(true)
  })

  it("lista os módulos e a seção do que o PDM faz", () => {
    render(<SobrePage />)
    expect(screen.getByRole("heading", { name: /o que o pdm faz por você/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /desenvolvimento de produtos/i })).toBeInTheDocument()
  })

  it("explica a relação com o ERP fabril", () => {
    render(<SobrePage />)
    expect(
      screen.getByRole("heading", { name: /o pdm e o seu erp fabril/i })
    ).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /^no pdm$/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /no seu erp/i })).toBeInTheDocument()
  })
})
