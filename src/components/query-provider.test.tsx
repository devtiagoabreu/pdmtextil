// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { useQuery } from "@tanstack/react-query"
import { QueryProvider } from "./query-provider"
import { createFetchMock } from "@/test/harness"

function makeProbe(testid: string) {
  return function Probe() {
    const { data } = useQuery({
      queryKey: ["probe-refetch"],
      queryFn: async () => {
        const res = await fetch("/api/probe")
        return res.json()
      },
    })
    return <div data-testid={testid}>{String(data?.ok)}</div>
  }
}

describe("QueryProvider", () => {
  it("refaz fetch ao remontar o consumidor mesmo com dados frescos (refetchOnMount always)", async () => {
    let calls = 0
    const fetchMock = createFetchMock(() => {
      calls++
      return { status: 200, json: { ok: true } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    const ProbeA = makeProbe("a")
    const ProbeB = makeProbe("b")

    const { rerender } = render(
      <QueryProvider>
        <ProbeA />
      </QueryProvider>,
    )
    await screen.findByTestId("a")
    expect(calls).toBe(1)

    rerender(
      <QueryProvider>
        <ProbeB />
      </QueryProvider>,
    )
    await screen.findByTestId("b")
    expect(calls).toBe(2)
  })
})
