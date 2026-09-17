import { db } from "@/lib/db"
import { notificacoes } from "@/lib/db/schema/notificacoes"

export async function notificarChamado(params: {
  tipo: string
  mensagem: string
  link: string
  usuarioId: number
  usuarioNome?: string | null
}) {
  if (!params.usuarioId) return
  await db.insert(notificacoes).values({
    tipo: params.tipo,
    mensagem: params.mensagem,
    usuarioId: params.usuarioId,
    usuarioNome: params.usuarioNome || null,
    link: params.link,
  })
}