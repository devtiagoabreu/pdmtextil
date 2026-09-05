import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { configGeral } from "@/lib/db/schema/config-geral"
import { notificacoes } from "@/lib/db/schema/notificacoes"
import { crmWhatsappBotLogs } from "@/lib/db/schema/crm-whatsapp-bot-logs"

const mocks = vi.hoisted(() => ({
  db: { select: vi.fn(), insert: vi.fn() },
  sendEmail: vi.fn(),
  registrarLogBot: vi.fn(),
}))

vi.mock("@/lib/db", () => ({ db: mocks.db }))
vi.mock("@/lib/email", () => ({ sendEmail: mocks.sendEmail }))
vi.mock("@/lib/whatsapp/bot-log", () => ({ registrarLogBot: mocks.registrarLogBot }))

import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { registrarLogBot } from "@/lib/whatsapp/bot-log"
import {
  evolutionConfigurada,
  verificarSaudeEvolution,
  lerConfigMonitoramento,
  salvarConfigMonitoramento,
  executarMonitoramento,
} from "@/lib/whatsapp/monitoramento"

const rollback: Array<[string, string | undefined]> = []
function setEnv(clave: string, valor: string | undefined) {
  rollback.push([clave, process.env[clave]])
  if (valor === undefined) delete process.env[clave]
  else process.env[clave] = valor
}

const CONFIG_JSON = (sobre: Record<string, unknown> = {}) =>
  JSON.stringify({
    ativo: true,
    emailAlerta: true,
    notificacaoPdm: true,
    ultimoCheck: null,
    ultimoStatus: null,
    ultimoErro: null,
    ...sobre,
  })

const RESPOSTA_OPEN = {
  ok: true,
  status: 200,
  text: () => Promise.resolve(JSON.stringify({ instance: { status: "open" } })),
}

function mockSelectSequencia(itens: any[]) {
  const fila = [...itens]
  db.select.mockImplementation(() => {
    const r = fila.length ? fila.shift() : itens[itens.length - 1] ?? []
    return createQueryBuilder(r)
  })
}

function mockInsertRegistros() {
  const chamadas: { table: any; builder: any }[] = []
  db.insert.mockImplementation((table: any) => {
    const builder = createQueryBuilder("ok")
    chamadas.push({ table, builder })
    return builder
  })
  return chamadas
}

function valoresDo(chamadas: { table: any; builder: any }[], table: any): any[] {
  const c = chamadas.find(x => x.table === table)
  return c?.builder.values.mock.calls.map((call: any) => call[0]) ?? []
}

function linerConfig(sobre: Record<string, unknown> = {}) {
  return [{ chave: "bot_monitoramento", valor: CONFIG_JSON(sobre) }]
}

describe("evolutionConfigurada", () => {
  afterEach(() => {
    for (const [k, v] of rollback.splice(0)) setEnv(k, v)
  })

  it("retorna false quando as variáveis não existem", () => {
    delete process.env.EVOLUTION_API_URL
    delete process.env.EVOLUTION_API_KEY
    delete process.env.EVOLUTION_INSTANCE_NAME
    expect(evolutionConfigurada()).toBe(false)
  })

  it("retorna true quando todas as variáveis existem", () => {
    setEnv("EVOLUTION_API_URL", "https://evo.test")
    setEnv("EVOLUTION_API_KEY", "chave")
    setEnv("EVOLUTION_INSTANCE_NAME", "instancia1")
    expect(evolutionConfigurada()).toBe(true)
  })
})

