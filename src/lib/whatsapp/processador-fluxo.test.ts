// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { createQueryBuilder } from "@/test/route-db-mock"
import { executarFluxo } from "./processador"

vi.mock("@/lib/db", () => ({ db: { select: vi.fn(), insert: vi.fn(), update: vi.fn() } }))
vi.mock("@/lib/evolution-api", () => ({
  evolutionConfigurado: vi.fn(() => false),
  enviarMensagem: vi.fn(async () => ({ sucesso: true })),
}))
vi.mock("@/lib/whatsapp/retry-processor", () => ({ enfileirarRetry: vi.fn() }))
vi.mock("@/lib/whatsapp/groq", () => ({
  chamarGroq: vi.fn(async () => ({ conteudo: "Entendido.", provedor: "mock", modelo: "mock", nomeChave: "", tentativas: 1 })),
  extrairDadosLead: vi.fn(async () => ({})),
}))
vi.mock("@/lib/whatsapp/cnpj", () => ({ consultarCNPJ: vi.fn() }))
vi.mock("@/lib/whatsapp/status", () => ({ registrarExternalIdEnviada: vi.fn() }))
vi.mock("@/lib/whatsapp/helpers", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/whatsapp/helpers")>()
  return { ...mod, logStep: vi.fn() }
})

import { db } from "@/lib/db"
import { consultarCNPJ } from "@/lib/whatsapp/cnpj"

const JID = "5519988887777@s.whatsapp.net"
const numero = "5519988887777"
const LINHA = { id: 1, numero: 1, nome: "Malha", ativo: true, createdAt: new Date(), updatedAt: new Date() }

function makeRequest(texto: string): NextRequest {
  return new NextRequest("https://pdm.vercel.app/api/crm/whatsapp/ai-webhook", {
    method: "POST",
    headers: { authorization: "Bearer secret-fluxo" },
    body: JSON.stringify({
      data: {
        key: { remoteJid: JID, fromMe: false },
        pushName: "Maria",
        message: { conversation: texto },
        messageType: "conversation",
      },
      texto,
    }),
  })
}

const insertedValues: any[] = []

function setupTurn(selects: any[], conversaId: number, updateResult?: any[]) {
  let i = 0
  vi.mocked(db.select).mockReset()
  vi.mocked(db.select).mockImplementation(() => {
    const result = selects[i++] ?? []
    const builder = createQueryBuilder(result)
    return builder
  })
  vi.mocked(db.insert).mockReset()
  vi.mocked(db.insert).mockImplementation(() => {
    const builder = createQueryBuilder([{ id: conversaId }])
    const origValues = builder.values
    builder.values = vi.fn((v: any) => {
      insertedValues.push(JSON.parse(JSON.stringify(v)))
      return origValues(v)
    })
    return builder
  })
  vi.mocked(db.update).mockReset()
  vi.mocked(db.update).mockImplementation(() => createQueryBuilder(updateResult ?? [{ id: conversaId }]))
}

beforeEach(() => {
  process.env.PDM_WEBHOOK_SECRET = "secret-fluxo"
  insertedValues.length = 0
})

