import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LinksEditor } from "./LinksEditor"

function setup(links: { url: string; descricao: string }[] = []) {
  const onChange = vi.fn()
  return { onChange, ...render(<LinksEditor links={links} onChange={onChange} />) }
}

describe("LinksEditor", () => {
  it("renders URL and description inputs", () => {
    setup()
    expect(screen.getByPlaceholderText("https://...")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Foto, laudo...")).toBeInTheDocument()
  })

  it("add button is disabled when URL is empty", () => {
    setup()
    const addButton = screen.getByRole("button", { name: "Adicionar link" })
    expect(addButton).toBeDisabled()
  })

  it("add button becomes enabled when URL is typed", async () => {
    setup()
    const urlInput = screen.getByPlaceholderText("https://...")
    await userEvent.type(urlInput, "https://example.com")
    const addButton = screen.getByRole("button", { name: "Adicionar link" })
    expect(addButton).toBeEnabled()
  })

  it("calls onChange with new link on add, then clears inputs", async () => {
    const { onChange } = setup()
    const urlInput = screen.getByPlaceholderText("https://...")
    const descInput = screen.getByPlaceholderText("Foto, laudo...")

    await userEvent.type(urlInput, "https://example.com")
    await userEvent.type(descInput, "Foto do produto")
    await userEvent.click(screen.getByRole("button", { name: "Adicionar link" }))

    expect(onChange).toHaveBeenCalledWith([
      { url: "https://example.com", descricao: "Foto do produto" },
    ])

    expect(screen.getByPlaceholderText("https://...")).toHaveValue("")
    expect(screen.getByPlaceholderText("Foto, laudo...")).toHaveValue("")
  })

  it("does not call onChange when adding empty URL", async () => {
    const { onChange } = setup()
    await userEvent.click(screen.getByRole("button", { name: "Adicionar link" }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it("renders existing links", () => {
    setup([
      { url: "https://example.com", descricao: "Exemplo" },
      { url: "https://test.com", descricao: "Teste" },
    ])
    expect(screen.getByText("Exemplo")).toBeInTheDocument()
    expect(screen.getByText("Teste")).toBeInTheDocument()
  })

  it("removes a link when trash button is clicked", async () => {
    const { onChange } = setup([
      { url: "https://a.com", descricao: "Link A" },
      { url: "https://b.com", descricao: "Link B" },
    ])

    const removeButtons = screen.getAllByRole("button", { name: /remover link/i })
    await userEvent.click(removeButtons[0])

    expect(onChange).toHaveBeenCalledWith([
      { url: "https://b.com", descricao: "Link B" },
    ])
  })

  it("does not render links list when empty", () => {
    setup()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("shows URL when descricao is empty", () => {
    setup([{ url: "https://example.com", descricao: "" }])
    expect(screen.getByText("https://example.com")).toBeInTheDocument()
  })
})