describe("verificarSaudeEvolution", () => {
  let fetchOriginal: typeof fetch
  beforeEach(() => {
    fetchOriginal = globalThis.fetch
    globalThis.fetch = vi.fn()
    resetDb(db)
  })
  afterEach(() => {
    globalThis.fetch = fetchOriginal
    for (const [k, v] of rollback.splice(0)) setEnv(k, v)
  })

  it("informa NAO_CONFIGURADO sem variáveis de ambiente", async () => {
    delete process.env.EVOLUTION_API_URL
    delete process.env.EVOLUTION_API_KEY
    delete process.env.EVOLUTION_INSTANCE_NAME
    const saude = await verificarSaudeEvolution()
    expect(saude.online).toBe(false)
    expect(saude.instanciaStatus).toBe("NAO_CONFIGURADO")
    expect(saude.detalhe).toContain("não configuradas")
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it("considera online quando a API responde com status open", async () => {
    setEnv("EVOLUTION_API_URL", "https://evo.test/")
    setEnv("EVOLUTION_API_KEY", "chave")
    setEnv("EVOLUTION_INSTANCE_NAME", "instancia1")
    ;(globalThis.fetch as any).mockResolvedValue(RESPOSTA_OPEN)
    const saude = await verificarSaudeEvolution()
    expect(saude.online).toBe(true)
    expect(saude.instanciaStatus).toBe("open")
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://evo.test/instance/connectionState/instancia1",
      expect.objectContaining({ method: "GET", headers: { apikey: "chave" } })
    )
  })

  it("marca offline quando a instância está desconectada (status close)", async () => {
    setEnv("EVOLUTION_API_URL", "https://evo.test")
    setEnv("EVOLUTION_API_KEY", "chave")
    setEnv("EVOLUTION_INSTANCE_NAME", "instancia1")
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ instance: { status: "close" } })),
    })
    const saude = await verificarSaudeEvolution()
    expect(saude.online).toBe(false)
    expect(saude.instanciaStatus).toBe("close")
    expect(saude.detalhe).toContain("close")
  })

  it("marca offline quando a API falha a conexão", async () => {
    setEnv("EVOLUTION_API_URL", "https://evo.test")
    setEnv("EVOLUTION_API_KEY", "chave")
    setEnv("EVOLUTION_INSTANCE_NAME", "instancia1")
    ;(globalThis.fetch as any).mockRejectedValue(new Error("network down"))
    const saude = await verificarSaudeEvolution()
    expect(saude.online).toBe(false)
    expect(saude.instanciaStatus).toBe("ERRO_CONEXAO")
    expect(saude.detalhe).toContain("network down")
  })
})

describe("lerConfigMonitoramento", () => {
  beforeEach(() => resetDb(db))

  it("retorna os padrões quando não há configuração salva", async () => {
    mockSelectSequencia([])
    const cfg = await lerConfigMonitoramento()
    expect(cfg).toEqual({
      ativo: true,
      emailAlerta: true,
      notificacaoPdm: true,
      ultimoCheck: null,
      ultimoStatus: null,
      ultimoErro: null,
    })
  })

  it("parseia a configuração salva", async () => {
    mockSelectSequencia([[{ chave: "bot_monitoramento", valor: CONFIG_JSON({ ativo: false, ultimoStatus: "falha", ultimoErro: "x" }) }]])
    const cfg = await lerConfigMonitoramento()
    expect(cfg.ativo).toBe(false)
    expect(cfg.ultimoStatus).toBe("falha")
    expect(cfg.ultimoErro).toBe("x")
    expect(cfg.emailAlerta).toBe(true)
  })

  it("ignora JSON inválido e retorna os padrões", async () => {
    mockSelectSequencia([[{ chave: "bot_monitoramento", valor: "{corrompido" }]])
    const cfg = await lerConfigMonitoramento()
    expect(cfg.ativo).toBe(true)
    expect(cfg.ultimoStatus).toBeNull()
  })

  it("retorna padrões se a consulta falhar", async () => {
    db.select.mockImplementation(() => {
      throw new Error("db fora do ar")
    })
    const cfg = await lerConfigMonitoramento()
    expect(cfg.ativo).toBe(true)
  })
})

describe("salvarConfigMonitoramento", () => {
  beforeEach(() => resetDb(db))

  it("deixa campos não informados intactos e grava como JSON", async () => {
    mockSelectSequencia([linerConfig({ ultimoStatus: "falha", ultimoErro: "antigo" })])
    const chamadas = mockInsertRegistros()
    await salvarConfigMonitoramento({ ativo: false })
    const v = valoresDo(chamadas, configGeral)[0]
    expect(v.chave).toBe("bot_monitoramento")
    const salvo = JSON.parse(v.valor) as any
    expect(salvo.ativo).toBe(false)
    expect(salvo.ultimoStatus).toBe("falha")
    expect(salvo.ultimoErro).toBe("antigo")
    expect(chamadas[0].builder.onConflictDoUpdate).toHaveBeenCalled()
  })
})

