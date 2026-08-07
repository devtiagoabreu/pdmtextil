// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import ConversoresPage from "./page"
import { renderPage } from "@/test/harness"

describe("ConversoresPage", () => {
  it("renderiza o heading com as unidades de conversão", () => {
    renderPage(<ConversoresPage />)
    expect(screen.getByRole("heading", { name: "Numeração de Fio" })).toBeInTheDocument()
    expect(screen.getByText("Ne (Cotton)")).toBeInTheDocument()
    expect(screen.getByText("Nm")).toBeInTheDocument()
    expect(screen.getByText("Tex")).toBeInTheDocument()
    expect(screen.getByText("Dtex")).toBeInTheDocument()
    expect(screen.getByText("Denier (D)")).toBeInTheDocument()
  })

  it("converte um valor em Ne para as demais unidades", () => {
    renderPage(<ConversoresPage />)
    const inputs = screen.getAllByPlaceholderText("0") as HTMLInputElement[]
    fireEvent.change(inputs[0], { target: { value: "59.05" } })

    expect(inputs[0].value).toBe("59.0500")
    expect(inputs[1].value).toBe("100.00")
    expect(inputs[2].value).toBe("10.0000")
    expect(inputs[3].value).toBe("100.00")
    expect(inputs[4].value).toBe("90.0000")
  })
})
