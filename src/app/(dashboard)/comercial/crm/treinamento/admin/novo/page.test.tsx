// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import NovaLicaoPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

const modulos = [{ id: 1, titulo: "Visão Geral" }]

describe("NovaLicaoPage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    navMock.setPathname("/comercial/crm/treinamento/admin/novo")
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/treinamento/modulos") return { json: modulos }
      if (method === "POST" && url === "/api/crm/treinamento") return { status: 201, json: { id: 99 } }
      return { json: null }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("renderiza o formulário com os módulos disponíveis", async () => {
    renderPage(<NovaLicaoPage />)

    expect(await screen.findByRole("heading", { name: "Nova Lição" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Salvar Lição" })).toBeInTheDocument()
    expect(await screen.findByRole("option", { name: "Visão Geral" })).toBeInTheDocument()
  })

  it("valida módulo e título antes de salvar", async () => {
    const { container } = renderPage(<NovaLicaoPage />)
    await screen.findByRole("heading", { name: "Nova Lição" })

    fireEvent.submit(container.querySelector("form")!)

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Módulo e título são obrigatórios"))
    expect(findCall(fetchMock.calls, "/api/crm/treinamento", "POST")).toBeUndefined()
  })

  it("cria a lição via POST e navega para a lista", async () => {
    const { container } = renderPage(<NovaLicaoPage />)
    await screen.findByRole("heading", { name: "Nova Lição" })
    await screen.findByRole("option", { name: "Visão Geral" })

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } })
    fireEvent.change(screen.getByPlaceholderText("Ex: Cadastro de Leads - Campo a Campo"), {
      target: { value: "Cadastro de Leads" },
    })
    fireEvent.submit(container.querySelector("form")!)

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/treinamento", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({
        moduloId: 1,
        titulo: "Cadastro de Leads",
        conteudoMd: "",
        preRequisitos: null,
        linksPop: [],
        linksVideo: [],
        pathnameRelacionado: null,
        ordem: 0,
      })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Lição criada com sucesso!"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/treinamento/admin")
  })

  it("mostra erro quando o POST falha", async () => {
    const failMock = createFetchMock(({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/treinamento/modulos") return { json: modulos }
      if (method === "POST" && url === "/api/crm/treinamento") return { status: 500, json: { error: "erro" } }
      return { json: null }
    })
    vi.stubGlobal("fetch", failMock.fn)
    const { container } = renderPage(<NovaLicaoPage />)
    await screen.findByRole("heading", { name: "Nova Lição" })
    await screen.findByRole("option", { name: "Visão Geral" })

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } })
    fireEvent.change(screen.getByPlaceholderText("Ex: Cadastro de Leads - Campo a Campo"), {
      target: { value: "Cadastro de Leads" },
    })
    fireEvent.submit(container.querySelector("form")!)

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Erro ao criar lição"))
  })
})
