import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { POST } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/db", () => ({ db: { select: vi.fn(), insert: vi.fn() } }))

const session = { user: { id: "16", role: "ADMIN" } }

const lista = { id: 7, nome: "Clientes SP" }

function makeRequest(arquivo: File) {
  const formData = new FormData()
  formData.append("arquivo", arquivo)
  return new NextRequest("http://localhost/api/admin/email-massa/listas/7/importar", {
    method: "POST",
    body: formData,
  })
}

function csv(nome: string, linhas: string[]) {
  return new File([`${nome}\n${linhas.join("\n")}`], "contatos.csv", { type: "text/csv" })
}

describe("POST /api/admin/email-massa/listas/[id]/importar", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    db.select = vi.fn(() => createQueryBuilder([lista]))
  })

  async function inserir(arquivo: File): Promise<{ data: any; values: any[] }> {
    const insertBuilder = createQueryBuilder([])
    db.insert = vi.fn(() => insertBuilder)
    const res = await POST(makeRequest(arquivo), { params: Promise.resolve({ id: "7" }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    return { data, values: (insertBuilder.values as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] }
  }

  it("retorna 401 sem sessão de admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any)
    const res = await POST(makeRequest(csv("nome;email", ["Ana;a@x.com"])), { params: Promise.resolve({ id: "7" }) })
    expect(res.status).toBe(401)
  })

  it("separa contato com múltiplos emails por ponto e vírgula em uma linha por email", async () => {
    const { data, values } = await inserir(csv("nome;email", [
      "TIAGO ABREU;devtiagoabreu@gmail.com;faturamento@promodatextil.com.br",
    ]))
    expect(data.importados).toBe(2)
    expect(values).toHaveLength(2)
    expect(values[0]).toMatchObject({ listaId: 7, nome: "TIAGO ABREU", email: "devtiagoabreu@gmail.com" })
    expect(values[1]).toMatchObject({ listaId: 7, nome: "TIAGO ABREU", email: "faturamento@promodatextil.com.br" })
  })

  it("separa emails separados por vírgula dentro da célula do email", async () => {
    const { data, values } = await inserir(csv("nome;email", [
      "TIAGO ABREU;devtiagoabreu@gmail.com,faturamento@promodatextil.com.br",
    ]))
    expect(data.importados).toBe(2)
    expect(values.map((v: any) => v.email)).toEqual([
      "devtiagoabreu@gmail.com",
      "faturamento@promodatextil.com.br",
    ])
  })

  it("importa vários contatos em um JSON com um email cada", async () => {
    const json = JSON.stringify([
      { nome: "Ana", email: "ana@x.com" },
      { nome: "Bruno", email: "bruno@x.com" },
    ])
    const arquivo = new File([json], "contatos.json", { type: "application/json" })
    const { data, values } = await inserir(arquivo)
    expect(data.importados).toBe(2)
    expect(values.map((v: any) => v.email)).toEqual(["ana@x.com", "bruno@x.com"])
  })

  it("registra erro para linha sem nome e não insere", async () => {
    const { data, values } = await inserir(csv("nome;email", [";a@x.com"]))
    expect(data.importados).toBe(0)
    expect(data.erros).toHaveLength(1)
    expect(values).toBeUndefined()
  })
})
