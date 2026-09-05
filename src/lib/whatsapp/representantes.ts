import { db } from "@/lib/db"
import { usuarios } from "@/lib/db/schema/usuarios"
import { and, eq, isNotNull } from "drizzle-orm"
import { enviarMensagem, evolutionConfigurado } from "@/lib/evolution-api"

const FALLBACK_PJ = process.env.WHATSAPP_REPRESENTANTE_PJ || "5519999999999"
const FALLBACK_PF = process.env.WHATSAPP_REPRESENTANTE_PF || "5519999999998"

function limparNumero(n: string): string {
  return n.replace(/\D/g, "")
}

export async function obterRepresentantes(tipoPessoa: "PJ" | "PF"): Promise<string[]> {
  const linhas = (await db
    .select({ celWhatsapp: usuarios.celWhatsapp })
    .from(usuarios)
    .where(and(eq(usuarios.ativo, true), isNotNull(usuarios.celWhatsapp)))) as { celWhatsapp: string | null }[]

  const ativos = linhas
    .map(r => limparNumero(r.celWhatsapp || ""))
    .filter(n => n.length >= 10 && n.length <= 13)

  if (ativos.length > 0) return ativos
  return [tipoPessoa === "PJ" ? FALLBACK_PJ : FALLBACK_PF]
}

export async function notificarRepresentantes(mensagem: string, tipoPessoa: "PJ" | "PF"): Promise<void> {
  if (!evolutionConfigurado()) return
  const numeros = await obterRepresentantes(tipoPessoa)
  for (const numero of numeros) {
    try {
      await enviarMensagem(`${numero}@s.whatsapp.net`, mensagem)
    } catch {
      // não derruba o fluxo se um representante falhar
    }
  }
}