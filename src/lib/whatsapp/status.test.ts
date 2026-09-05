import { describe, it, expect, vi, beforeEach } from "vitest"
import { createQueryBuilder } from "@/test/route-db-mock"
import { db } from "@/lib/db"
import { extrairStatusUpdate, mapearStatusEvolution, processarStatusUpdate, registrarExternalIdEnviada } from "./status"

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}))

function msgUpdateBody(id: string, status: string, jid = "5519988887777@s.whatsapp.net", fromMe = true) {
  return JSON.stringify({
    event: "messages.update",
    data: {
      key: { id, remoteJid: jid, fromMe },
      status,
    },
  })
}

function msgUpdateBodyBase64(id: string, status: string) {
  return Buffer.from(msgUpdateBody(id, status)).toString("base64")
}

beforeEach(() => {
  vi.mocked(db.select).mockReset()
  vi.mocked(db.update).mockReset()
})

describe("extrairStatusUpdate", () => {
  it("retorna info para event messages.update valido", () => {
    const result = extrairStatusUpdate(msgUpdateBody("ABC123", "READ"))
    expect(result).toEqual({
      event: "messages.update",
      externalId: "ABC123",
      remoteJid: "5519988887777@s.whatsapp.net",
      status: "READ",
    })
  })

  it("retorna null para body invalido", () => {
    expect(extrairStatusUpdate("not json")).toBeNull()
  })

  it("retorna null quando event nao e messages.update", () => {
    const body = JSON.stringify({ event: "messages.upsert", data: { key: { id: "X" }, status: "READ" } })
    expect(extrairStatusUpdate(body)).toBeNull()
  })

  it("retorna null quando falta data.key", () => {
    const body = JSON.stringify({ event: "messages.update", data: { status: "READ" } })
    expect(extrairStatusUpdate(body)).toBeNull()
  })

  it("retorna null quando data.status e vazio", () => {
    const body = JSON.stringify({ event: "messages.update", data: { key: { id: "X" }, status: "" } })
    expect(extrairStatusUpdate(body)).toBeNull()
  })

  it("decodifica body em base64", () => {
    const result = extrairStatusUpdate(msgUpdateBodyBase64("XYZ789", "DELIVERY_ACK"))
    expect(result).toEqual({
      event: "messages.update",
      externalId: "XYZ789",
      remoteJid: "5519988887777@s.whatsapp.net",
      status: "DELIVERY_ACK",
    })
  })

  it("aceita type MESSAGES_UPDATE ao inves de event", () => {
    const body = JSON.stringify({ type: "MESSAGES_UPDATE", data: { key: { id: "T1" }, status: "SENT" } })
    expect(extrairStatusUpdate(body)).toEqual(expect.objectContaining({ externalId: "T1", status: "SENT" }))
  })

  it("retorna remoteJid vazio quando ausente", () => {
    const body = JSON.stringify({ event: "messages.update", data: { key: { id: "T1" }, status: "SENT" } })
    expect(extrairStatusUpdate(body)).toEqual(expect.objectContaining({ remoteJid: "" }))
  })
})

describe("mapearStatusEvolution", () => {
  it("mapeia todos os status validos", () => {
    expect(mapearStatusEvolution("PENDING")).toBe("ENVIADA")
    expect(mapearStatusEvolution("SERVER_ACK")).toBe("ENVIADA")
    expect(mapearStatusEvolution("SENT")).toBe("ENVIADA")
    expect(mapearStatusEvolution("RECEIVED")).toBe("ENTREGUE")
    expect(mapearStatusEvolution("DELIVERY_ACK")).toBe("ENTREGUE")
    expect(mapearStatusEvolution("READ")).toBe("LIDA")
    expect(mapearStatusEvolution("PLAYED")).toBe("LIDA")
    expect(mapearStatusEvolution("FAILED")).toBe("ERRO")
  })

  it("retorna null para status desconhecido", () => {
    expect(mapearStatusEvolution("UNKNOWN_STATUS")).toBeNull()
  })
})

