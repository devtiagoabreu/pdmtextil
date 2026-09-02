// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import { InfoButton } from "./info-button"
import { render } from "@testing-library/react"
import type { InfoContent } from "@/lib/info-content"

const content: InfoContent = {
  title: "Oportunidades",
  description: "Lista de oportunidades.",
  rules: ["Regra 1"],
  fields: [{ name: "Título", desc: "Nome" }],
  examples: [
    { title: "Exemplo do dia a dia", desc: "Você cadastra a oportunidade com valor estimado de R$ 120.000." },
    { title: "Quando cada uma é usada", desc: "A proposta formaliza o orçamento com o valor cotado." },
  ],
}

describe("InfoButton", () => {
  it("exibe os exemplos praticos no modal de informacoes", () => {
    render(<InfoButton content={content} />)
    fireEvent.click(screen.getByRole("button", { name: "Informações da tela" }))

    expect(screen.getByText("Exemplos Práticos")).toBeInTheDocument()
    expect(screen.getByText("Exemplo do dia a dia")).toBeInTheDocument()
    expect(screen.getByText(/valor estimado de R\$ 120\.000/)).toBeInTheDocument()
    expect(screen.getByText("Quando cada uma é usada")).toBeInTheDocument()
  })

  it("mostra regras e campos quando presentes", () => {
    render(<InfoButton content={content} />)
    fireEvent.click(screen.getByRole("button", { name: "Informações da tela" }))

    expect(screen.getByText("Regras de Negócio")).toBeInTheDocument()
    expect(screen.getByText("Regra 1")).toBeInTheDocument()
    expect(screen.getByText("Campos")).toBeInTheDocument()
    expect(screen.getByText("Título")).toBeInTheDocument()
  })

  it("nao renderiza a seção de exemplos quando ausente", () => {
    render(<InfoButton content={{ title: "X", description: "d", rules: [] }} />)
    fireEvent.click(screen.getByRole("button", { name: "Informações da tela" }))

    expect(screen.queryByText("Exemplos Práticos")).not.toBeInTheDocument()
  })
})
