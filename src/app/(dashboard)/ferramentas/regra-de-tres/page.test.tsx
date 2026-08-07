// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import RegraDeTresPage from "./page"
import { renderPage } from "@/test/harness"

describe("RegraDeTresPage", () => {
  it("renderiza o heading e os controles da calculadora", () => {
    renderPage(<RegraDeTresPage />)
    expect(screen.getByRole("heading", { name: "Calculadora de Regra de Três" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Simples Direta" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Simples Inversa" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Composta" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Calcular" })).toBeInTheDocument()
  })

  it("calcula regra de três simples direta", () => {
    renderPage(<RegraDeTresPage />)
    fireEvent.change(screen.getByPlaceholderText("Ex: 3"), { target: { value: "3" } })
    fireEvent.change(screen.getByPlaceholderText("Ex: 5"), { target: { value: "5" } })
    fireEvent.change(screen.getByPlaceholderText("Ex: 15"), { target: { value: "15" } })
    fireEvent.click(screen.getByRole("button", { name: "Calcular" }))

    expect(screen.getByText("X = 25")).toBeInTheDocument()
  })

  it("calcula regra de três simples inversa", () => {
    renderPage(<RegraDeTresPage />)
    fireEvent.click(screen.getByRole("button", { name: "Simples Inversa" }))
    fireEvent.change(screen.getByPlaceholderText("Ex: 3"), { target: { value: "4" } })
    fireEvent.change(screen.getByPlaceholderText("Ex: 5"), { target: { value: "8" } })
    fireEvent.change(screen.getByPlaceholderText("Ex: 15"), { target: { value: "6" } })
    fireEvent.click(screen.getByRole("button", { name: "Calcular" }))

    expect(screen.getByText("X = 3")).toBeInTheDocument()
  })

  it("valida quando os valores não estão preenchidos", () => {
    renderPage(<RegraDeTresPage />)
    fireEvent.click(screen.getByRole("button", { name: "Calcular" }))

    expect(screen.getByText("Preencha os 3 valores (A₁, A₂, B₁).")).toBeInTheDocument()
  })
})
