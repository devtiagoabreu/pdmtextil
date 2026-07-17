import { describe, it, expect, vi } from "vitest"

vi.mock("next/server", () => {
  class MockNextRequest extends Request {
    constructor(url: string, init?: RequestInit) {
      super(url, init)
    }
    get nextUrl() {
      return new URL(this.url)
    }
  }
  return { NextRequest: MockNextRequest }
})

vi.mock("drizzle-orm", () => ({
  asc: (col: unknown) => col,
  gt: (col: unknown, val: unknown) => ({ __op: "gt", col, val }),
  and: (...conditions: unknown[]) => ({ __op: "and", conditions }),
}))

import { NextRequest } from "next/server"
import { getPaginationParams, buildPaginatedResponse, cursorCondition } from "./pagination"

function makeRequest(url: string): NextRequest {
  return new NextRequest(url) as NextRequest
}

describe("getPaginationParams", () => {
  it("returns default limit when no params", () => {
    const req = makeRequest("http://localhost/api/test")
    const result = getPaginationParams(req)
    expect(result.limit).toBe(20)
    expect(result.cursor).toBeUndefined()
  })

  it("parses cursor from query string", () => {
    const req = makeRequest("http://localhost/api/test?cursor=5")
    const result = getPaginationParams(req)
    expect(result.cursor).toBe(5)
  })

  it("parses custom limit", () => {
    const req = makeRequest("http://localhost/api/test?limit=10")
    const result = getPaginationParams(req)
    expect(result.limit).toBe(10)
  })

  it("caps limit at maxLimit", () => {
    const req = makeRequest("http://localhost/api/test?limit=500")
    const result = getPaginationParams(req)
    expect(result.limit).toBe(100)
  })

  it("uses custom defaultLimit", () => {
    const req = makeRequest("http://localhost/api/test")
    const result = getPaginationParams(req, 50)
    expect(result.limit).toBe(50)
  })

  it("handles invalid limit gracefully", () => {
    const req = makeRequest("http://localhost/api/test?limit=abc")
    const result = getPaginationParams(req)
    expect(result.limit).toBe(20)
  })
})

describe("buildPaginatedResponse", () => {
  it("returns all rows when fewer than limit", () => {
    const rows = [{ id: 1 }, { id: 2 }]
    const result = buildPaginatedResponse(rows, 10)
    expect(result.data).toEqual(rows)
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeNull()
  })

  it("trims extra row and sets hasMore", () => {
    const rows = [{ id: 1 }, { id: 2 }, { id: 3 }]
    const result = buildPaginatedResponse(rows, 2)
    expect(result.data).toEqual([{ id: 1 }, { id: 2 }])
    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toBe(2)
  })
})

describe("cursorCondition", () => {
  it("returns undefined when no cursor", () => {
    const result = cursorCondition({ id: 1 }, undefined)
    expect(result).toBeUndefined()
  })

  it("returns condition when cursor is set", () => {
    const result = cursorCondition({ id: 1 }, 5)
    expect(result).toBeDefined()
  })
})
