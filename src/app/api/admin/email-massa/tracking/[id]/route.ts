import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emailEnviados } from "@/lib/db/schema/email-enviados"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

const TRANSPARENT_1X1_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return new NextResponse(TRANSPARENT_1X1_GIF, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    })
  }

  try {
    await db
      .update(emailEnviados)
      .set({ abertoEm: new Date() })
      .where(eq(emailEnviados.trackingId, id))
  } catch (err) {
    console.error("[TRACKING] Erro ao registrar abertura:", err)
  }

  return new NextResponse(TRANSPARENT_1X1_GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  })
}
