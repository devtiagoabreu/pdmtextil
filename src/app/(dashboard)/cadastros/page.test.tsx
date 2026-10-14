// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen } from "@testing-library/react"
import CadastrosPage from "./page"
import { renderPage, navMock } from "@/test/harness"

vi.mock("@/lib/info-content", () => ({ getInfoContent: vi.fn(() => ({ title: "Cadastros", description: "" })) }))

describe("CadastrosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navMock.reset()
    navMock.setPathname("/cadastros")
  })

  it("renderiza cards de cadastros", async () => {
    renderPage(<CadastrosPage />)
    expect(screen.getByText("Cadastros")).toBeInTheDocument()
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0)
  })
})
