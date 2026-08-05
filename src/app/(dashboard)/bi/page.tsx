import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import dynamicClient from "next/dynamic"

const BiDashboardClient = dynamicClient(() => import("@/components/bi/bi-dashboard-client").then((m) => m.BiDashboardClient), { ssr: false })

export const dynamic = "force-dynamic"

export default async function BiPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">BI - Business Intelligence</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Análise de dados a partir de planilhas Google
          </p>
        </div>
      </div>

      <BiDashboardClient />
    </div>
  )
}