describe("executarMonitoramento", () => {
  let fetchOriginal: typeof fetch
  beforeEach(() => {
    fetchOriginal = globalThis.fetch
    globalThis.fetch = vi.fn()
    resetDb(db)
    vi.clearAllMocks()
    setEnv("EVOLUTION_API_URL", "https://evo.test")
    setEnv("EVOLUTION_API_KEY", "chave")
    setEnv("EVOLUTION_INSTANCE_NAME", "instancia1")
  })
  afterEach(() => {
    globalThis.fetch = fetchOriginal
    for (const [k, v] of rollback.splice(0)) setEnv(k, v)
  })

  it("não verifica quando o monitoramento está desativado", async () => {
    mockSelectSequencia([linerConfig({ ativo: false })])
    const chamadas = mockInsertRegistros()
    const r = await executarMonitoramento()
    expect(r.verificado).toBe(false)
    expect(r.motivo).toBe("monitoramento_desativado")
    expect(r.alertaEnviado).toBe(false)
    expect(globalThis.fetch).not.toHaveBeenCalled()
    expect(valoresDo(chamadas, crmWhatsappBotLogs)).toHaveLength(0)
  })

  it("registra OK, não alerta e salva ultimoStatus ok quando está online", async () => {
    mockSelectSequencia([linerConfig()])
    const chamadas = mockInsertRegistros()
    ;(globalThis.fetch as any).mockResolvedValue(RESPOSTA_OPEN)

    const r = await executarMonitoramento()
    expect(r.verificado).toBe(true)
    expect(r.online).toBe(true)
    expect(r.alertaEnviado).toBe(false)

    expect(registrarLogBot).toHaveBeenCalledWith(expect.objectContaining({ tipo: "OK", status: "ok" }))
    expect(registrarLogBot).not.toHaveBeenCalledWith(expect.objectContaining({ tipo: "ALERTA" }))

    const cfgSalvo = JSON.parse(valoresDo(chamadas, configGeral)[0].valor) as any
    expect(cfgSalvo.ultimoStatus).toBe("ok")
    expect(cfgSalvo.ultimoCheck).not.toBeNull()
    expect(cfgSalvo.ultimoErro).toBeNull()

    expect(sendEmail).not.toHaveBeenCalled()
  })

  it("alerta por email e notificação no PDM na transição para falha", async () => {
    const admins = [
      { id: 1, name: "Ana", email: "ana@teste.com" },
      { id: 2, name: "Bia", email: "bia@teste.com" },
    ]
    mockSelectSequencia([linerConfig(), admins])
    const chamadas = mockInsertRegistros()
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ instance: { status: "close" } })),
    })
    vi.mocked(sendEmail).mockResolvedValue({ sent: 2, error: null } as any)

    const r = await executarMonitoramento()
    expect(r.verificado).toBe(true)
    expect(r.online).toBe(false)
    expect(r.alertaEnviado).toBe(true)

    expect(registrarLogBot).toHaveBeenCalledWith(expect.objectContaining({ tipo: "FALHA", status: "falha" }))
    expect(registrarLogBot).toHaveBeenCalledWith(expect.objectContaining({ tipo: "ALERTA", status: "alerta" }))

    expect(vi.mocked(sendEmail)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(sendEmail).mock.calls[0][0].to).toEqual(["ana@teste.com", "bia@teste.com"])
    expect(vi.mocked(sendEmail).mock.calls[0][0].subject).toContain("fora do ar")
    expect(vi.mocked(sendEmail).mock.calls[0][0].html).toContain("PDM Têxtil")

    const notif = valoresDo(chamadas, notificacoes)[0] as any[]
    expect(notif).toHaveLength(2)
    expect(notif[0]).toMatchObject({ tipo: "WHATSAPP_BOT_MONITOR", usuarioId: 1, lida: false, link: "/admin/bot-config" })

    const cfgSalvo = JSON.parse(valoresDo(chamadas, configGeral)[0].valor) as any
    expect(cfgSalvo.ultimoStatus).toBe("falha")
    expect(cfgSalvo.ultimoErro).toContain("close")
  })

  it("não re-alerta quando já está em falha (dedup)", async () => {
    mockSelectSequencia([linerConfig({ ultimoStatus: "falha", ultimoErro: "anterior" })])
    const chamadas = mockInsertRegistros()
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ instance: { status: "close" } })),
    })

    const r = await executarMonitoramento()
    expect(r.verificado).toBe(true)
    expect(r.online).toBe(false)
    expect(r.alertaEnviado).toBe(false)

    expect(registrarLogBot).toHaveBeenCalledWith(expect.objectContaining({ tipo: "FALHA" }))
    expect(registrarLogBot).not.toHaveBeenCalledWith(expect.objectContaining({ tipo: "ALERTA" }))
    expect(sendEmail).not.toHaveBeenCalled()
    expect(valoresDo(chamadas, notificacoes)).toHaveLength(0)
  })

  it("registra recuperação quando o bot volta ao ar após falha", async () => {
    mockSelectSequencia([linerConfig({ ultimoStatus: "falha", ultimoErro: "anterior" })])
    mockInsertRegistros()
    ;(globalThis.fetch as any).mockResolvedValue(RESPOSTA_OPEN)

    const r = await executarMonitoramento()
    expect(r.verificado).toBe(true)
    expect(r.online).toBe(true)
    expect(r.alertaEnviado).toBe(false)
    expect(registrarLogBot).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: "OK", detalhe: expect.objectContaining({ recuperado: true }) })
    )
  })
})