import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { enfileirarMensagem, executarFluxo } from "@/lib/whatsapp/processador"
import { processarStatusUpdate } from "@/lib/whatsapp/status"
import { validarWebhookSecret } from "@/lib/whatsapp/webhook-auth"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const auth = validarWebhookSecret(req)
  if (!("ok" in auth)) return auth

  let executionId = "no-exec"
  try {
    executionId = crypto.randomUUID()
  } catch {
    executionId = `fallback-${Date.now()}`
  }

  const rawText = await req.text()
  const internal = new NextRequest(req.url, { method: "POST", headers: req.headers, body: rawText })

  try {
    const statusUpdate = await processarStatusUpdate(rawText).catch(() => ({ tratado: false }))
    if (statusUpdate.tratado) {
      return NextResponse.json({
        status: "ok",
        webhookType: "status_update",
        novoStatus: (statusUpdate as any)?.status ?? null,
        mensagemId: (statusUpdate as any)?.mensagemId ?? null,
        downgradeBloqueado: (statusUpdate as any)?.downgradeBloqueado ?? false,
        executionId,
      })
    }

    const queued = await enfileirarMensagem(rawText, executionId)
    void executarFluxo(internal, queued?.id ?? null).catch((err) => {
      console.error("[AI-Webhook] Erro no processamento em background:", err)
    })
    return NextResponse.json({
      status: "ok",
      enfileirado: !!queued,
      filaId: queued?.id || null,
      executionId,
    })
  } catch (e) {
    console.error("[AI-Webhook] Erro ao enfileirar mensagem:", e)
    return NextResponse.json({ status: "ok", enfileirado: false, executionId })
  }
}
