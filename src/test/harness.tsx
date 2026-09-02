import { render } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { vi } from "vitest"
import type { ReactNode } from "react"

export const navMock = {
  router: {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  },
  params: {} as Record<string, string>,
  pathname: "/",
  searchParams: new URLSearchParams(),
  setPathname(pathname: string) {
    navMock.pathname = pathname
  },
  setParams(params: Record<string, string>) {
    navMock.params = params
  },
  setSearchParams(params: Record<string, string> | URLSearchParams) {
    navMock.searchParams = params instanceof URLSearchParams ? params : new URLSearchParams(params)
  },
  reset() {
    navMock.pathname = "/"
    navMock.params = {}
    navMock.searchParams = new URLSearchParams()
    for (const key of Object.keys(navMock.router) as (keyof typeof navMock.router)[]) {
      navMock.router[key].mockClear()
    }
  },
}

export const toastMock = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
}

export type MockFetchResult = { status?: number; json?: unknown }
export type MockFetchHandler = (req: {
  method: string
  url: string
  body?: any
}) => MockFetchResult | Promise<MockFetchResult>

export interface FetchCall {
  url: string
  method: string
  body?: any
}

export function createFetchMock(handler: MockFetchHandler) {
  const calls: FetchCall[] = []
  const fn = vi.fn(async (input: any, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : String(input?.url ?? input)
    const method = init?.method ?? "GET"
    let body: any = undefined
    if (init?.body && typeof init.body === "string") {
      try {
        body = JSON.parse(init.body)
      } catch {
        body = init.body
      }
    }
    calls.push({ url, method, body })
    const result = (await handler({ method, url, body })) ?? { json: null }
    const { status = 200, json = null } = result
    return new Response(JSON.stringify(json), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  })
  return { fn, calls }
}

export function routeJson(routes: Record<string, unknown>): MockFetchHandler {
  return ({ method, url }) => {
    const key = `${method} ${url}`
    if (key in routes) return { status: 200, json: routes[key] }
    if (url in routes) return { status: 200, json: routes[url] }
    return { status: 404, json: { error: `Rota não mockada: ${key}` } }
  }
}

export function findCall(calls: FetchCall[], url: string, method?: string) {
  return calls.find((c) => c.url === url && (!method || c.method === method))
}

export function renderPage(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return {
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
    queryClient,
  }
}
