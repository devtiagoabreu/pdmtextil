import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { userEmailConfig } from "@/lib/db/schema/user-email-config"
import { encrypt } from "@/lib/crypto"
import { eq } from "drizzle-orm"
import nodemailer from "nodemailer"

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
      id: cfg.id,
      usuarioId: cfg.usuarioId,
      email: cfg.email,
      host: cfg.host,
      port: cfg.port,
      ativo: cfg.ativo,
      limiteDiario: cfg.limiteDiario,
      hasPassword: true,
      createdAt: cfg.createdAt,
      updatedAt: cfg.updatedAt,
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

  const limiteDiario = Number(body.limite_diario)
  if (!Number.isInteger(limiteDiario) || limiteDiario < 100 || limiteDiario > 50000) {
    return NextResponse.json({ error: "Limite diário deve ser um número entre 100 e 50000" }, { status: 400 })
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
        limiteDiario,
        updatedAt: new Date(),
      })
      .where(eq(userEmailConfig.usuarioId, Number(session.user.id)))
  } else {
    await db.insert(userEmailConfig).values({
      usuarioId: Number(session.user.id),
      email,
      senhaApp: senhaCriptografada,
      limiteDiario,
    })
  }

  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json()
  const { email, senha_app } = body

  if (!email || !senha_app) {
    return NextResponse.json({ error: "Email e senha do app são obrigatórios" }, { status: 400 })
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: email, pass: senha_app },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 15_000,
  })

  try {
    await transporter.verify()
    return NextResponse.json({ success: true, message: "Conexão SMTP realizada com sucesso" })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Falha ao conectar ao SMTP" },
      { status: 200 }
    )
  } finally {
    transporter.close()
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  await db.delete(userEmailConfig)
    .where(eq(userEmailConfig.usuarioId, Number(session.user.id)))

  return NextResponse.json({ success: true })
}
