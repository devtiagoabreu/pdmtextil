import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    if (path === "/login") return NextResponse.next()
    if (path.startsWith("/comercial") && token?.role !== "COMERCIAL" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    if (path.startsWith("/tecelagem") && token?.role !== "TECELAGEM" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    if (path.startsWith("/beneficiamento") && token?.role !== "BENEFICIAMENTO" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    return NextResponse.next()
  },
  { callbacks: { authorized: ({ token }) => !!token } }
)

export const config = { matcher: ["/comercial/:path*", "/tecelagem/:path*", "/beneficiamento/:path*", "/dashboard/:path*", "/api/solicitacoes/:path*"] }
