import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { bancosDados } from "@/lib/db/schema/banco-dados"
import { eq } from "drizzle-orm"
import { generateBackup } from "@/lib/dump"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const connId = req.nextUrl.searchParams.get("conexao")
    let connectionString: string

    if (connId) {
      const [conn] = await db.select().from(bancosDados).where(eq(bancosDados.id, Number(connId)))
      if (!conn) return NextResponse.json({ error: "Conexão não encontrada" }, { status: 404 })
      connectionString = conn.connectionString
    } else {
      const [active] = await db.select().from(bancosDados).where(eq(bancosDados.ativo, true))
      connectionString = active?.connectionString || process.env.DATABASE_URL!
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    const filename = `backup_pdm_${timestamp}.sql`

    const stream = await generateBackup(connectionString)

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            controller.enqueue(encoder.encode(chunk))
          }
          controller.close()
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          controller.enqueue(encoder.encode(`\n-- ERRO DURANTE O BACKUP: ${msg}\n`))
          controller.close()
        }
      },
    })

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "application/sql",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[GET /api/admin/config/banco-dados/backup]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
