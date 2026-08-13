import { describe, expect, it } from "vitest"
import { extrairEmails } from "./email-utils"

describe("extrairEmails", () => {
  it("retorna um email único", () => {
    expect(extrairEmails("devtiagoabreu@gmail.com")).toEqual(["devtiagoabreu@gmail.com"])
  })

  it("separa múltiplos emails por vírgula", () => {
    expect(extrairEmails("devtiagoabreu@gmail.com,faturamento@promodatextil.com.br")).toEqual([
      "devtiagoabreu@gmail.com",
      "faturamento@promodatextil.com.br",
    ])
  })

  it("separa múltiplos emails por ponto e vírgula", () => {
    expect(extrairEmails("a@x.com;b@y.com;c@z.com")).toEqual(["a@x.com", "b@y.com", "c@z.com"])
  })

  it("normaliza maiúsculas, espaços e espaços extras", () => {
    expect(extrairEmails("  DevTiagoAbreu@gmail.com ;  FATURAMENTO@promodatextil.com.br ")).toEqual([
      "devtiagoabreu@gmail.com",
      "faturamento@promodatextil.com.br",
    ])
  })

  it("ignora valores sem @", () => {
    expect(extrairEmails("sem-arroba; ok@x.com")).toEqual(["ok@x.com"])
  })

  it("retorna [] para vazio/undefined/null", () => {
    expect(extrairEmails("")).toEqual([])
    expect(extrairEmails(undefined)).toEqual([])
    expect(extrairEmails(null)).toEqual([])
  })
})
