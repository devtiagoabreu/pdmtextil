import { describe, expect, it, vi } from "vitest"
import { db } from "@/lib/db"
import { verificarAbandonos } from "./abandon-checker"
import { createQueryBuilder } from "@/test/route-db-mock"

vi.mock("@/lib/db", () => ({ db: { select: vi.fn(), insert: vi.fn() } }))
vi.mock("@/lib/evolution-api", () => ({
  evolutionConfigurado: vi.fn(() => false),
  enviarMensagem: vi.fn(),
}))

function collectStrings(node: any, out: string[] = [], seen: Set<any> = new Set()): string[] {
  if (node === null || node === undefined) return out
  if (typeof node !== "object") {
    if (typeof node === "string") out.push(node)
    return out
  }
  if (seen.has(node)) return out
  seen.add(node)
  for (const key of Object.keys(node)) collectStrings(node[key], out, seen)
  return out
}

describe("verificarAbandonos", () => {
  it("passa o threshold como string ISO no sql (postgres.js não serializa Date)", async () => {
    const builders: any[] = []
    const mk = (result: any) => {
      const b = createQueryBuilder(result)
      builders.push(b)
      return b
    }
    vi.mocked(db.select).mockReset()
    vi.mocked(db.select).mockImplementationOnce(() =>
      mk([{ remoteJid: "5519999999999@s.whatsapp.net", estado: "AGUARDANDO_REPRESENTANTE", dados: null, updatedAt: new Date() }])
    )
    vi.mocked(db.select).mockImplementationOnce(() => mk([]))
    vi.mocked(db.insert).mockReturnValue(createQueryBuilder(undefined))

    const res = await verificarAbandonos()
    expect(res.notificados).toBe(1)

    const strings = collectStrings(builders[0].where.mock.calls[0][0])
    expect(strings.some((s: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s))).toBe(true)
    expect(strings.some((s: string) => s.includes("AGUARDANDO_REPRESENTANTE"))).toBe(true)
  })
})
