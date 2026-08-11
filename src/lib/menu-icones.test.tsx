// @vitest-environment node
import { describe, it, expect } from "vitest"
import { resolveMenuIcon, MenuIcone } from "@/lib/menu-icones"
import { LayoutDashboard, Target } from "lucide-react"

describe("resolveMenuIcon", () => {
  it("resolve o ícone do menu Dashboards pelo título, mesmo quando o primeiro item aponta para o CRM", () => {
    expect(resolveMenuIcon(null, "Dashboards", "/comercial/crm")).toBe(LayoutDashboard)
  })

  it("mantém o menu CRM com ícone próprio (Target)", () => {
    expect(resolveMenuIcon(null, "CRM", "/comercial/crm")).toBe(Target)
  })

  it("usa o ícone armazenado quando informado", () => {
    expect(resolveMenuIcon("Target", "Dashboards", "/comercial/crm")).toBe(Target)
  })

  it("faz fallback para URL quando não há título conhecido", () => {
    expect(resolveMenuIcon(null, "Área desconhecida", "/dashboard")).toBe(LayoutDashboard)
  })
})

describe("MenuIcone", () => {
  it("retorna o elemento com o ícone resolvido", () => {
    const element = MenuIcone({ titulo: "Dashboards", url: "/comercial/crm", size: 18 }) as any
    expect(element.type).toBe(LayoutDashboard)
  })
})
