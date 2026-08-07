// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import LicaoDetailPage from "./page"
import { createFetchMock, renderPage, navMock } from "@/test/harness"

vi.mock("@/lib/export-treinamento-pdf", () => ({
  exportLicaoPdf: vi.fn(),
}))

const modulos = [
  {
    id: 1,
    titulo: "Visão Geral",
    licoes: [
      { id: 9, titulo: "Lição Anterior", ordem: 1, ativo: true },
      { id: 10, titulo: "Introdução ao CRM", ordem: 2, ativo: true },
      { id: 11, titulo: "Próxima Lição", ordem: 3, ativo: true },
    ],
  },
]

const licao = {
  id: 10,
  moduloId: 1,
  moduloTitulo: "Visão Geral",
  moduloCor: "#6366f1",
  moduloIcone: "BookOpen",
  titulo: "Introdução ao CRM",
  conteudoMd: "## Visão Geral\n\nConteúdo da lição sobre o módulo de leads.",
  preRequisitos: "Cadastrar usuários antes de usar esta tela",
  linksPop: [{ label: "POP Cadastro de Leads", url: "https://exemplo.com/pop-leads" }],
  linksVideo: [{ label: "Vídeo Tutorial", url: "https://youtube.com/watch?v=abc" }],
  pathnameRelacionado: "/comercial/crm/leads",
  ordem: 2,
  ativo: true,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-02",
}

function buildHandler(data: any) {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === `/api/crm/treinamento/${data.id}`) return { json: data }
    if (method === "GET" && url === "/api/crm/treinamento") return { json: modulos }
    return { json: null }
  }
}

describe("LicaoDetailPage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/crm/treinamento/10")
    navMock.setParams({ id: "10" })
  })

  it("renderiza o conteúdo completo da lição", async () => {
    vi.stubGlobal("fetch", createFetchMock(buildHandler(licao)).fn)
    renderPage(<LicaoDetailPage />)

    expect(await screen.findByRole("heading", { name: "Introdução ao CRM" })).toBeInTheDocument()
    expect(screen.getAllByText("Visão Geral").length).toBeGreaterThan(0)
    expect(screen.getByText("Pré-cadastros Necessários")).toBeInTheDocument()
    expect(screen.getByText("Cadastrar usuários antes de usar esta tela")).toBeInTheDocument()
    expect(screen.getByText("Conteúdo da lição sobre o módulo de leads.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /POP Cadastro de Leads/ })).toHaveAttribute(
      "href",
      "https://exemplo.com/pop-leads"
    )
    expect(screen.getByRole("link", { name: /Vídeo Tutorial/ })).toHaveAttribute(
      "href",
      "https://youtube.com/watch?v=abc"
    )
    expect(screen.getByRole("button", { name: "Exportar PDF" })).toBeInTheDocument()
  })

  it("navega para a lição anterior e a próxima", async () => {
    vi.stubGlobal("fetch", createFetchMock(buildHandler(licao)).fn)
    renderPage(<LicaoDetailPage />)

    await screen.findByRole("heading", { name: "Introdução ao CRM" })

    expect(screen.getByRole("link", { name: /Lição Anterior/ })).toHaveAttribute(
      "href",
      "/comercial/crm/treinamento/9"
    )
    expect(screen.getByRole("link", { name: /Próxima Lição/ })).toHaveAttribute(
      "href",
      "/comercial/crm/treinamento/11"
    )
  })

  it("exporta a lição em PDF ao clicar no botão", async () => {
    const { exportLicaoPdf } = await import("@/lib/export-treinamento-pdf")
    vi.stubGlobal("fetch", createFetchMock(buildHandler(licao)).fn)
    renderPage(<LicaoDetailPage />)

    fireEvent.click(await screen.findByRole("button", { name: "Exportar PDF" }))

    await waitFor(() => expect(exportLicaoPdf).toHaveBeenCalled())
    expect(exportLicaoPdf).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }), "Visão Geral", 0, 1)
  })

  it("mostra mensagem quando a lição não é encontrada", async () => {
    vi.stubGlobal("fetch", createFetchMock(() => ({ json: null })).fn)
    renderPage(<LicaoDetailPage />)

    expect(await screen.findByText("Lição não encontrada")).toBeInTheDocument()
  })
})
