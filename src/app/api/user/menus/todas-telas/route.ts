import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { handleApiError } from "@/lib/api-error"
import { todasTelas } from "@/lib/telas-disponiveis"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const role = auth.session?.user?.role
    const ehAdministrador = role === "ADMIN" || role === "SUDO"

    const telas = todasTelas()
      .filter((item) => ehAdministrador || !item.href.startsWith("/admin"))
      .map((item: any) => ({
        id: item.id,
        label: item.label,
        href: item.href,
        module: item.module,
      }))
      .sort((a: any, b: any) => a.label.localeCompare(b.label, "pt-BR"))

    return NextResponse.json(telas)
  } catch (error) {
    return handleApiError(error, "TodasTelas")
  }
}
