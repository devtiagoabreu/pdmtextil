import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailConfig } from "@/lib/db/schema/email-config"
import { eq } from "drizzle-orm"
import { clearTransporter } from "@/lib/email"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const configs = await db.select().from(emailConfig).limit(1)
    return NextResponse.json(configs[0] || null)
  } catch (error) {
    console.error("[GET /api/admin/config/smtp]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()

    const existing = await db.select().from(emailConfig).limit(1)

    if (existing.length > 0) {
      await db.update(emailConfig).set({
        host: body.host || "smtp.gmail.com",
        port: body.port || 587,
        user: body.user,
        pass: body.pass,
        fromName: body.fromName || "PDM Têxtil",
        ativo: body.ativo ?? true,
        updatedAt: new Date(),
      }).where(eq(emailConfig.id, existing[0].id))
    } else {
      await db.insert(emailConfig).values({
        host: body.host || "smtp.gmail.com",
        port: body.port || 587,
        user: body.user,
        pass: body.pass,
        fromName: body.fromName || "PDM Têxtil",
        ativo: body.ativo ?? true,
      })
    }

    clearTransporter()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PUT /api/admin/config/smtp]", error)
    return NextResponse.json({ error: "Erro ao salvar config SMTP" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const existing = await db.select().from(emailConfig).limit(1)
    if (existing.length > 0) {
      await db.delete(emailConfig).where(eq(emailConfig.id, existing[0].id))
    }

    clearTransporter()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/config/smtp]", error)
    return NextResponse.json({ error: "Erro ao limpar config SMTP" }, { status: 500 })
  }
}
