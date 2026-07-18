import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmEmailConfig } from "@/lib/db/schema/crm-email-config"
import { eq } from "drizzle-orm"
import { encrypt, decrypt } from "@/lib/crypto"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    if (!["ADMIN", "SUDO"].includes(auth.session.user.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const configs = await db.select().from(crmEmailConfig).limit(1)
    if (!configs[0]) return NextResponse.json(null)
    const cfg = { ...configs[0], pass: decrypt(configs[0].pass) }
    return NextResponse.json(cfg)
  } catch (error) {
    console.error("[GET /api/crm/config/email]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    if (!["ADMIN", "SUDO"].includes(auth.session.user.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const existing = await db.select().from(crmEmailConfig).limit(1)

    if (existing.length > 0) {
      await db.update(crmEmailConfig).set({
        host: body.host || "smtp.gmail.com",
        port: body.port || 587,
        user: body.user,
        pass: encrypt(body.pass),
        fromName: body.fromName || "PDM PRO TEXTIL - CRM",
        replyTo: body.replyTo || null,
        ativo: body.ativo ?? true,
        updatedAt: new Date(),
      }).where(eq(crmEmailConfig.id, existing[0].id))
    } else {
      await db.insert(crmEmailConfig).values({
        host: body.host || "smtp.gmail.com",
        port: body.port || 587,
        user: body.user,
        pass: encrypt(body.pass),
        fromName: body.fromName || "PDM PRO TEXTIL - CRM",
        replyTo: body.replyTo || null,
        ativo: body.ativo ?? true,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PUT /api/crm/config/email]", error)
    return NextResponse.json({ error: "Erro ao salvar config CRM" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    if (!["ADMIN", "SUDO"].includes(auth.session.user.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    const existing = await db.select().from(crmEmailConfig).limit(1)
    if (existing.length > 0) {
      await db.delete(crmEmailConfig).where(eq(crmEmailConfig.id, existing[0].id))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/crm/config/email]", error)
    return NextResponse.json({ error: "Erro ao limpar config CRM" }, { status: 500 })
  }
}
