import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmWhatsappFlowLogs } from "@/lib/db/schema/crm-whatsapp-flow-logs"
import { eq, desc, sql, and } from "drizzle-orm"

export const dynamic = "force-dynamic"

const STEP_ORDER = ["auth", "extract", "filter", "find_conversation", "groq_call", "state_machine", "save_messages", "send_response", "create_lead", "notify"]

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const executionId = req.nextUrl.searchParams.get("executionId")
    const status = req.nextUrl.searchParams.get("status")
    const search = req.nextUrl.searchParams.get("search")
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 50, 200)

    if (executionId) {
      const steps = await db
        .select()
        .from(crmWhatsappFlowLogs)
        .where(eq(crmWhatsappFlowLogs.executionId, executionId))
        .orderBy(crmWhatsappFlowLogs.createdAt)

      return NextResponse.json({ executionId, steps })
    }

    const conditions = []
    if (status && status !== "all") {
      conditions.push(eq(crmWhatsappFlowLogs.status, status))
    }
    if (search) {
      conditions.push(
        sql`(${crmWhatsappFlowLogs.remoteJid} ILIKE ${`%${search}%`} OR ${crmWhatsappFlowLogs.pushName} ILIKE ${`%${search}%`})`
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const recentExecutions = await db
      .select({
        executionId: crmWhatsappFlowLogs.executionId,
        remoteJid: crmWhatsappFlowLogs.remoteJid,
        pushName: crmWhatsappFlowLogs.pushName,
        startedAt: sql<string>`MIN(${crmWhatsappFlowLogs.createdAt})`.as("started_at"),
        totalSteps: sql<number>`COUNT(*)`.as("total_steps"),
        errorSteps: sql<number>`COUNT(*) FILTER (WHERE ${crmWhatsappFlowLogs.status} = 'error')`.as("error_steps"),
        lastStep: sql<string>`MAX(${crmWhatsappFlowLogs.step})`.as("last_step"),
      })
      .from(crmWhatsappFlowLogs)
      .where(whereClause)
      .groupBy(crmWhatsappFlowLogs.executionId)
      .orderBy(desc(sql`MIN(${crmWhatsappFlowLogs.createdAt})`))
      .limit(limit)

    const executionIds = recentExecutions.map((e) => e.executionId)
    if (executionIds.length === 0) {
      return NextResponse.json({ executions: [] })
    }

    const allSteps = await db
      .select()
      .from(crmWhatsappFlowLogs)
      .where(sql`${crmWhatsappFlowLogs.executionId} IN (${sql.join(executionIds.map((id) => sql`${id}`), sql`, `)})`)
      .orderBy(crmWhatsappFlowLogs.createdAt)

    const stepsByExecution = new Map<string, typeof allSteps>()
    for (const step of allSteps) {
      const arr = stepsByExecution.get(step.executionId) || []
      arr.push(step)
      stepsByExecution.set(step.executionId, arr)
    }

    const executions = recentExecutions.map((exec) => ({
      ...exec,
      steps: STEP_ORDER.map((stepName) => {
        const step = stepsByExecution.get(exec.executionId)?.find((s) => s.step === stepName)
        return step
          ? {
              step: step.step,
              status: step.status,
              durationMs: step.durationMs,
              error: step.error,
              input: step.input,
              output: step.output,
            }
          : { step: stepName, status: "skipped", durationMs: 0, error: null, input: null, output: null }
      }).filter((s) => stepsByExecution.get(exec.executionId)?.some((x) => x.step === s.step)),
    }))

    return NextResponse.json({ executions })
  } catch (error) {
    console.error("[GET /api/admin/whatsapp-monitor]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
