import { beforeEach, describe, expect, it, vi } from "vitest"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { encrypt, decrypt } from "@/lib/crypto"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET, PUT, DELETE } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  },
}))
vi.mock("@/lib/crypto", () => ({ encrypt: vi.fn(), decrypt: vi.fn() }))

const session = { user: { id: "7" } }

function put(body: Record<string, unknown>) {
  return new Request("http://localhost/api/user/email-config", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

describe("GET /api/user/email-config", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    vi.mocked(encrypt).mockReset()
    vi.mocked(decrypt).mockReset()
    resetDb(db)
  })

  it("retorna 401 quando não está autenticado", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("retorna config null quando não existe configuração", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    db.select = vi.fn(() => createQueryBuilder([]))
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ config: null })
  })

  it("retorna a configuração com a senha decifrada", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    vi.mocked(decrypt).mockReturnValue("senha-decifrada")
    db.select = vi.fn(() =>
      createQueryBuilder([{ id: 1, usuarioId: 7, email: "teste@exemplo.com", senhaApp: "cripto" }]),
    )
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.config.email).toBe("teste@exemplo.com")
    expect(data.config.senhaApp).toBe("senha-decifrada")
    expect(decrypt).toHaveBeenCalledWith("cripto")
  })
})

describe("PUT /api/user/email-config", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    vi.mocked(encrypt).mockReset()
    vi.mocked(decrypt).mockReset()
    resetDb(db)
    vi.mocked(getServerSession).mockResolvedValue(session as any)
  })

  it("retorna 400 quando email ou senha estão ausentes", async () => {
    const res = await PUT(put({ email: "", senha_app: "" }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Email e senha do app são obrigatórios" })
  })

  it("cria a configuração quando ainda não existe", async () => {
    vi.mocked(encrypt).mockReturnValue("cripto")
    db.select = vi.fn(() => createQueryBuilder([]))
    db.insert = vi.fn(() => createQueryBuilder(undefined))
    const res = await PUT(put({ email: "teste@exemplo.com", senha_app: "segredo" }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(encrypt).toHaveBeenCalledWith("segredo")
    expect(db.insert).toHaveBeenCalled()
  })

  it("atualiza a configuração quando já existe", async () => {
    vi.mocked(encrypt).mockReturnValue("cripto")
    db.select = vi.fn(() => createQueryBuilder([{ id: 1 }]))
    db.update = vi.fn(() => createQueryBuilder(undefined))
    const res = await PUT(put({ email: "novo@exemplo.com", senha_app: "outra" }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(db.update).toHaveBeenCalled()
  })
})

describe("DELETE /api/user/email-config", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
  })

  it("exclui a configuração com sucesso", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    db.delete = vi.fn(() => createQueryBuilder(undefined))
    const res = await DELETE()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(db.delete).toHaveBeenCalled()
  })
})
