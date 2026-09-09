// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import LicaoDetailPage from "./page"
import { createFetchMock, renderPage, navMock } from "@/test/harness"
import type { Licao } from "../types"

vi.mock("@/lib/export-treinamento-processos-pdf", () => ({
  exportLicaoPdf: vi.fn(),
}))

const modulos = [
  {
    id: 1,
    titulo: "Visão Geral",
    licoes: [
      { id: 9, titulo: "Lição Anterior", ordem: 1, ativo: true },
      { id: 10, titulo: "O que é um processo", ordem: 2, ativo: true },
      { id: 11, titulo: "Próxima Lição", ordem: 3, ativo: true },
    ],
  },
]

const licao = {
  id: 10,
  moduloId: 1,
  moduloTitulo: "Visão Geral",
  moduloCor: "#0ea5e9",
  moduloIcone: "BookOpen",
  titulo: "O que é um processo",
  conteudoMd: "## Visão Geral\n\nConteúdo da lição sobre processos.",
  preRequisitos: "Cadastrar uma empresa antes de usar esta tela",
  linksPop: [{ label: "POP Mapeamento de Processos", url: "https://exemplo.com/pop-processos" }],
  linksVideo: [{ label: "Vídeo Tutorial", url: "https://youtube.com/watch?v=abc" }],
  pathnameRelacionado: "/processos/processos",
  ordem: 2,
  ativo: true,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-02",
}

function buildHandler(data: Licao) {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === `/api/processos/treinamento/${data.id}`) return { json: data }
    if (method === "GET" && url === "/api/processos/treinamento") return { json: modulos }
    return { json: null }
  }
}

describe("LicaoDetailPage", () => {
  beforeEach(() => {
    navMock.setPathname("/processos/treinamento/10")
    navMock.setParams({ id: "10" })
  })

  it("renderiza o conteúdo completo da lição", async () => {
    vi.stubGlobal("fetch", createFetchMock(buildHandler(licao)).fn)
    renderPage(<LicaoDetailPage />)

    expect(await screen.findByRole("heading", { name: "O que é um processo" })).toBeInTheDocument()
    expect(screen.getByText("Pré-cadastros Necessários")).toBeInTheDocument()
    expect(screen.getByText("Cadastrar uma empresa antes de usar esta tela")).toBeInTheDocument()
    expect(screen.getByText("Conteúdo da lição sobre processos.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /POP Mapeamento de Processos/ })).toHaveAttribute(
      "href",
      "https://exemplo.com/pop-processos"
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

    await screen.findByRole("heading", { name: "O que é um processo" })

    expect(screen.getByRole("link", { name: /Lição Anterior/ })).toHaveAttribute(
      "href",
      "/processos/treinamento/9"
    )
    expect(screen.getByRole("link", { name: /Próxima Lição/ })).toHaveAttribute(
      "href",
      "/processos/treinamento/11"
    )
  })

  it("exporta a lição em PDF ao clicar no botão", async () => {
    const { exportLicaoPdf } = await import("@/lib/export-treinamento-processos-pdf")
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