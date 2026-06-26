import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { handleApiError } from "@/lib/api-error"
import { searchRegistry } from "@/lib/search-registry"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const telas = searchRegistry
      .map(item => ({
        id: item.id,
        label: item.label,
        href: item.href,
        module: item.module,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"))

    return NextResponse.json(telas)
  } catch (error) {
    return handleApiError(error, "TodasTelas")
  }
}
