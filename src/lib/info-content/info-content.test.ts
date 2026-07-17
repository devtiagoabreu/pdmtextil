import { describe, it, expect } from "vitest"
import { getInfoContent } from "./index"

describe("getInfoContent", () => {
  it("returns exact match for known path", () => {
    const result = getInfoContent("/dashboard")
    expect(result).not.toBeNull()
    expect(result?.title).toContain("Dashboard")
  })

  it("returns null for unknown path", () => {
    const result = getInfoContent("/nonexistent/path")
    expect(result).toBeNull()
  })

  it("returns best partial match for prefix", () => {
    const result = getInfoContent("/dashboard/amostra-comercial")
    expect(result).not.toBeNull()
    expect(result?.title).toContain("Amostras Comerciais")
  })

  it("matches cadastro paths", () => {
    const result = getInfoContent("/cadastros/clientes")
    expect(result).not.toBeNull()
  })

  it("matches admin paths", () => {
    const result = getInfoContent("/admin/usuarios")
    expect(result).not.toBeNull()
  })

  it("matches crm paths", () => {
    const result = getInfoContent("/comercial/crm")
    expect(result).not.toBeNull()
  })

  it("returns result with required fields", () => {
    const result = getInfoContent("/dashboard")
    expect(result).not.toBeNull()
    expect(result?.title).toBeDefined()
    expect(result?.description).toBeDefined()
  })
})
