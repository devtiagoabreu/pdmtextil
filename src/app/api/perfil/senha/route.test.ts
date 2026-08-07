import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextResponse, NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { PUT } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  },
}))
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn() } }))

const authOk = { session: {}, userId: 42 }

function put(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/perfil/senha", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

describe("PUT /api/perfil/senha", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    vi.mocked(bcrypt.hash).mockReset()
    resetDb(db)
  })

  it("retorna 401 quando não está autenticado", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      NextResponse.json({ error: "Não autorizado" }, { status: 401 }) as any,
    )
    const res = await PUT(put({ password: "123456" }))
    expect(res.status).toBe(401)
  })

  it("retorna 400 quando a senha tem menos de 6 caracteres", async () => {
    vi.mocked(requireAuth).mockResolvedValue(authOk as any)
    const res = await PUT(put({ password: "123" }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "A senha deve ter no mínimo 6 caracteres" })
  })

  it("retorna 400 quando a senha está ausente", async () => {
    vi.mocked(requireAuth).mockResolvedValue(authOk as any)
    const res = await PUT(put({}))
    expect(res.status).toBe(400)
  })

  it("altera a senha com sucesso", async () => {
    vi.mocked(requireAuth).mockResolvedValue(authOk as any)
    vi.mocked(bcrypt.hash).mockResolvedValue("hash-simulado" as any)
    db.update = vi.fn(() => createQueryBuilder(undefined))
    const res = await PUT(put({ password: "novaSenha123" }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(bcrypt.hash).toHaveBeenCalledWith("novaSenha123", 10)
    expect(db.update).toHaveBeenCalled()
  })
})
