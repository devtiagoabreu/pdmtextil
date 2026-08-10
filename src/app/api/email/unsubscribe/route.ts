import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { emailOptouts } from "@/lib/db/schema/email-optouts"

export const dynamic = "force-dynamic"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PAGE = (titulo: string, texto: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${titulo}</title>
<style>
  body { font-family: Arial, sans-serif; background: #f1f5f9; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
  .card { background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 40px 32px; max-width: 420px; text-align: center; }
  h1 { font-size: 20px; color: #0f172a; margin: 0 0 12px; }
  p { font-size: 14px; color: #475569; line-height: 1.6; margin: 0; }
</style>
</head>
<body>
  <div class="card">
    <h1>${titulo}</h1>
    <p>${texto}</p>
  </div>
</body>
</html>`

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") || "").trim().toLowerCase()

  if (!EMAIL_REGEX.test(email)) {
    return new NextResponse(
      PAGE("Link inválido", "O link de descadastro é inválido. Verifique o e-mail recebido."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    )
  }

  await db.insert(emailOptouts).values({ email }).onConflictDoNothing()

  return new NextResponse(
    PAGE(
      "Inscrição cancelada",
      `Você não receberá mais os e-mails em massa deste sistema no endereço <strong>${email}</strong>. Pode fechar esta página.`
    ),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  )
}
