import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname
    if (path === "/login") return NextResponse.next()
    return NextResponse.next()
  },
  { callbacks: { authorized: ({ token }) => !!token } }
)

export const config = { matcher: ["/dashboard", "/dashboard/:path*", "/documentos", "/documentos/:path*", "/comercial/:path*", "/admin/:path*", "/cadastros/:path*", "/ferramentas/:path*", "/chat", "/chat/:path*", "/amostras", "/amostras/:path*", "/perfil", "/perfil/:path*", "/api/solicitacoes/:path*"] }
