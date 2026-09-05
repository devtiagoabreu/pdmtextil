import { db } from "@/lib/db"
import { configGeral } from "@/lib/db/schema/config-geral"
import { notificacoes } from "@/lib/db/schema/notificacoes"
import { usuarios } from "@/lib/db/schema/usuarios"
import { and, eq, inArray, isNotNull } from "drizzle-orm"
import { registrarLogBot } from "@/lib/whatsapp/bot-log"
import { sendEmail } from "@/lib/email"

const CONFIG_CHAVE = "bot_monitoramento"
const ROLES_ADMIN = ["ADMIN", "SUDO"]

export interface ConfigMonitoramento {
  ativo: boolean
  emailAlerta: boolean
  notificacaoPdm: boolean
  ultimoCheck: string | null
  ultimoStatus: string | null
  ultimoErro: string | null
}

export interface SaudeEvolution {
  online: boolean
  instanciaStatus: string
  detalhe: string
  apiUrl: string
  instancia: string
}

export interface ResultadoMonitoramento {
  verificado: boolean
  motivo?: string
  online?: boolean
  instanciaStatus?: string
  detalhe?: string
  alertaEnviado: boolean
  alertaDetalhe?: string | null
}

const CONFIG_DEFAULT: ConfigMonitoramento = {
  ativo: true,
  emailAlerta: true,
  notificacaoPdm: true,
  ultimoCheck: null,
  ultimoStatus: null,
  ultimoErro: null,
}

export function evolutionConfigurada(): boolean {
  return !!(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY && process.env.EVOLUTION_INSTANCE_NAME)
}

export function verificarSaudeEvolution(): Promise<SaudeEvolution> {
  const apiUrl = (process.env.EVOLUTION_API_URL || "").replace(/\/$/, "")
  const instancia = process.env.EVOLUTION_INSTANCE_NAME || ""

  if (!evolutionConfigurada()) {
    return Promise.resolve({
      online: false,
      instanciaStatus: "NAO_CONFIGURADO",
      detalhe: "Variáveis EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE_NAME não configuradas",
      apiUrl,
      instancia,
    })
  }

  return fetch(`${apiUrl}/instance/connectionState/${instancia}`, {
    method: "GET",
    headers: { apikey: process.env.EVOLUTION_API_KEY || "" },
  })
    .then(async (res) => {
      const texto = await res.text()
      let status = ""
      if (res.ok) {
        try {
          const data = JSON.parse(texto)
          status = data?.instance?.status || data?.status || ""
        } catch {
          status = ""
        }
      }
      const online = res.ok && status === "open"
      return {
        online,
        instanciaStatus: online ? "open" : status || `HTTP ${res.status}`,
        detalhe: online
          ? "Instância conectada ao WhatsApp (status open)"
          : `Instância ${status || `HTTP ${res.status}`} — resposta da Evolution API: ${texto.slice(0, 300) || "sem corpo"}`,
        apiUrl,
        instancia,
      }
    })
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err)
      return {
        online: false,
        instanciaStatus: "ERRO_CONEXAO",
        detalhe: `Falha ao consultar a Evolution API: ${msg}`,
        apiUrl,
        instancia,
      }
    })
}

export async function lerConfigMonitoramento(): Promise<ConfigMonitoramento> {
  try {
    const [cfg] = await db.select().from(configGeral).where(eq(configGeral.chave, CONFIG_CHAVE)).limit(1)
    if (!cfg?.valor) return { ...CONFIG_DEFAULT }
    const parsed = JSON.parse(cfg.valor) as Partial<ConfigMonitoramento>
    return {
      ativo: typeof parsed.ativo === "boolean" ? parsed.ativo : CONFIG_DEFAULT.ativo,
      emailAlerta: typeof parsed.emailAlerta === "boolean" ? parsed.emailAlerta : CONFIG_DEFAULT.emailAlerta,
      notificacaoPdm: typeof parsed.notificacaoPdm === "boolean" ? parsed.notificacaoPdm : CONFIG_DEFAULT.notificacaoPdm,
      ultimoCheck: parsed.ultimoCheck ?? null,
      ultimoStatus: parsed.ultimoStatus ?? null,
      ultimoErro: parsed.ultimoErro ?? null,
    }
  } catch {
    return { ...CONFIG_DEFAULT }
  }
}

export async function salvarConfigMonitoramento(
  parcial: Partial<ConfigMonitoramento>
): Promise<void> {
  const atual = await lerConfigMonitoramento()
  const novo = { ...atual, ...parcial }
  await db
    .insert(configGeral)
    .values({ chave: CONFIG_CHAVE, valor: JSON.stringify(novo) })
    .onConflictDoUpdate({
      target: configGeral.chave,
      set: { valor: JSON.stringify(novo), updatedAt: new Date() },
    })
}

async function buscarAdmins() {
  try {
    return (await db
      .select({ id: usuarios.id, name: usuarios.name, email: usuarios.email })
      .from(usuarios)
      .where(
        and(
          eq(usuarios.ativo, true),
          inArray(usuarios.role, ROLES_ADMIN),
          isNotNull(usuarios.email)
        )
      )) as { id: number; name: string; email: string }[]
  } catch {
    return []
  }
}

