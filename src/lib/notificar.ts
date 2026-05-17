import { db } from "./db"
import { notificacoes, NewNotificacao } from "./db/schema/notificacoes"
import { usuarios } from "./db/schema/usuarios"
import { eq } from "drizzle-orm"
import { sendEmail } from "./email"

export async function notificar(tipo: string, mensagem: string, link?: string, usuarioNome?: string) {
  const todosUsuarios = await db.select({ id: usuarios.id, name: usuarios.name, email: usuarios.email }).from(usuarios).where(eq(usuarios.ativo, true))

  const notificacoesData: NewNotificacao[] = todosUsuarios.map(u => ({
    tipo,
    mensagem,
    usuarioId: u.id,
    usuarioNome,
    link: link || null,
  }))

  if (notificacoesData.length > 0) {
    await db.insert(notificacoes).values(notificacoesData)
  }

  const emailsValidos = todosUsuarios.map(u => u.email).filter((e): e is string => !!e && e.includes("@"))
  if (emailsValidos.length > 0) {
    try {
      await sendEmail({
        to: emailsValidos,
        subject: `[PDM Têxtil] ${mensagem}`,
        html: `<div style="font-family:Arial,sans-serif;padding:20px;max-width:600px">
<h2 style="color:#1e3a5f">PDM Têxtil</h2>
<p>${mensagem}</p>
${link ? `<p><a href="${link}" style="background:#1e3a5f;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block">Ver detalhes</a></p>` : ""}
<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0" />
<p style="color:#94a3b8;font-size:12px">Sistema PDM Têxtil</p>
</div>`,
      })
    } catch (err) {
      console.error("[NOTIFICAR] Erro ao enviar email em massa:", err)
    }
  }

  return { usuariosNotificados: todosUsuarios.length }
}