describe("executarFluxo — funil completo PJ (CNPJ via API)", () => {
  it("percorre SAUDACAO → COLETANDO_DOC → CONFIRMANDO_DADOS_CNPJ → COLETANDO_INTERESSE → CONFIRMACAO → ENCERRADO e cria lead", async () => {
    vi.mocked(consultarCNPJ).mockResolvedValue({
      razaoSocial: "Tecidos Maria LTDA",
      nomeFantasia: "Malharia Maria",
      situacao: "ATIVA",
      endereco: "Rua das Flores 100",
      bairro: "Centro",
      cidade: "Sao Paulo",
      uf: "SP",
    } as any)

    // Turno 1 — nova conversa, cliente se apresenta
    const conv1 = { id: 1, remoteJid: JID, estado: "SAUDACAO", dados: {}, updatedAt: new Date() }
    setupTurn(
      [
        [], // idempotency
        [], // lock: conversa existente? (nao)
        [], // lock: lead existente? (nao)
        [conv1], // find_conversation
        [LINHA], // linhas ativas
        [], // historico
      ],
      1,
      [] // lock claim nao acha linha → cria conversa
    )

    const res1 = await executarFluxo(makeRequest("Maria"))
    const j1 = await res1.json()
    expect(j1.estado).toBe("COLETANDO_DOC")

    // Turno 2 — informa CNPJ → consulta pública → pede confirmacao
    const conv2 = { id: 1, remoteJid: JID, estado: "COLETANDO_DOC", dados: { nome: "Maria" }, updatedAt: new Date() }
    setupTurn(
      [
        [],
        [conv2],
        [LINHA],
        [],
      ],
      1
    )

    const res2 = await executarFluxo(makeRequest("sou PJ, meu CNPJ é 12345678000199"))
    const j2 = await res2.json()
    expect(j2.cnpjLookup).toBe(true)

    // Turno 3 — confirma dados do CNPJ
    const conv3 = {
      id: 1,
      remoteJid: JID,
      estado: "CONFIRMANDO_DADOS_CNPJ",
      dados: {
        nome: "Maria",
        tipoPessoa: "PJ",
        documento: "12345678000199",
        razaoSocial: "Tecidos Maria LTDA",
        _cnpjConsulta: { razaoSocial: "Tecidos Maria LTDA", nomeFantasia: "Malharia Maria" },
      },
      updatedAt: new Date(),
    }
    setupTurn([[],[conv3],[LINHA],[]], 1)

    const res3 = await executarFluxo(makeRequest("sim"))
    const j3 = await res3.json()
    expect(j3.estado).toBe("COLETANDO_INTERESSE")

    // Turno 4 — escolhe linha 1
    const conv4 = {
      id: 1,
      remoteJid: JID,
      estado: "COLETANDO_INTERESSE",
      dados: {
        nome: "Maria",
        tipoPessoa: "PJ",
        documento: "12345678000199",
        razaoSocial: "Tecidos Maria LTDA",
        _cnpjConsulta: { razaoSocial: "Tecidos Maria LTDA", nomeFantasia: "Malharia Maria" },
      },
      updatedAt: new Date(),
    }
    setupTurn([[],[conv4],[LINHA],[]], 1)

    const res4 = await executarFluxo(makeRequest("1"))
    const j4 = await res4.json()
    expect(j4.estado).toBe("CONFIRMACAO")

    // Turno 5 — confirma tudo → ENCERRADO + cria lead
    const conv5 = {
      id: 1,
      remoteJid: JID,
      estado: "CONFIRMACAO",
      dados: {
        nome: "Maria",
        tipoPessoa: "PJ",
        documento: "12345678000199",
        razaoSocial: "Tecidos Maria LTDA",
        _cnpjConsulta: { razaoSocial: "Tecidos Maria LTDA", nomeFantasia: "Malharia Maria" },
        linhasInteresse: [1],
        linhasInteresseNomes: "1 - Malha",
      },
      updatedAt: new Date(),
    }
    setupTurn([[],[conv5],[LINHA],[],[],[]], 500)

    const res5 = await executarFluxo(makeRequest("sim"))
    const j5 = await res5.json()
    expect(j5.status).toBe("ok")
    expect(j5.estado).toBe("ENCERRADO")
    expect(j5.leadCriado).toBe(true)
    expect(j5.leadId).toBe(500)

    // Mensagens persistidas incluem a confirmacao do CNPJ
    const enviadas = insertedValues.filter(v => v?.tipo === "ENVIADA")
    const msgCnpj = enviadas.find(v => String(v.mensagem).includes("Tecidos Maria LTDA"))
    expect(msgCnpj).toBeDefined()
    expect(String(msgCnpj.mensagem)).toContain("*Razao Social:* Tecidos Maria LTDA")

    // Lead criado com dados do fluxo + CNPJ enriquecido
    const leadInsert = insertedValues.find(v => v?.idIntegracao === `whatsapp:${JID}`)
    expect(leadInsert).toBeDefined()
    expect(leadInsert.nome).toBe("Malharia Maria")
    expect(leadInsert.empresaNome).toBe("Tecidos Maria LTDA")
    expect(leadInsert.tipoPessoa).toBe("PJ")
    expect(leadInsert.documento).toBe("12345678000199")
    expect(leadInsert.celular).toBe(numero)
    expect(leadInsert.origem).toBe("WHATSAPP")

    // Conversa finalizada como ENCERRADO
    expect(insertedValues.some(v => v?.remoteJid === JID && v?.estado === "ENCERRADO")).toBe(true)
  })
})

describe("executarFluxo — funil completo PF (CPF direto, sem consulta)", () => {
  it("finaliza com lead PF", async () => {
    const conv1 = { id: 1, remoteJid: JID, estado: "SAUDACAO", dados: {}, updatedAt: new Date() }
    setupTurn(
      [[],[],[],[conv1],[LINHA],[]],
      1,
      [] // lock claim nao acha linha → cria conversa
    )
    const res1 = await executarFluxo(makeRequest("Carlos"))
    expect((await res1.json()).estado).toBe("COLETANDO_DOC")

    const conv2 = { id: 1, remoteJid: JID, estado: "COLETANDO_DOC", dados: { nome: "Carlos" }, updatedAt: new Date() }
    setupTurn([[],[conv2],[LINHA],[]], 1)
    const res2 = await executarFluxo(makeRequest("meu cpf é 12345678901"))
    expect((await res2.json()).estado).toBe("COLETANDO_INTERESSE")

    const conv3 = {
      id: 1,
      remoteJid: JID,
      estado: "COLETANDO_INTERESSE",
      dados: { nome: "Carlos", tipoPessoa: "PF", documento: "12345678901" },
      updatedAt: new Date(),
    }
    setupTurn([[],[conv3],[LINHA],[]], 1)
    const res3 = await executarFluxo(makeRequest("1"))
    expect((await res3.json()).estado).toBe("CONFIRMACAO")

    const conv4 = {
      id: 1,
      remoteJid: JID,
      estado: "CONFIRMACAO",
      dados: { nome: "Carlos", tipoPessoa: "PF", documento: "12345678901", linhasInteresse: [1], linhasInteresseNomes: "1 - Malha" },
      updatedAt: new Date(),
    }
    setupTurn([[],[conv4],[LINHA],[],[],[]], 501)

    const res4 = await executarFluxo(makeRequest("sim"))
    const j4 = await res4.json()
    expect(j4.estado).toBe("ENCERRADO")
    expect(j4.leadCriado).toBe(true)

    const leadInsert = insertedValues.find(v => v?.idIntegracao === `whatsapp:${JID}`)
    expect(leadInsert).toBeDefined()
    expect(leadInsert.nome).toBe("Carlos")
    expect(leadInsert.tipoPessoa).toBe("PF")
    expect(leadInsert.documento).toBe("12345678901")
  })
})