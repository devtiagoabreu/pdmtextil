import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { validateRequest, usuarioSchema } from "@/lib/validation"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const lista = await db
      .select({
        id: usuarios.id,
        email: usuarios.email,
        name: usuarios.name,
        role: usuarios.role,
        ativo: usuarios.ativo,
        ultimoAcesso: usuarios.ultimoAcesso,
        createdAt: usuarios.createdAt,
      })
      .from(usuarios)
      .orderBy(usuarios.name)

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/admin/usuarios]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = validateRequest(usuarioSchema, body)
    if ("error" in parsed) return parsed.error
    const { password, ...userData } = parsed.data

    const existente = await db.select().from(usuarios).where(eq(usuarios.email, userData.email)).limit(1)
    if (existente.length > 0) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const [novo] = await db
      .insert(usuarios)
      .values({
        email: userData.email,
        name: userData.name,
        password: passwordHash,
        role: userData.role,
        ativo: true,
      })
      .returning()

    return NextResponse.json({ id: novo.id, email: novo.email, name: novo.name, role: novo.role })
  } catch (error) {
    console.error("[POST /api/admin/usuarios]", error)
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
  }
}
