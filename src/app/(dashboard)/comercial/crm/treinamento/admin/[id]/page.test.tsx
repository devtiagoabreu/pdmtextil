// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import EditarLicaoPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

const licao = {
  id: 10,
  moduloId: 1,
  moduloTitulo: "Visão Geral",
  titulo: "Introdução ao CRM",
  conteudoMd: "## Visão Geral\n\nConteúdo da lição.",
  preRequisitos: "Cadastro de leads",
  linksPop: [{ label: "POP", url: "https://exemplo.com/pop" }],
  linksVideo: [],
  pathnameRelacionado: "/comercial/crm/leads",
  ordem: 2,
  ativo: true,
}

describe("EditarLicaoPage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    navMock.setPathname("/comercial/crm/treinamento/admin/10")
    navMock.setParams({ id: "10" })
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/treinamento/modulos") return { json: [{ id: 1, titulo: "Visão Geral" }] }
      if (method === "GET" && url === "/api/crm/treinamento/10") return { json: licao }
      if (method === "PUT" && url === "/api/crm/treinamento/10") return { json: { ok: true } }
      return { json: null }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("carrega e exibe os dados da lição", async () => {
    renderPage(<EditarLicaoPage />)

    expect(await screen.findByRole("heading", { name: "Editar Lição" })).toBeInTheDocument()
    await screen.findByDisplayValue("Introdução ao CRM")
    expect(screen.getByDisplayValue("Cadastro de leads")).toBeInTheDocument()
    expect(screen.getByDisplayValue("2")).toBeInTheDocument()
    expect(screen.getByRole("checkbox")).toBeChecked()
  })

  it("valida módulo e título antes de salvar", async () => {
    const { container } = renderPage(<EditarLicaoPage />)
    await screen.findByDisplayValue("Introdução ao CRM")

    fireEvent.change(screen.getByDisplayValue("Introdução ao CRM"), { target: { value: "" } })
    fireEvent.submit(container.querySelector("form")!)

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Módulo e título são obrigatórios"))
    expect(findCall(fetchMock.calls, "/api/crm/treinamento/10", "PUT")).toBeUndefined()
  })

  it("salva as alterações via PUT e navega para a lista", async () => {
    const { container } = renderPage(<EditarLicaoPage />)
    await screen.findByDisplayValue("Introdução ao CRM")

    fireEvent.change(screen.getByDisplayValue("Introdução ao CRM"), {
      target: { value: "Introdução ao CRM v2" },
    })
    fireEvent.submit(container.querySelector("form")!)

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/treinamento/10", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({
        moduloId: 1,
        titulo: "Introdução ao CRM v2",
        conteudoMd: "## Visão Geral\n\nConteúdo da lição.",
        preRequisitos: "Cadastro de leads",
        linksPop: [{ label: "POP", url: "https://exemplo.com/pop" }],
        linksVideo: [],
        pathnameRelacionado: "/comercial/crm/leads",
        ordem: 2,
        ativo: true,
      })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Lição atualizada!"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/treinamento/admin")
  })
})
