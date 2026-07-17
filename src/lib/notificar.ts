import { db } from "./db"
import { notificacoes, NewNotificacao } from "./db/schema/notificacoes"
import { notificacaoRegras } from "./db/schema/notificacao-regras"
import { usuarios } from "./db/schema/usuarios"
import { eq, inArray } from "drizzle-orm"
import { and } from "drizzle-orm"
import { sendEmail } from "./email"
import { registrarLog } from "./log"

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL
  || (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://pdmprotextil.vercel.app")

export async function notificar(
  tipo: string,
  mensagem: string,
  link?: string,
  usuarioNome?: string | null,
  roles?: string[]
) {
  let rolesFiltro: string[]

  if (roles !== undefined) {
    rolesFiltro = roles
  } else {
    const regra = await db
      .select({ roles: notificacaoRegras.roles })
      .from(notificacaoRegras)
      .where(eq(notificacaoRegras.tipo, tipo))
      .limit(1)
    if (regra.length > 0) {
      rolesFiltro = Array.isArray(regra[0].roles) ? regra[0].roles.map(String) : []
    } else {
      return { usuariosNotificados: 0 }
    }
  }

  if (rolesFiltro.length === 0) {
    return { usuariosNotificados: 0 }
  }

  const usuariosFiltrados = await db
    .select({ id: usuarios.id, name: usuarios.name, email: usuarios.email })
    .from(usuarios)
    .where(and(eq(usuarios.ativo, true), inArray(usuarios.role, rolesFiltro)))

  if (usuariosFiltrados.length === 0) {
    return { usuariosNotificados: 0 }
  }

  const notificacoesData: NewNotificacao[] = usuariosFiltrados.map(u => ({
    tipo,
    mensagem,
    usuarioId: u.id,
    usuarioNome,
    link: link || null,
  }))

  await db.insert(notificacoes).values(notificacoesData)

  const emailsValidos = usuariosFiltrados.map(u => u.email).filter((e): e is string => !!e && e.includes("@"))
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

  return { usuariosNotificados: usuariosFiltrados.length }
}

export async function notificarErro(contexto: string, erro: unknown, usuarioNome?: string | null) {
  const mensagem = erro instanceof Error ? erro.message : String(erro)
  const descricao = `[ERRO] ${contexto}: ${mensagem}`
  console.error(descricao)

  await registrarLog({ tipo: "ERRO", acao: "erro_sistema", descricao, usuarioNome })

  try {
    await notificar("ERRO_SISTEMA", descricao, undefined, usuarioNome, ["SUDO"])
  } catch (err) {
    console.error("[NOTIFICAR_ERRO] Falha ao notificar erro:", err)
  }
}

export async function notificarDelecao(
  entidade: string,
  entidadeLabel: string,
  usuarioNome?: string | null
) {
  const descricao = `Registro de ${entidade} "${entidadeLabel}" foi excluído por ${usuarioNome || "usuário desconhecido"}`
  await notificar("DELECAO", descricao, undefined, usuarioNome, ["SUDO"])
  await registrarLog({ tipo: "DELECAO", acao: "excluir", descricao, entidade, usuarioNome })
}

export { registrarLog }
