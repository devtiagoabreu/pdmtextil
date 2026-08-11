import { describe, expect, it, vi } from "vitest"
import { parseFailedRecipients } from "./email-bounces"

vi.mock("@/lib/db", () => ({ db: {} }))
vi.mock("@/lib/crypto", () => ({ decrypt: (s: string) => s }))

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
