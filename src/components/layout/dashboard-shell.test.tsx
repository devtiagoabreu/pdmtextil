// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { DashboardShell } from "./dashboard-shell"

vi.mock("@/components/layout/sidebar", () => ({
  Sidebar: () => <aside data-testid="sidebar" />,
}))
vi.mock("@/components/layout/header", () => ({
  Header: ({ onToggleSidebar, sidebarCollapsed }: any) => (
    <button
      aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
      onClick={onToggleSidebar}
    />
  ),
}))
vi.mock("@/components/layout/mobile-bottom-nav", () => ({
  MobileBottomNav: () => null,
}))

describe("DashboardShell", () => {
  it("recolhe a sidebar e expande a largura do conteúdo", () => {
    render(
      <DashboardShell>
        <p>conteudo</p>
      </DashboardShell>,
    )

    const wrapper = screen.getByText("conteudo").parentElement as HTMLElement
    expect(wrapper.className).toContain("max-w-7xl")
    expect(wrapper.className).not.toContain("max-w-none")

    fireEvent.click(screen.getByLabelText("Recolher menu"))

    expect(wrapper.className).not.toContain("max-w-7xl")
    expect(wrapper.className).toContain("max-w-none")
  })
})