describe("processarStatusUpdate", () => {
  it("atualiza status por match de externalId", async () => {
    vi.mocked(db.select).mockImplementation(() => createQueryBuilder([{ id: 42, status: "ENVIADA" }]))
    vi.mocked(db.update).mockImplementation(() => createQueryBuilder([]))

    const result = await processarStatusUpdate(msgUpdateBody("EXT001", "READ"))

    expect(result).toEqual({ tratado: true, status: "LIDA", mensagemId: 42 })
    expect(db.update).toHaveBeenCalled()
  })

  it("usa fallback por remoteJid quando externalId da mensagem nao existe na busca", async () => {
    const JID = "5511999999999@s.whatsapp.net"
    const body = JSON.stringify({
      event: "messages.update",
      data: { key: { id: "NOEXIST", remoteJid: JID }, status: "DELIVERY_ACK" },
    })

    vi.mocked(db.select).mockImplementation(() => createQueryBuilder([{ id: 99, status: "ENVIADA" }]))
    vi.mocked(db.update).mockImplementation(() => createQueryBuilder([]))

    const result = await processarStatusUpdate(body)

    expect(result.tratado).toBe(true)
    expect(result.status).toBe("ENTREGUE")
    expect(db.select).toHaveBeenCalled()
  })

  it("bloqueia downgrade (LIDA para ENTREGUE)", async () => {
    vi.mocked(db.select).mockImplementation(() => createQueryBuilder([{ id: 55, status: "LIDA" }]))
    vi.mocked(db.update).mockImplementation(() => createQueryBuilder([]))

    const result = await processarStatusUpdate(msgUpdateBody("EXT002", "RECEIVED"))

    expect(result.tratado).toBe(true)
    expect(result.status).toBe("LIDA")
    expect(result.downgradeBloqueado).toBe(true)
    expect(db.update).not.toHaveBeenCalled()
  })

  it("permite upgrade (ENVIADA para ENTREGUE)", async () => {
    vi.mocked(db.select).mockImplementation(() => createQueryBuilder([{ id: 56, status: "ENVIADA" }]))
    vi.mocked(db.update).mockImplementation(() => createQueryBuilder([]))

    const result = await processarStatusUpdate(msgUpdateBody("EXT003", "DELIVERY_ACK"))

    expect(result.status).toBe("ENTREGUE")
    expect(result.downgradeBloqueado).toBeUndefined()
    expect(db.update).toHaveBeenCalled()
  })

  it("nao trata body que nao e status update", async () => {
    const body = JSON.stringify({ event: "messages.upsert", data: { key: { id: "X" }, message: { conversation: "oi" } } })
    const result = await processarStatusUpdate(body)
    expect(result.tratado).toBe(false)
  })

  it("trata sem atualizar quando status da Evolution e desconhecido", async () => {
    vi.mocked(db.select).mockImplementation(() => createQueryBuilder([{ id: 60, status: "ENVIADA" }]))
    const result = await processarStatusUpdate(msgUpdateBody("EXT004", "UNKNOWN_EVO"))
    expect(result.tratado).toBe(true)
    expect(result.status).toBeUndefined()
    expect(db.update).not.toHaveBeenCalled()
  })

  it("nao atualiza quando nao encontra mensagem", async () => {
    vi.mocked(db.select).mockImplementation(() => createQueryBuilder([]))
    vi.mocked(db.update).mockImplementation(() => createQueryBuilder([]))

    const result = await processarStatusUpdate(msgUpdateBody("EXT005", "READ"))
    expect(result).toEqual({ tratado: true })
    expect(db.update).not.toHaveBeenCalled()
  })
})

describe("registrarExternalIdEnviada", () => {
  it("atualiza a ultima ENVIADA com external_id null para o remoteJid", async () => {
    vi.mocked(db.select).mockImplementation(() => createQueryBuilder([{ id: 101 }]))
    vi.mocked(db.update).mockImplementation(() => createQueryBuilder([]))

    await registrarExternalIdEnviada("5511988887777@s.whatsapp.net", "EXT_123")

    expect(db.update).toHaveBeenCalled()
    expect(db.select).toHaveBeenCalled()
  })

  it("nao faz nada quando externalId e null", async () => {
    await registrarExternalIdEnviada("5511988887777@s.whatsapp.net", null)
    expect(db.update).not.toHaveBeenCalled()
    expect(db.select).not.toHaveBeenCalled()
  })

  it("nao faz nada quando remoteJid e vazio", async () => {
    await registrarExternalIdEnviada("", "EXT_123")
    expect(db.update).not.toHaveBeenCalled()
  })

  it("nao atualiza quando nao existe ENVIADA com external_id null", async () => {
    vi.mocked(db.select).mockImplementation(() => createQueryBuilder([]))
    vi.mocked(db.update).mockImplementation(() => createQueryBuilder([]))

    await registrarExternalIdEnviada("5511988887777@s.whatsapp.net", "EXT_456")

    expect(db.select).toHaveBeenCalled()
    expect(db.update).not.toHaveBeenCalled()
  })
})