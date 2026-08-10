import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET } from "./route"

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  },
}))

function get(url: string) {
  return GET(new NextRequest(`http://localhost/api/email/unsubscribe?${url}`))
}

describe("GET /api/email/unsubscribe", () => {
  beforeEach(() => {
    resetDb(db)
  })

  it("cadastra o descadastro e retorna página de confirmação", async () => {
    const insertBuilder = createQueryBuilder(undefined)
    db.insert = vi.fn(() => insertBuilder)
    const res = await get("email=cliente%40x.com")
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain("Inscrição cancelada")
    expect(text).toContain("cliente@x.com")
    expect(db.insert).toHaveBeenCalled()
    expect(insertBuilder.values).toHaveBeenCalledWith({ email: "cliente@x.com" })
    expect(insertBuilder.onConflictDoNothing).toHaveBeenCalled()
  })

  it("normaliza o email para minúsculas", async () => {
    const insertBuilder = createQueryBuilder(undefined)
    db.insert = vi.fn(() => insertBuilder)
    const res = await get("email=Cliente%40X.COM")
    expect(res.status).toBe(200)
    expect(insertBuilder.values).toHaveBeenCalledWith({ email: "cliente@x.com" })
  })

  it("retorna 400 para email inválido", async () => {
    const res = await get("email=invalido")
    expect(res.status).toBe(400)
    expect(await res.text()).toContain("Link inválido")
    expect(db.insert).not.toHaveBeenCalled()
  })

  it("retorna 400 quando email está ausente", async () => {
    const res = await get("")
    expect(res.status).toBe(400)
    expect(db.insert).not.toHaveBeenCalled()
  })
})
