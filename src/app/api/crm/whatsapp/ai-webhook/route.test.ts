// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { createQueryBuilder } from "@/test/route-db-mock"
import { db } from "@/lib/db"
import { enviarMensagem, evolutionConfigurado } from "@/lib/evolution-api"
import { POST } from "./route"

vi.mock("@/lib/db", () => ({ db: { select: vi.fn(), insert: vi.fn() } }))
vi.mock("@/lib/evolution-api", () => ({
  evolutionConfigurado: vi.fn(() => false),
  enviarMensagem: vi.fn(async () => ({ sucesso: true })),
}))
vi.mock("@/lib/whatsapp/retry-processor", () => ({ enfileirarRetry: vi.fn() }))
vi.mock("@/lib/whatsapp/helpers", () => ({
  logStep: vi.fn(),
  extrairMensagem: (body: any) => body?.texto || "",
  extrairNumero: (jid: string) => jid.split("@")[0],
}))
vi.mock("@/lib/whatsapp/validation", () => ({
  rejeitarNome: vi.fn(() => false),
  negou: vi.fn(() => false),
  confirmou: vi.fn(() => false),
  pareceNome: vi.fn(() => true),
  detectarTipo: vi.fn(() => null),
  extrairDoc: vi.fn(() => null),
  parseLinhas: vi.fn(() => []),
  linhasNomes: vi.fn(() => []),
  pediuAtendente: vi.fn(() => false),
  pediuReiniciar: vi.fn(() => false),
}))
vi.mock("@/lib/whatsapp/state-machine", () => ({
  maquinaEstados: vi.fn(() => ({ nextEstado: "SAUDACAO", dados: {}, finalizado: false, enviarCatalogo: [], needsCnpjLookup: false, redirecionarPf: false })),
}))
vi.mock("@/lib/whatsapp/lead-scoring", () => ({ calcularLeadScore: vi.fn(() => ({ score: 0, prioridade: "BAIXA", motivos: [] })) }))
vi.mock("@/lib/whatsapp/groq", () => ({ chamarGroq: vi.fn(async () => ({ conteudo: "", provedor: "groq", modelo: "x", nomeChave: "", tentativas: 1 })), extrairDadosLead: vi.fn(async () => ({})) }))
vi.mock("@/lib/whatsapp/cnpj", () => ({ consultarCNPJ: vi.fn() }))
vi.mock("@/lib/whatsapp/prompt", () => ({ buildSystemPrompt: vi.fn(() => "") }))
vi.mock("@/lib/whatsapp/abandon-checker", () => ({ verificarAbandonos: vi.fn() }))

const PJ = "5519988887777@s.whatsapp.net"

const insertedValues: any[] = []

function capturarInsert(result = undefined) {
  const builder = createQueryBuilder(result)
  const originalValues = builder.values
  builder.values = vi.fn((v: any) => {
    insertedValues.push(v)
    return originalValues(v)
  })
  return builder
}

function makeRequest(): NextRequest {
  return new NextRequest("https://pdm.vercel.app/api/crm/whatsapp/ai-webhook", {
    method: "POST",
    headers: { authorization: "Bearer secret-teste" },
    body: JSON.stringify({ data: { key: { remoteJid: PJ }, pushName: "Maria", fromMe: false }, texto: "Oi, preciso de atendimento" }),
  })
}

beforeEach(() => {
  process.env.PDM_WEBHOOK_SECRET = "secret-teste"
  insertedValues.length = 0
  vi.mocked(db.select).mockReset()
  vi.mocked(db.insert).mockReset()
  vi.mocked(db.insert).mockImplementation(() => capturarInsert())
})

describe("ai-webhook — retorno de cliente antigo", () => {
  it("avisa 'que bom te-lo de volta', re-notifica o representante e cria notificacao WHENATSAPP_RETORNO", async () => {
    vi.mocked(evolutionConfigurado).mockReturnValue(true)

    const conversa = {
      id: 1,
      remoteJid: PJ,
      estado: "AGUARDANDO_REPRESENTANTE",
      dados: {},
      updatedAt: new Date(),
    }

    const lead = { id: 42, nome: "Maria", tipoPessoa: "PJ" }

    let selectCall = 0
    vi.mocked(db.select).mockImplementation(() => {
      selectCall++
      if (selectCall === 1) return createQueryBuilder([]) // idempotency
      if (selectCall === 2) return createQueryBuilder([conversa]) // conversa existente
      if (selectCall === 3) return createQueryBuilder([]) // linhas ativas
      if (selectCall === 4) return createQueryBuilder([lead]) // lead retorno
      return createQueryBuilder([])
    })

    const res = await POST(makeRequest())
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.reason).toBe("conversation_ended")
    expect(json.retorno).toBe(true)

    const enviadas = vi.mocked(enviarMensagem).mock.calls
    const msgCliente = enviadas.find(c => c[0] === PJ)
    expect(msgCliente).toBeDefined()
    expect(msgCliente![1]).toContain("Que bom te-lo(a) de volta")
    expect(msgCliente![1]).toContain("informar seu representante")

    const msgRep = enviadas.find(c => c[0] === "5519999999999@s.whatsapp.net")
    expect(msgRep).toBeDefined()
    expect(msgRep![1]).toContain("Cliente antigo entrou em contato novamente")
    expect(msgRep![1]).toContain("Pessoa Juridica")

    const inserts = insertedValues
    expect(inserts.some(v => v?.tipo === "WHATSAPP_RETORNO")).toBe(true)
    expect(selectCall).toBeGreaterThanOrEqual(4)
  })
})
