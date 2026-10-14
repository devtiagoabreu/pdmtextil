// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen } from "@testing-library/react"
import Page from "./page"
import { createFetchMock, navMock, renderPage } from "@/test/harness"

vi.mock("@/lib/info-content", () => ({
  getInfoContent: vi.fn(() => ({ title: "Cadastro", description: "" })),
}))

const listasVazias = createFetchMock(() => ({ status: 200, json: [] }))

describe("FioFormPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navMock.reset()
    vi.stubGlobal("fetch", listasVazias.fn)
    vi.stubGlobal("alert", vi.fn())
    vi.stubGlobal("confirm", vi.fn(() => true))
  })

  it("renderiza em modo novo", async () => {
    navMock.setParams({ id: "novo" })
    renderPage(<Page />)
    expect(await screen.findByRole("heading", { name: /Novo Fio/ })).toBeInTheDocument()
  })
})
