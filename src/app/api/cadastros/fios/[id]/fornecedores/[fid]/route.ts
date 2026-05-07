import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { fiosFornecedores } from "@/lib/db/schema/fios"
import { eq } from "drizzle-orm"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { fid } = await params

    const deleted = await db
      .delete(fiosFornecedores)
      .where(eq(fiosFornecedores.id, parseInt(fid)))
      .returning()

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Relação não encontrada" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/cadastros/fios/[id]/fornecedores/[fid]]", error)
    return NextResponse.json({ error: "Erro ao remover fornecedor" }, { status: 500 })
  }
}