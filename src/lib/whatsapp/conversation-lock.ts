import { db } from "@/lib/db"
import { sql, eq, and } from "drizzle-orm"
import { crmWhatsappConversas } from "@/lib/db/schema/crm-whatsapp-conversas"
import { crmLeads } from "@/lib/db/schema/crm-leads"
import { extrairNumero } from "@/lib/whatsapp/helpers"

export const LOCK_STALE_MS = 3 * 60 * 1000
const LOCK_CHAVE = "_processandoEm"

export interface LockConversa {
  token: string
  criada: boolean
  leadExistente: boolean
}

export async function adquirirLockConversa(remoteJid: string): Promise<LockConversa | null> {
  const token = new Date().toISOString()

  const claimed = await db
    .update(crmWhatsappConversas)
    .set({
      updatedAt: sql`NOW()`,
      dados: sql`COALESCE(dados, '{}'::jsonb) || jsonb_build_object(${LOCK_CHAVE}, ${token})`,
    })
    .where(
      and(
        eq(crmWhatsappConversas.remoteJid, remoteJid),
        sql`(dados->>'_processandoEm') IS NULL OR (dados->>'_processandoEm')::timestamptz < NOW() - INTERVAL '3 minutes'`
      )
    )
    .returning({ id: crmWhatsappConversas.id })

  if (claimed.length > 0) return { token, criada: false, leadExistente: false }

  const existente = await db
    .select({ id: crmWhatsappConversas.id })
    .from(crmWhatsappConversas)
    .where(eq(crmWhatsappConversas.remoteJid, remoteJid))
    .limit(1)
    .then((r: any) => r[0] || null)

  if (existente) return null

  const numero = extrairNumero(remoteJid)
  const leadExistenteData = await db
    .select({
      id: crmLeads.id,
      nome: crmLeads.nome,
      empresaNome: crmLeads.empresaNome,
      tipoPessoa: crmLeads.tipoPessoa,
    })
    .from(crmLeads)
    .where(
      sql`(${eq(crmLeads.idIntegracao, `whatsapp:${remoteJid}`)} OR ${eq(crmLeads.celular, numero)}) AND ${crmLeads.status} != 'CONVERTIDO'`
    )
    .limit(1)
    .then((r: any) => r[0] || null)

  const dadosIniciais: Record<string, any> = { [LOCK_CHAVE]: token }
  let estadoInicial = "SAUDACAO"

  if (leadExistenteData) {
    if (leadExistenteData.empresaNome) dadosIniciais.razaoSocial = leadExistenteData.empresaNome
    if (leadExistenteData.nome) dadosIniciais.nomeContato = leadExistenteData.nome
    if (leadExistenteData.tipoPessoa) dadosIniciais.tipoPessoa = leadExistenteData.tipoPessoa
    estadoInicial = leadExistenteData.empresaNome ? "AGUARDANDO_REPRESENTANTE" : "COLETANDO_DADOS"
  }

  const [nova] = await db
    .insert(crmWhatsappConversas)
    .values({ remoteJid, estado: estadoInicial, dados: dadosIniciais })
    .onConflictDoNothing()
    .returning({ id: crmWhatsappConversas.id })

  if (!nova) return null
  return { token, criada: true, leadExistente: !!leadExistenteData }
}

export async function liberarLockConversa(remoteJid: string, token: string) {
  try {
    await db
      .update(crmWhatsappConversas)
      .set({
        updatedAt: sql`NOW()`,
        dados: sql`dados - ${LOCK_CHAVE}`,
      })
      .where(
        and(eq(crmWhatsappConversas.remoteJid, remoteJid), sql`dados->>'_processandoEm' = ${token}`)
      )
  } catch (e) {
    console.error("[WhatsappLock] Erro ao liberar lock:", e)
  }
}