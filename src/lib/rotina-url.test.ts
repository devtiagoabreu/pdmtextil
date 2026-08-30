import { describe, expect, it } from "vitest"
import { ehHrefRotinaValida, validarUrlRotina } from "./rotina-url"

describe("ehHrefRotinaValida", () => {
  it("aceita hrefs de rotina normais", () => {
    expect(ehHrefRotinaValida("/cadastros/clientes")).toBe(true)
    expect(ehHrefRotinaValida("/comercial/crm/visitas?view=kanban")).toBe(true)
    expect(ehHrefRotinaValida("/dashboard")).toBe(true)
  })

  it("rejeita hrefs de detalhe ([id])", () => {
    expect(ehHrefRotinaValida("/cadastros/produto-cru/[id]")).toBe(false)
    expect(ehHrefRotinaValida("/comercial/crm/visitas/[id]")).toBe(false)
    expect(ehHrefRotinaValida("/comercial/solicitacoes/[id]/editar")).toBe(false)
  })

  it("rejeita hrefs de API", () => {
    expect(ehHrefRotinaValida("/api/usuarios")).toBe(false)
  })

  it("rejeita hrefs externos ou vazios", () => {
    expect(ehHrefRotinaValida("https://google.com")).toBe(false)
    expect(ehHrefRotinaValida("#")).toBe(false)
  })
})

describe("validarUrlRotina", () => {
  it("aceita URL de rotina válida", () => {
    expect(validarUrlRotina("/cadastros/clientes", false)).toBeNull()
  })

  it("rejeita URL vazia", () => {
    expect(validarUrlRotina("", false)).toMatch(/obrigatórios/i)
    expect(validarUrlRotina(undefined, false)).toMatch(/obrigatórios/i)
  })

  it("rejeita URL de detalhe", () => {
    expect(validarUrlRotina("/cadastros/fios/[id]", false)).toMatch(/detalhe/i)
  })

  it("rejeita URL de API", () => {
    expect(validarUrlRotina("/api/alguma-coisa", true)).toMatch(/api/i)
  })

  it("rejeita página admin para não-administrador", () => {
    expect(validarUrlRotina("/admin/usuarios", false)).toMatch(/administrador/i)
  })

  it("permite página admin apenas para administrador", () => {
    expect(validarUrlRotina("/admin/usuarios", true)).toBeNull()
  })
})