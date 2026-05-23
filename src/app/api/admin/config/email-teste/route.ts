import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { to } = await req.json()
    if (!to || !to.includes("@")) {
      return NextResponse.json({ error: "Email de destino inválido" }, { status: 400 })
    }

    const result = await sendEmail({
      to,
      subject: "[PDM Têxtil] Teste de configuração de email",
      html: `<div style="font-family:Arial,sans-serif;padding:20px;max-width:600px">
<h2 style="color:#1e3a5f">PDM Têxtil</h2>
<p>Este é um email de teste da configuração SMTP.</p>
<p>Se você recebeu este email, a configuração está funcionando corretamente!</p>
<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0" />
<p style="color:#94a3b8;font-size:12px">Sistema PDM Têxtil</p>
</div>`,
    })

    if (result.sent > 0) {
      return NextResponse.json({ success: true, message: "Email de teste enviado com sucesso!" })
    } else {
      return NextResponse.json({ error: result.error || "Falha ao enviar email de teste" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[POST /api/admin/config/email-teste]", error)
    return NextResponse.json({ error: error.message || "Erro ao enviar email de teste" }, { status: 500 })
  }
}
