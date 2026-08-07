// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { screen } from "@testing-library/react"
import FerramentasHubPage from "./page"
import { renderPage } from "@/test/harness"

describe("FerramentasHubPage", () => {
  it("renderiza o heading e os cards de ferramentas", () => {
    renderPage(<FerramentasHubPage />)
    expect(screen.getByRole("heading", { name: "Ferramentas" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Consulta CNPJ/ })).toHaveAttribute("href", "/ferramentas/consulta-cnpj")
    expect(screen.getByRole("link", { name: /Calculadora de Regra de Três/ })).toHaveAttribute("href", "/ferramentas/regra-de-tres")
    expect(screen.getByRole("link", { name: /Numeração de Fio/ })).toHaveAttribute("href", "/ferramentas/conversores")
    expect(screen.getByRole("link", { name: /Email em Massa/ })).toHaveAttribute("href", "/admin/email-massa")
  })

  it("renderiza as descrições de cada card", () => {
    renderPage(<FerramentasHubPage />)
    expect(screen.getByText(/Consultar dados de CNPJ na Receita Federal/)).toBeInTheDocument()
    expect(screen.getByText(/Conversão entre Ne, Nm, Tex, Dtex e Denier/)).toBeInTheDocument()
    expect(screen.getByText(/Resolve regra de três simples/)).toBeInTheDocument()
  })
})
