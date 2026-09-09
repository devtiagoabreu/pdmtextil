// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { modeloParaMermaid, mermaidParaModelo } from "@/lib/processos/diagrama/mermaid"
import { modeloParaMarkdown } from "@/lib/processos/diagrama/markdown"
import { PUT } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), update: vi.fn(), delete: vi.fn() },
}))
vi.mock("@/lib/notificar", () => ({
  registrarLog: vi.fn(),
  notificar: vi.fn(),
  notificarErro: vi.fn(),
  notificarDelecao: vi.fn(),
}))
vi.mock("@/lib/processos/diagrama/mermaid", () => ({
  modeloParaMermaid: vi.fn(() => "flowchart TD"),
  mermaidParaModelo: vi.fn(),
}))
vi.mock("@/lib/processos/diagrama/markdown", () => ({
  modeloParaMarkdown: vi.fn(() => "# Diagrama"),
}))

const sessionAdmin = { session: { user: { id: "1", role: "ADMIN", name: "Tiago" } }, userId: 1 }

function put(id: string, body: Record<string, unknown>) {
  return PUT(
    new NextRequest(`http://localhost/api/processos/diagramas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  )
}

describe("PUT /api/processos/diagramas/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
    vi.mocked(modeloParaMermaid).mockClear()
    vi.mocked(modeloParaMarkdown).mockClear()
    vi.mocked(mermaidParaModelo).mockClear()
    vi.mocked(mermaidParaModelo).mockReturnValue({ modelo: { no: "inicio" }, erro: undefined } as any)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await put("1", { nome: "X" })
    expect(res.status).toBe(401)
  })

  it("retorna 404 quando o diagrama não existe", async () => {
    db.select = vi.fn(() => createQueryBuilder([]))
    const res = await put("99", { nome: "X" })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Diagrama não encontrado" })
  })

  it("preserva modelo/mermaid/markdown existentes quando o corpo só atualiza nome e tipo", async () => {
    const existente = {
      id: 1,
      nome: "Antigo",
      tipo: "FLUXOGRAMA",
      descricao: null,
      modelo: { no: "inicio", vertices: [] },
      bpmnXml: null,
      canvas: null,
      mermaid: "flowchart TD\nA --> B",
      markdown: "# Antigo",
      ativo: true,
    }
    db.select = vi.fn(() => createQueryBuilder([existente]))
    db.update = vi.fn(() => createQueryBuilder([{ ...existente, nome: "Novo" }]))

    const res = await put("1", { nome: "Novo", tipo: "BPMN" })
    expect(res.status).toBe(200)
    expect(modeloParaMermaid).not.toHaveBeenCalled()
    expect(mermaidParaModelo).not.toHaveBeenCalled()

    const builder = (db.update as ReturnType<typeof vi.fn>).mock.results[0].value
    const setValues = builder.set.mock.calls[0][0]
    expect(setValues).toMatchObject({
      nome: "Novo",
      tipo: "BPMN",
      modelo: existente.modelo,
      mermaid: existente.mermaid,
      markdown: existente.markdown,
    })
  })

  it("deriva mermaid e markdown quando envia modelo no corpo", async () => {
    const existente = { id: 1, nome: "Antigo", tipo: "FLUXOGRAMA", descricao: null, modelo: null, bpmnXml: null, canvas: null, mermaid: null, markdown: null, ativo: true }
    db.select = vi.fn(() => createQueryBuilder([existente]))
    db.update = vi.fn(() => createQueryBuilder([{ ...existente, nome: "Novo", modelo: { no: "inicio" } }]))

    const modelo = { no: "inicio", vertices: [] }
    const res = await put("1", { nome: "Novo", modelo })
    expect(res.status).toBe(200)
    expect(modeloParaMermaid).toHaveBeenCalled()
    expect(modeloParaMarkdown).toHaveBeenCalled()

    const builder = (db.update as ReturnType<typeof vi.fn>).mock.results[0].value
    const setValues = builder.set.mock.calls[0][0]
    expect(setValues.mermaid).toBe("flowchart TD")
    expect(setValues.markdown).toBe("# Diagrama")
    expect(setValues.modelo).toMatchObject({ nome: "", fluxos: [] })
  })

  it("retorna 400 quando o texto mermaid é inválido", async () => {
    const existente = { id: 1, nome: "Antigo", tipo: "FLUXOGRAMA", descricao: null, modelo: null, bpmnXml: null, canvas: null, mermaid: null, markdown: null, ativo: true }
    db.select = vi.fn(() => createQueryBuilder([existente]))
    vi.mocked(mermaidParaModelo).mockReturnValue({ modelo: undefined, erro: "Não foi possível interpretar o texto." } as any)

    const res = await put("1", { nome: "Novo", mermaid: "invalido" })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Não foi possível interpretar o texto." })
    expect(db.update).not.toHaveBeenCalled()
  })
})