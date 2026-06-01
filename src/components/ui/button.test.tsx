import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Button, buttonVariants } from "./button"

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument()
  })

  it("applies default variant classes", () => {
    render(<Button>Default</Button>)
    const btn = screen.getByRole("button")
    const classes = btn.className
    expect(classes).toContain("bg-primary")
  })

  it("applies outline variant", () => {
    render(<Button variant="outline">Outline</Button>)
    const btn = screen.getByRole("button")
    const classes = btn.className
    expect(classes).toContain("border-border")
    expect(classes).toContain("bg-background")
  })

  it("applies destructive variant", () => {
    render(<Button variant="destructive">Destructive</Button>)
    const btn = screen.getByRole("button")
    const classes = btn.className
    expect(classes).toContain("bg-destructive/10")
    expect(classes).toContain("text-destructive")
  })

  it("applies ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("hover:bg-muted")
  })

  it("applies link variant", () => {
    render(<Button variant="link">Link</Button>)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("underline-offset-4")
  })

  it("applies secondary variant", () => {
    render(<Button variant="secondary">Secondary</Button>)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("bg-secondary")
  })

  it("applies size classes", () => {
    render(<Button size="sm">Small</Button>)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("h-7")
  })

  it("applies xs size", () => {
    render(<Button size="xs">XS</Button>)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("h-6")
  })

  it("applies lg size", () => {
    render(<Button size="lg">LG</Button>)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("h-9")
  })

  it("applies icon size", () => {
    render(<Button size="icon">I</Button>)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("size-8")
  })

  it("merges custom className", () => {
    render(<Button className="custom-class">Custom</Button>)
    expect(screen.getByRole("button").className).toContain("custom-class")
  })

  it("sets data-slot attribute", () => {
    render(<Button>Test</Button>)
    expect(screen.getByRole("button")).toHaveAttribute("data-slot", "button")
  })

  it("renders as disabled", () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("buttonVariants returns correct classes", () => {
    const classes = buttonVariants({ variant: "destructive", size: "sm" })
    expect(classes).toContain("bg-destructive/10")
    expect(classes).toContain("h-7")
  })
})
