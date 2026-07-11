import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emailEnviados } from "@/lib/db/schema/email-enviados"
import { emailCliques } from "@/lib/db/schema/email-cliques"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: trackingId } = await params
  const urlParam = req.nextUrl.searchParams.get("url")

  if (!urlParam || !trackingId) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  const originalUrl = decodeURIComponent(urlParam)

  try {
    const envios = await db
      .select({ id: emailEnviados.id })
      .from(emailEnviados)
      .where(eq(emailEnviados.trackingId, trackingId))
      .limit(1)

    if (envios.length > 0) {
      await db.insert(emailCliques).values({
        envioId: envios[0].id,
        urlOriginal: originalUrl,
      })
    }
  } catch (err) {
    console.error("[CLICK] Erro ao registrar clique:", err)
  }

  return NextResponse.redirect(originalUrl)
}
