import { db } from "./db"
import { usuarios } from "./db/schema/usuarios"
import { eq } from "drizzle-orm"
import { notificar } from "./notificar"

export async function notificarErro(contexto: string, erro: unknown, usuarioNome?: string | null) {
  const mensagem = erro instanceof Error ? erro.message : String(erro)
  const descricao = `[ERRO] ${contexto}: ${mensagem}`

  console.error(descricao)

  try {
    await notificar("ERRO_SISTEMA", descricao, undefined, usuarioNome)
  } catch (err) {
    console.error("[ERROR_HANDLER] Falha ao notificar erro:", err)
  }
}

export function criarErrorHandler(contexto: string, usuarioNome?: string | null) {
  return async (erro: unknown) => {
    await notificarErro(contexto, erro, usuarioNome)
  }
}