function montarTextoAlerta(saude: SaudeEvolution): string {
  const horario = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
  return [
    "*Alerta: atendente automatico (Evolution API) fora do ar*",
    "",
    `Instancia: ${saude.instancia || "nao definida"}`,
    `Status: ${saude.instanciaStatus}`,
    `API: ${saude.apiUrl || "nao definida"}`,
    `Verificado em: ${horario}`,
    "",
    `Detalhe: ${saude.detalhe}`,
    "",
    "O bot nao conseguiu responder mensagens. Verifique a conexao da instancia do WhatsApp.",
  ].join("\n")
}

function montarHtmlAlerta(saude: SaudeEvolution): string {
  const horario = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
  const linha = (k: string, v: string) =>
    `<tr><td style="padding:6px 12px;border:1px solid #e2e8f0;color:#64748b">${k}</td><td style="padding:6px 12px;border:1px solid #e2e8f0">${v}</td></tr>`
  return `<div style="font-family:Arial,sans-serif;padding:20px;max-width:600px">
<h2 style="color:#b42318">PDM Têxtil - Alerta de bot</h2>
<p>O atendente automatico do WhatsApp (Evolution API) está <strong>fora do ar</strong>.</p>
<table style="border-collapse:collapse;margin:12px 0;width:100%">
${linha("Instância", saude.instancia || "não definida")}
${linha("Status", saude.instanciaStatus)}
${linha("API", saude.apiUrl || "não definida")}
${linha("Verificado em", horario)}
${linha("Detalhe", saude.detalhe)}
</table>
<p><a href="https://pdmprotextil.vercel.app/admin/bot-config" style="background:#b42318;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block">Abrir painel do bot</a></p>
<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0" />
<p style="color:#94a3b8;font-size:12px">Sistema PDM Têxtil</p>
</div>`
}

export async function enviarAlertaMonitoramento(
  saude: SaudeEvolution,
  config?: ConfigMonitoramento
): Promise<{
  emailEnviado: boolean
  notificacoesCriadas: number
}> {
  const cfg = config ?? (await lerConfigMonitoramento())
  const admins = await buscarAdmins()
  const emails = admins.map(a => a.email).filter((e): e is string => !!e && e.includes("@"))

  let emailEnviado = false
  if (cfg.emailAlerta && emails.length > 0) {
    const resultado = await sendEmail({
      to: emails,
      subject: "[PDM Têxtil] Bot WhatsApp fora do ar",
      html: montarHtmlAlerta(saude),
    }).catch(() => ({ sent: 0, error: "erro" }))
    emailEnviado = (resultado.sent ?? 0) > 0
  }

  let notificacoesCriadas = 0
  if (cfg.notificacaoPdm && admins.length > 0) {
    await db.insert(notificacoes).values(
      admins.map(a => ({
        tipo: "WHATSAPP_BOT_MONITOR",
        mensagem: montarTextoAlerta(saude),
        usuarioId: a.id,
        usuarioNome: a.name,
        link: "/admin/bot-config",
        lida: false,
      }))
    )
    notificacoesCriadas = admins.length
  }

  return { emailEnviado, notificacoesCriadas }
}

export async function executarMonitoramento(): Promise<ResultadoMonitoramento> {
  let config = await lerConfigMonitoramento()

  if (!config.ativo) {
    return {
      verificado: false,
      motivo: "monitoramento_desativado",
      alertaEnviado: false,
    }
  }

  const saude = await verificarSaudeEvolution()
  const anterior = config.ultimoStatus
  const statusAtual = saude.online ? "ok" : "falha"
  const transicaoFalha = !saude.online && (!anterior || anterior !== "falha")

  await registrarLogBot({
    tipo: saude.online ? "OK" : "FALHA",
    origem: "monitor",
    status: statusAtual,
    detalhe: {
      instanciaStatus: saude.instanciaStatus,
      apiUrl: saude.apiUrl,
      instancia: saude.instancia,
      detalhe: saude.detalhe,
      recuperado: saude.online && anterior === "falha",
    },
    erro: saude.online ? null : saude.detalhe,
  })

  let alertaEnviado = false
  let alertaDetalhe: string | null = null
  if (transicaoFalha) {
    const resultado = await enviarAlertaMonitoramento(saude, config)
    alertaEnviado = resultado.emailEnviado || resultado.notificacoesCriadas > 0
    alertaDetalhe = saude.detalhe
    await registrarLogBot({
      tipo: "ALERTA",
      origem: "monitor",
      status: "alerta",
      detalhe: {
        emailEnviado: resultado.emailEnviado,
        notificacoesCriadas: resultado.notificacoesCriadas,
        instanciaStatus: saude.instanciaStatus,
      },
      erro: saude.detalhe,
    })
  }

  config = { ...config, ultimoCheck: new Date().toISOString(), ultimoStatus: statusAtual, ultimoErro: saude.online ? null : saude.detalhe }
  await salvarConfigMonitoramento(config)

  return {
    verificado: true,
    online: saude.online,
    instanciaStatus: saude.instanciaStatus,
    detalhe: saude.detalhe,
    alertaEnviado,
    alertaDetalhe,
  }
}