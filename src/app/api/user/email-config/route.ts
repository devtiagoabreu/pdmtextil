import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { userEmailConfig } from "@/lib/db/schema/user-email-config"
import { encrypt, decrypt } from "@/lib/crypto"
import { eq } from "drizzle-orm"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const config = await db.select()
    .from(userEmailConfig)
    .where(eq(userEmailConfig.usuarioId, Number(session.user.id)))
    .limit(1)

  if (config.length === 0) {
    return NextResponse.json({ config: null })
  }

  const cfg = config[0]
  return NextResponse.json({
    config: {
      ...cfg,
      senhaApp: decrypt(cfg.senhaApp),
    },
  })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json()
  const { email, senha_app } = body

  if (!email || !senha_app) {
    return NextResponse.json({ error: "Email e senha do app são obrigatórios" }, { status: 400 })
  }

  const senhaCriptografada = encrypt(senha_app)

  const existing = await db.select()
    .from(userEmailConfig)
    .where(eq(userEmailConfig.usuarioId, Number(session.user.id)))
    .limit(1)

  if (existing.length > 0) {
    await db.update(userEmailConfig)
      .set({
        email,
        senhaApp: senhaCriptografada,
        updatedAt: new Date(),
      })
      .where(eq(userEmailConfig.usuarioId, Number(session.user.id)))
  } else {
    await db.insert(userEmailConfig).values({
      usuarioId: Number(session.user.id),
      email,
      senhaApp: senhaCriptografada,
    })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  await db.delete(userEmailConfig)
    .where(eq(userEmailConfig.usuarioId, Number(session.user.id)))

  return NextResponse.json({ success: true })
}
