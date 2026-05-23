import { NextResponse } from "next/server"
import { notificarErro } from "../notificar"

const FK_ERROR = '23503' // PostgreSQL foreign_key_violation

export function handleApiError(error: unknown, context: string, usuarioNome?: string | null) {
  const pgError = error as { code?: string; detail?: string; message?: string }
  const isFK = pgError?.code === FK_ERROR

  console.error(`[${context}]`, error)

  if (isFK) {
    return NextResponse.json({
      error: "Este registro não pode ser excluído pois possui outros cadastros vinculados a ele.",
      fkError: true,
    }, { status: 409 })
  }

  notificarErro(context, error, usuarioNome)

  return NextResponse.json({
    error: "Ocorreu um erro inesperado. A equipe de suporte foi notificada.",
  }, { status: 500 })
}

export function getErrorMessage(error: unknown, fallback = "Erro ao processar requisição"): string {
  if (error instanceof Error) return error.message
  return String(error) || fallback
}
