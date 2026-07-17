import { describe, it, expect, vi } from "vitest"

vi.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), {
        status: init?.status ?? 200,
        headers: { "Content-Type": "application/json" },
      }),
  },
}))

import {
  clienteSchema,
  produtoCruSchema,
  fioSchema,
  solicitacaoSchema,
  requisicaoCorteSchema,
  fornecedorSchema,
  baseUrdumeSchema,
  produtoQuimicoSchema,
  usuarioSchema,
  emailListaSchema,
  emailModeloSchema,
  integracaoSchema,
} from "./validation"

describe("clienteSchema", () => {
  it("accepts valid cliente", () => {
    const result = clienteSchema.safeParse({
      nome: "Cliente ABC",
      cnpj: "12.345.678/0001-90",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty nome", () => {
    const result = clienteSchema.safeParse({ nome: "", cnpj: "12.345.678/0001-90" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].path).toContain("nome")
    }
  })

  it("rejects empty cnpj", () => {
    const result = clienteSchema.safeParse({ nome: "Cliente", cnpj: "" })
    expect(result.success).toBe(false)
  })

  it("accepts optional email as empty string", () => {
    const result = clienteSchema.safeParse({ nome: "Cliente", cnpj: "00.000.000/0001-00", email: "" })
    expect(result.success).toBe(true)
  })

  it("rejects invalid email", () => {
    const result = clienteSchema.safeParse({
      nome: "Cliente",
      cnpj: "00.000.000/0001-00",
      email: "not-an-email",
    })
    expect(result.success).toBe(false)
  })

  it("requires uf to have 2 characters exactly", () => {
    const result = clienteSchema.safeParse({ nome: "Cliente", cnpj: "00.000.000/0001-00", uf: "SP" })
    expect(result.success).toBe(true)
  })

  it("rejects uf with wrong length", () => {
    const r1 = clienteSchema.safeParse({ nome: "Cliente", cnpj: "00.000.000/0001-00", uf: "SPO" })
    expect(r1.success).toBe(false)
    const r2 = clienteSchema.safeParse({ nome: "Cliente", cnpj: "00.000.000/0001-00", uf: "S" })
    expect(r2.success).toBe(false)
  })
})

describe("produtoCruSchema", () => {
  it("accepts valid produto cru", () => {
    const result = produtoCruSchema.safeParse({
      codigoPdm: "PDM-001",
      descricao: "Tecido 100% algodão",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty codigoPdm", () => {
    const result = produtoCruSchema.safeParse({ codigoPdm: "", descricao: "Teste" })
    expect(result.success).toBe(false)
  })

  it("accepts optional status values", () => {
    const valid = produtoCruSchema.safeParse({
      codigoPdm: "PDM-001",
      descricao: "Teste",
      status: "APROVADO",
    })
    expect(valid.success).toBe(true)

    const invalid = produtoCruSchema.safeParse({
      codigoPdm: "PDM-001",
      descricao: "Teste",
      status: "INEXISTENTE",
    })
    expect(invalid.success).toBe(false)
  })

  it("accepts ficha tecnica", () => {
    const result = produtoCruSchema.safeParse({
      codigoPdm: "PDM-001",
      descricao: "Teste",
      fichaTecnica: { gramatura: "150", ligamento: "Tafetá" },
    })
    expect(result.success).toBe(true)
  })

  it("accepts links array", () => {
    const result = produtoCruSchema.safeParse({
      codigoPdm: "PDM-001",
      descricao: "Teste",
      links: [{ url: "https://example.com", descricao: "foto" }],
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid url in links", () => {
    const result = produtoCruSchema.safeParse({
      codigoPdm: "PDM-001",
      descricao: "Teste",
      links: [{ url: "not-a-url", descricao: "foto" }],
    })
    expect(result.success).toBe(false)
  })
})

describe("fioSchema", () => {
  it("accepts valid fio", () => {
    const result = fioSchema.safeParse({
      codigoCompleto: "FIO-001",
      codigoFio: "F001",
      nome: "Fio de Algodão",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing required fields", () => {
    const r1 = fioSchema.safeParse({ codigoCompleto: "", codigoFio: "F001", nome: "Teste" })
    expect(r1.success).toBe(false)

    const r2 = fioSchema.safeParse({ codigoCompleto: "FIO-001", codigoFio: "", nome: "Teste" })
    expect(r2.success).toBe(false)

    const r3 = fioSchema.safeParse({ codigoCompleto: "FIO-001", codigoFio: "F001", nome: "" })
    expect(r3.success).toBe(false)
  })

  it("accepts numeric optional fields", () => {
    const result = fioSchema.safeParse({
      codigoCompleto: "FIO-001",
      codigoFio: "F001",
      nome: "Fio Teste",
      resistencia: 25.5,
      alongamento: 15,
    })
    expect(result.success).toBe(true)
  })

  it("rejects negative alongamento", () => {
    const result = fioSchema.safeParse({
      codigoCompleto: "FIO-001",
      codigoFio: "F001",
      nome: "Teste",
      alongamento: -1,
    })
    expect(result.success).toBe(false)
  })
})

describe("solicitacaoSchema", () => {
  it("accepts valid solicitacao", () => {
    const result = solicitacaoSchema.safeParse({
      tipo: "DESENVOLVIMENTO",
      cliente: "Cliente XYZ",
    })
    expect(result.success).toBe(true)
  })

  it("accepts optional briefing", () => {
    const result = solicitacaoSchema.safeParse({
      tipo: "DESENVOLVIMENTO",
      cliente: "Cliente XYZ",
      briefing: { segmento: "vestuário", observacoes: "teste" },
    })
    expect(result.success).toBe(true)
  })
})

describe("requisicaoCorteSchema", () => {
  it("accepts valid requisicao with items", () => {
    const result = requisicaoCorteSchema.safeParse({
      itens: [{ quantidade: "10", artigo: "ART-001" }],
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty items array", () => {
    const result = requisicaoCorteSchema.safeParse({ itens: [] })
    expect(result.success).toBe(false)
  })

  it("rejects item without quantidade", () => {
    const result = requisicaoCorteSchema.safeParse({
      itens: [{ artigo: "ART-001" }],
    })
    expect(result.success).toBe(false)
  })
})

describe("fornecedorSchema", () => {
  it("accepts valid fornecedor", () => {
    const result = fornecedorSchema.safeParse({ nome: "Fornecedor Ltda" })
    expect(result.success).toBe(true)
  })

  it("rejects empty nome", () => {
    const result = fornecedorSchema.safeParse({ nome: "" })
    expect(result.success).toBe(false)
  })

  it("accepts email as empty string", () => {
    const result = fornecedorSchema.safeParse({ nome: "Fornecedor", email: "" })
    expect(result.success).toBe(true)
  })

  it("accepts ativo default", () => {
    const result = fornecedorSchema.safeParse({ nome: "Fornecedor" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.ativo).toBeUndefined()
    }
  })
})

describe("baseUrdumeSchema", () => {
  it("accepts valid base urdume", () => {
    const result = baseUrdumeSchema.safeParse({
      codigoCompleto: "BASE-001",
      codigoBase: "B001",
      nome: "Base Urdume Algodão",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing required fields", () => {
    const r1 = baseUrdumeSchema.safeParse({ codigoCompleto: "", codigoBase: "B001", nome: "Teste" })
    expect(r1.success).toBe(false)
  })

  it("accepts numeric fields", () => {
    const result = baseUrdumeSchema.safeParse({
      codigoCompleto: "BASE-001",
      codigoBase: "B001",
      nome: "Base Teste",
      densidade: 40,
      tensaoUrdume: 120,
      largura: 1.6,
    })
    expect(result.success).toBe(true)
  })
})

describe("produtoQuimicoSchema", () => {
  it("accepts valid produto quimico", () => {
    const result = produtoQuimicoSchema.safeParse({
      codigo: "QUIM-001",
      nome: "Corante Azul",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing required fields", () => {
    const r1 = produtoQuimicoSchema.safeParse({ codigo: "", nome: "Teste" })
    expect(r1.success).toBe(false)
    const r2 = produtoQuimicoSchema.safeParse({ codigo: "QUIM-001", nome: "" })
    expect(r2.success).toBe(false)
  })

  it("applies default unidadePadrao", () => {
    const result = produtoQuimicoSchema.safeParse({ codigo: "QUIM-001", nome: "Teste" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.unidadePadrao).toBe("kg")
    }
  })

  it("accepts ph within range", () => {
    const r1 = produtoQuimicoSchema.safeParse({
      codigo: "QUIM-001", nome: "Teste", ph: 7,
    })
    expect(r1.success).toBe(true)
    const r2 = produtoQuimicoSchema.safeParse({
      codigo: "QUIM-001", nome: "Teste", ph: 15,
    })
    expect(r2.success).toBe(false)
  })
})

describe("usuarioSchema", () => {
  it("accepts valid usuario", () => {
    const result = usuarioSchema.safeParse({
      name: "Admin",
      email: "admin@example.com",
      password: "123456",
      role: "admin",
    })
    expect(result.success).toBe(true)
  })

  it("rejects short password", () => {
    const result = usuarioSchema.safeParse({
      name: "User",
      email: "user@example.com",
      password: "12345",
      role: "user",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid email", () => {
    const result = usuarioSchema.safeParse({
      name: "User",
      email: "invalid",
      password: "123456",
      role: "user",
    })
    expect(result.success).toBe(false)
  })
})

describe("emailListaSchema", () => {
  it("accepts valid lista", () => {
    const result = emailListaSchema.safeParse({ nome: "Newsletter" })
    expect(result.success).toBe(true)
  })
})

describe("emailModeloSchema", () => {
  it("accepts valid modelo", () => {
    const result = emailModeloSchema.safeParse({
      nome: "Boas Vindas",
      assunto: "Bem-vindo!",
      corpo: "Olá, seja bem-vindo ao sistema.",
    })
    expect(result.success).toBe(true)
  })
})

describe("integracaoSchema", () => {
  it("accepts valid integracao", () => {
    const result = integracaoSchema.safeParse({
      nome: "ERP Bling",
      tipo: "bling",
    })
    expect(result.success).toBe(true)
  })

  it("accepts config object", () => {
    const result = integracaoSchema.safeParse({
      nome: "ERP",
      tipo: "bling",
      config: { apiKey: "abc", url: "https://api.bling.com.br" },
    })
    expect(result.success).toBe(true)
  })
})

describe("validateRequest", () => {
  it("returns data on valid input", async () => {
    const { validateRequest } = await import("./validation")
    const result = validateRequest(clienteSchema, {
      nome: "Teste",
      cnpj: "00.000.000/0001-00",
    })
    if ("error" in result) {
      expect.unreachable("should not return error")
    } else {
      expect(result.data.nome).toBe("Teste")
    }
  })

  it("returns NextResponse on invalid input", async () => {
    const { validateRequest } = await import("./validation")
    const result = validateRequest(clienteSchema, { nome: "", cnpj: "" })
    if ("data" in result) {
      expect.unreachable("should not return data")
    } else {
      expect(result.error.status).toBe(400)
    }
  })
})
