import { describe, it, expect, vi } from "vitest"

vi.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), {
        status: init?.status ?? 200,
        headers: { "Content-Type": "application/json" },
      }),
  },
  NextRequest: class MockNextRequest extends Request {
    constructor(url: string, init?: RequestInit) {
      super(url, init)
    }
  },
}))

vi.mock("./notificar", () => ({
  notificarErro: vi.fn().mockResolvedValue(undefined),
}))

import { handleApiError, getErrorMessage } from "./api-error"

describe("getErrorMessage", () => {
  it("returns message from Error instance", () => {
    expect(getErrorMessage(new Error("test error"))).toBe("test error")
  })

  it("returns stringified non-Error value", () => {
    expect(getErrorMessage("some string")).toBe("some string")
  })

  it("returns fallback for empty string", () => {
    expect(getErrorMessage("")).toBe("Erro ao processar requisição")
  })

  it("returns custom fallback", () => {
    expect(getErrorMessage("", "custom")).toBe("custom")
  })

  it("returns string for number", () => {
    expect(getErrorMessage(42)).toBe("42")
  })

  it("returns stringified null", () => {
    expect(getErrorMessage(null)).toBe("null")
  })
})

describe("handleApiError", () => {
  it("returns 409 for foreign key errors", async () => {
    const fkError = Object.assign(new Error("FK violation"), { code: "23503" })
    const response = await handleApiError(fkError, "test-context")
    const body = await response.json()
    expect(response.status).toBe(409)
    expect(body.fkError).toBe(true)
  })

  it("returns 500 for generic errors", async () => {
    const response = await handleApiError(new Error("boom"), "test-context")
    const body = await response.json()
    expect(response.status).toBe(500)
    expect(body.error).toContain("suporte")
  })
})
