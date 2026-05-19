import { db } from "./db"
import { notificacoes, NewNotificacao } from "./db/schema/notificacoes"
import { usuarios } from "./db/schema/usuarios"
import { eq } from "drizzle-orm"
import { sendEmail } from "./email"

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://pdmprotextil.vercel.app"

export async function notificar(tipo: string, mensagem: string, link?: string, usuarioNome?: string | null) {
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
    const result = await sendEmail({
      to: emailsValidos,
      subject: `[PDM Têxtil] ${mensagem}`,
      html: `<div style="font-family:Arial,sans-serif;padding:20px;max-width:600px">
<h2 style="color:#1e3a5f">PDM Têxtil</h2>
<p>${mensagem}</p>
${link ? `<p><a href="${SITE_URL}${link}" style="background:#1e3a5f;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block">Ver detalhes</a></p>` : ""}
<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0" />
<p style="color:#94a3b8;font-size:12px">Sistema PDM Têxtil</p>
</div>`,
    })
    if (result.error) {
      console.error(`[NOTIFICAR] Email enviado para ${result.sent} de ${emailsValidos.length} usuários. Erro: ${result.error}`)
    } else {
      console.log(`[NOTIFICAR] Email enviado com sucesso para ${result.sent} usuários`)
    }
  }

  return { usuariosNotificados: todosUsuarios.length }
}
