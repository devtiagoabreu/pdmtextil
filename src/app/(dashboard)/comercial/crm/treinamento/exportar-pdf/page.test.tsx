// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import ExportarPdfPage from "./page"
import { createFetchMock, renderPage } from "@/test/harness"

vi.mock("@/lib/export-treinamento-pdf", () => ({
  exportTreinamentoCompletoPdf: vi.fn(),
}))

const modulos = [
  {
    id: 1,
    titulo: "Visão Geral",
    descricao: "Primeiros passos",
    icone: "BookOpen",
    cor: "#6366f1",
    ordem: 1,
    ativo: true,
    licoes: [
      { id: 10, titulo: "Introdução ao CRM", conteudoMd: "Conteúdo da lição 1.", preRequisitos: null, ordem: 1, ativo: true },
      { id: 11, titulo: "Lição Inativa", conteudoMd: "Conteúdo da lição 2.", preRequisitos: "Lead cadastrado", ordem: 2, ativo: false },
    ],
  },
  {
    id: 2,
    titulo: "Módulo Inativo",
    descricao: null,
    icone: null,
    cor: null,
    ordem: 2,
    ativo: false,
    licoes: [],
  },
]

describe("ExportarPdfPage", () => {
  beforeEach(() => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/treinamento/exportar-pdf") return { json: modulos }
      return { json: null }
    }
    vi.stubGlobal("fetch", createFetchMock(handler).fn)
  })

  it("renderiza o documento completo com módulos e lições ativas", async () => {
    renderPage(<ExportarPdfPage />)

    expect(screen.getByRole("heading", { name: "Exportar Treinamento Completo" })).toBeInTheDocument()
    expect(await screen.findByText(/Resumo do Documento/)).toBeInTheDocument()
    expect(screen.getByText(/2 módulos/)).toBeInTheDocument()
    expect(screen.getByText("Treinamento CRM")).toBeInTheDocument()
    expect(screen.getByText("Índice")).toBeInTheDocument()
    expect(screen.getByText(/Introdução ao CRM/)).toBeInTheDocument()
    expect(screen.getByText("Conteúdo da lição 1.")).toBeInTheDocument()
    expect(screen.queryByText(/Lição Inativa/)).not.toBeInTheDocument()
    expect(screen.queryByText("Módulo Inativo")).not.toBeInTheDocument()
  })

  it("mostra estado vazio quando não há módulos", async () => {
    vi.stubGlobal("fetch", createFetchMock(() => ({ json: [] })).fn)
    renderPage(<ExportarPdfPage />)

    expect(await screen.findByText("Nenhum módulo de treinamento encontrado.")).toBeInTheDocument()
  })

  it("gera o PDF completo ao clicar em Baixar PDF", async () => {
    const { exportTreinamentoCompletoPdf } = await import("@/lib/export-treinamento-pdf")
    renderPage(<ExportarPdfPage />)

    await screen.findByText(/Resumo do Documento/)
    fireEvent.click(screen.getByRole("button", { name: "Baixar PDF" }))

    await waitFor(() => expect(exportTreinamentoCompletoPdf).toHaveBeenCalled())
    expect(exportTreinamentoCompletoPdf).toHaveBeenCalledWith(modulos)
  })
})
