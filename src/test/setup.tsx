import { beforeEach, vi } from "vitest"
import { navMock, toastMock } from "./harness"

vi.mock("next/navigation", () => ({
  useRouter: () => navMock.router,
  useParams: () => navMock.params,
  usePathname: () => navMock.pathname,
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={typeof href === "string" ? href : href?.pathname ?? "#"} {...props}>
      {children}
    </a>
  ),
}))

vi.mock("sonner", () => ({
  toast: toastMock,
}))

beforeEach(() => {
  navMock.reset()
  toastMock.success.mockClear()
  toastMock.error.mockClear()
  toastMock.info.mockClear()
  toastMock.warning.mockClear()

  if (typeof window === "undefined") return

  window.alert = vi.fn()
  window.confirm = vi.fn(() => true)

  if (!("ResizeObserver" in window)) {
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    ;(window as any).ResizeObserver = ResizeObserverStub
  }
  if (!("IntersectionObserver" in window)) {
    class IntersectionObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
      root = null
      rootMargin = ""
      thresholds = []
    }
    ;(window as any).IntersectionObserver = IntersectionObserverStub
  }
  if (!("matchMedia" in window)) {
    ;(window as any).matchMedia = () => ({
      matches: false,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn()
  }
})
