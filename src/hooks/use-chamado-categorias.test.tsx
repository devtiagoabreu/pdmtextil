// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import {
  CHAMADO_CATEGORIA_CORES_OPCOES,
  chamadoCategoriaBadgeClass,
  useChamadoCategorias,
} from "./use-chamado-categorias"

const CATEGORIAS_MOCK = [
  { id: 1, codigo: "INCIDENTE", nome: "Incidente", cor: "red", ativo: true, ordem: 10 },
  { id: 2, codigo: "SOLICITACAO", nome: "Solicitação", cor: "blue", ativo: true, ordem: 20 },
  { id: 3, codigo: "LEGADO", nome: "Categoria antiga", cor: "purple", ativo: false, ordem: 30 },
]

function wrapperFor() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(CATEGORIAS_MOCK), { status: 200 }))
  vi.stubGlobal("fetch", fetchMock)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { wrapper, fetchMock }
}

describe("useChamadoCategorias", () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it("carrega somente ativas por padrão e resolve o label pelo código", async () => {
    const { wrapper, fetchMock } = wrapperFor()
    const { result } = renderHook(() => useChamadoCategorias(), { wrapper })

    await waitFor(() => expect(result.current.categorias).toHaveLength(3))
    expect(fetchMock).toHaveBeenCalledWith("/api/chamados/categorias?somenteAtivas=true")
    expect(result.current.label("INCIDENTE")).toBe("Incidente")
    expect(result.current.porCodigo.get("SOLICITACAO")?.cor).toBe("blue")
  })

  it("carrega todas as categorias quando somenteAtivas é false", async () => {
    const { wrapper, fetchMock } = wrapperFor()
    const { result } = renderHook(() => useChamadoCategorias(false), { wrapper })

    await waitFor(() => expect(result.current.categorias).toHaveLength(3))
    expect(fetchMock).toHaveBeenCalledWith("/api/chamados/categorias")
    expect(result.current.label("LEGADO")).toBe("Categoria antiga")
    expect(result.current.label("NAO_EXISTE")).toBe("NAO_EXISTE")
    expect(result.current.label(null)).toBe("—")
  })

  it("devolve lista vazia quando a API falha", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "boom" }), { status: 500 }))
    )
    const { result } = renderHook(() => useChamadoCategorias(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    await waitFor(() => expect(result.current.categorias).toHaveLength(0))
    expect(result.current.label("INCIDENTE")).toBe("INCIDENTE")
  })
})

describe("chamadoCategoriaBadgeClass", () => {
  it("mapeia as cores conhecidas", () => {
    expect(chamadoCategoriaBadgeClass("red")).toContain("bg-red-100")
    expect(chamadoCategoriaBadgeClass("RED")).toContain("bg-red-100")
  })

  it("cai para slate em cores desconhecidas ou vazias", () => {
    expect(chamadoCategoriaBadgeClass("nao-existe")).toContain("bg-slate-100")
    expect(chamadoCategoriaBadgeClass(null)).toContain("bg-slate-100")
    expect(chamadoCategoriaBadgeClass(undefined)).toContain("bg-slate-100")
  })

  it("expõe as opções de cor com slate como fallback da lista", () => {
    expect(CHAMADO_CATEGORIA_CORES_OPCOES).toContain("red")
    expect(CHAMADO_CATEGORIA_CORES_OPCOES).toContain("slate")
  })
})
