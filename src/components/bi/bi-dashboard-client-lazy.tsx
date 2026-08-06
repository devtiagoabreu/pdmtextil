"use client"

import dynamic from "next/dynamic"

export const BiDashboardClient = dynamic(
  () => import("@/components/bi/bi-dashboard-client").then((m) => m.BiDashboardClient),
  { ssr: false }
)
