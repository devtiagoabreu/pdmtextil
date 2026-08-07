// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, routeJson } from "@/test/harness"
import BiPage from "./page"

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { name: "Admin" } }),
}))

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}))

describe("BiPage", () => {
  it("renderiza o heading", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/bi/config": { ttlMinutos: 30 },
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    const element = await BiPage()
    renderPage(element)
    expect(await screen.findByRole("heading", { name: /BI - Business Intelligence/ })).toBeInTheDocument()
  })
})
