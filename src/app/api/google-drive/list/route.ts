import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { accounts } from "@/lib/db/schema/accounts"
import { eq, and } from "drizzle-orm"
import { listFolders, listFiles, searchFiles, getRootFolders, getBreadcrumbPath } from "@/lib/google-drive"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const token = (session.user as any).accessToken
    if (!token) return NextResponse.json({ error: "Google Drive não vinculado" }, { status: 400 })

    const { searchParams } = new URL(req.url)
    const action = searchParams.get("action") || "root"
    const folderId = searchParams.get("folderId")
    const q = searchParams.get("q")

    let data: any[] = []

    if (action === "root") {
      data = await getRootFolders(token)
    } else if (action === "folders" && folderId) {
      data = await listFolders(token, folderId)
    } else if (action === "files" && folderId) {
      const [folders, files] = await Promise.all([
        listFolders(token, folderId),
        listFiles(token, folderId),
      ])
      data = [...folders.map(f => ({ ...f, _type: "folder" })), ...files.map(f => ({ ...f, _type: "file" }))]
    } else if (action === "search" && q) {
      data = await searchFiles(token, q)
    } else if (action === "breadcrumb" && folderId) {
      const path = await getBreadcrumbPath(token, folderId)
      return NextResponse.json(path)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[GET /api/google-drive]", error)
    return NextResponse.json({ error: "Erro ao acessar Google Drive" }, { status: 500 })
  }
}
