import { beforeEach, describe, expect, it, vi } from "vitest"
import { parseFailedRecipients, sincronizarBounces } from "./email-bounces"
import { ImapFlow } from "imapflow"
import { db } from "@/lib/db"

vi.mock("@/lib/crypto", () => ({ decrypt: (s: string) => s }))

function makeQueryChain(resolveValues: unknown[]) {
  const q: any = {}
  let i = 0
  for (const m of ["from", "where", "innerJoin", "limit", "set", "returning"]) {
    q[m] = vi.fn(() => q)
  }
  q.then = (resolve: any) => Promise.resolve(resolveValues[i++] ?? []).then(resolve)
  return q
}

vi.mock("@/lib/db", () => ({ db: { select: vi.fn(), update: vi.fn() } }))

vi.mock("imapflow", () => ({ ImapFlow: vi.fn() }))

const mockImapFlow = vi.mocked(ImapFlow)

const HEADER_EXAMPLE = [
  "Delivered-To: contato@promodatextil.ind.br",
  "Received: by 2002:a05:6f02:... with SMTP id xyz",
  "X-Failed-Recipients: madeiradecor@gmail.com",
  "X-Gm-Original-...",
  "MIME-Version: 1.0",
  "",
  "Body here",
].join("\r\n")

describe("parseFailedRecipients", () => {
  it("extrai do header X-Failed-Recipients", () => {
    expect(parseFailedRecipients(HEADER_EXAMPLE)).toEqual(["madeiradecor@gmail.com"])
  })

  it("extrai múltiplos destinatários separados por vírgula", () => {
    const raw = "X-Failed-Recipients: a@x.com, b@y.com.br\r\n\r\ncorpo"
    expect(parseFailedRecipients(raw)).toEqual(["a@x.com", "b@y.com.br"])
  })

  it("lida com header quebrado em continuação (folded)", () => {
    const raw = "X-Failed-Recipients: a@x.com,\r\n b@y.com.br\r\n\r\ncorpo"
    expect(parseFailedRecipients(raw)).toEqual(["a@x.com", "b@y.com.br"])
  })

  it("ignora valores que não são emails no header", () => {
    const raw = "X-Failed-Recipients: undefined\r\n\r\ncorpo"
    expect(parseFailedRecipients(raw)).toEqual([])
  })

  it("faz fallback para o corpo com 'not delivered to'", () => {
    const raw = "Subject: Delivery Status Notification\r\n\r\nAddress not found. Your message wasn't delivered to madeiradecor@gmail.com because the address wasn't found."
    expect(parseFailedRecipients(raw)).toEqual(["madeiradecor@gmail.com"])
  })

  it("faz fallback para o corpo em pt-BR 'não foi entregue a'", () => {
    const raw = "Subject: Falha na entrega\r\n\r\nSua mensagem não foi entregue a fulano@exemplo.com.br porque o endereço não foi encontrado."
    expect(parseFailedRecipients(raw)).toEqual(["fulano@exemplo.com.br"])
  })

  it("último recurso: emails do corpo excluindo remetentes de DSN", () => {
    const raw = "Subject: Delivery Status Notification\r\n\r\nFailed for <alvo@empresa.com.br>. From: mailer-daemon@googlemail.com"
    expect(parseFailedRecipients(raw)).toEqual(["alvo@empresa.com.br"])
  })

  it("retorna vazio quando não há destinatário", () => {
    const raw = "Subject: Olá\r\n\r\nSó um texto sem emails."
    expect(parseFailedRecipients(raw)).toEqual([])
  })
})

function buildClient() {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    list: vi.fn(),
    getMailboxLock: vi.fn(),
    search: vi.fn(),
    fetchOne: vi.fn(),
  }
}

describe("sincronizarBounces", () => {
  beforeEach(() => {
    vi.mocked(db.select).mockReset()
    vi.mocked(db.update).mockReset()
  })

  it("varre INBOX e a pasta Mailer-Daemon", async () => {
    const client = buildClient()
    client.list.mockResolvedValue([
      { path: "INBOX", name: "INBOX" },
      { path: "Mailer-Daemon", name: "Mailer-Daemon" },
      { path: "[Gmail]/Spam", name: "Spam" },
    ])
    const lock = { release: vi.fn() }
    client.getMailboxLock.mockResolvedValue(lock)
    client.search.mockResolvedValue([1, 2])
    client.fetchOne.mockResolvedValue({
      headers: Buffer.from("X-Failed-Recipients: madeiradecor@gmail.com\r\n\r\n"),
    })

    db.select
      .mockReturnValueOnce(makeQueryChain([[{ email: "contato@promodatextil.ind.br", senhaApp: "abc" }]]))
      .mockReturnValueOnce(makeQueryChain([[]]))
    mockImapFlow.mockImplementation(function () {
      return client as any
    })

    const res = await sincronizarBounces(16)

    expect(client.list).toHaveBeenCalled()
    expect(client.getMailboxLock).toHaveBeenCalledWith("INBOX")
    expect(client.getMailboxLock).toHaveBeenCalledWith("Mailer-Daemon")
    expect(client.getMailboxLock).not.toHaveBeenCalledWith("[Gmail]/Spam")
    expect(client.search).toHaveBeenCalledTimes(2)
    expect(lock.release).toHaveBeenCalledTimes(2)
    expect(res.processados).toBe(4)
  })

  it("respeita o limite de UIDs por pasta", async () => {
    const client = buildClient()
    client.list.mockResolvedValue([{ path: "INBOX", name: "INBOX" }])
    client.getMailboxLock.mockResolvedValue({ release: vi.fn() })
    const uids = Array.from({ length: 1200 }, (_, i) => i + 1)
    client.search.mockResolvedValue(uids)
    client.fetchOne.mockResolvedValue({
      headers: Buffer.from("X-Failed-Recipients: madeiradecor@gmail.com\r\n\r\n"),
    })

    db.select
      .mockReturnValueOnce(makeQueryChain([[{ email: "contato@promodatextil.ind.br", senhaApp: "abc" }]]))
      .mockReturnValueOnce(makeQueryChain([[]]))
    mockImapFlow.mockImplementation(function () {
      return client as any
    })

    const res = await sincronizarBounces(16)

    expect(client.fetchOne).toHaveBeenCalledTimes(1000)
    expect(res.processados).toBe(1000)
  })
})
