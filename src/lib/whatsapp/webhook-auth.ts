import { NextRequest, NextResponse } from "next/server"

export function validarWebhookSecret(req: NextRequest): NextResponse | { ok: true } {
  const secret = process.env.PDM_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Webhook não configurado" }, { status: 500 })
  }
  const authHeader = req.headers.get("authorization")
  const querySecret = req.nextUrl.searchParams.get("secret")
  if (authHeader === `Bearer ${secret}` || querySecret === secret) {
    return { ok: true }
  }
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
}

export function requireAdmin(session: { user?: { role?: string | null } } | null): boolean {
  return session?.user?.role === "ADMIN" || session?.user?.role === "SUDO"
}
