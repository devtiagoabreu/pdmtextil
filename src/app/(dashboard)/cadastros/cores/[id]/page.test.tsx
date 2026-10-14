// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen } from "@testing-library/react"
import Page from "./page"
import { renderPage, navMock } from "@/test/harness"

vi.mock("@/lib/info-content", () => ({
  getInfoContent: vi.fn(() => ({ title: "Cadastro", description: "" })),
}))

describe("CorFormPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navMock.reset()
    vi.stubGlobal("alert", vi.fn())
    vi.stubGlobal("confirm", vi.fn(() => true))
  })

  it("renderiza em modo novo", async () => {
    navMock.setParams({ id: "novo" })
    renderPage(<Page />)
    expect(await screen.findByRole("heading", { name: /Nova Cor Sólida/ })).toBeInTheDocument()
  })
})
