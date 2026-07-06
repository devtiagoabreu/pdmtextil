import { NextAuthOptions, getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { usuarios, accounts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"

export function getUserId(session: { user?: { id?: string } } | null): number | NextResponse {
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Usuário inválido" }, { status: 401 })
  }
  const id = parseInt(session.user.id)
  if (isNaN(id)) {
    return NextResponse.json({ error: "Usuário inválido" }, { status: 401 })
  }
  return id
}

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  const userId = parseInt(session.user.id)
  if (isNaN(userId)) return NextResponse.json({ error: "Usuário inválido" }, { status: 401 })
  return { session, userId }
}

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciais inválidas")
        }
        const user = await db.select().from(usuarios).where(eq(usuarios.email, credentials.email)).limit(1)
        if (!user[0] || !user[0].password) {
          throw new Error("Usuário não encontrado")
        }
        const passwordMatch = await bcrypt.compare(credentials.password, user[0].password)
        if (!passwordMatch) throw new Error("Senha incorreta")
        if (!user[0].ativo) throw new Error("Usuário inativo")
        return { id: user[0].id.toString(), email: user[0].email, name: user[0].name, role: user[0].role }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive.file",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        let existing = await db.select().from(usuarios).where(eq(usuarios.email, user.email!)).limit(1)
        if (!existing[0]) {
          const [novo] = await db.insert(usuarios).values({
            email: user.email!,
            name: user.name || user.email!.split("@")[0],
            role: "COMERCIAL",
            ativo: true,
            idIntegracao: account.providerAccountId,
          }).returning()
          existing = [novo]
        }
        const link = await db.select().from(accounts).where(
          and(eq(accounts.provider, "google"), eq(accounts.providerAccountId, account.providerAccountId!))
        ).limit(1)
        if (!link[0]) {
          await db.insert(accounts).values({
            userId: existing[0].id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId!,
            refreshToken: account.refresh_token,
            accessToken: account.access_token,
            expiresAt: account.expires_at,
            tokenType: account.token_type,
            scope: account.scope,
            idToken: account.id_token,
          })
        }
        user.id = existing[0].id.toString()
        user.role = existing[0].role
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        if (account?.provider === "google") {
          token.accessToken = account.access_token
          token.refreshToken = account.refresh_token
        }
        try {
          const { registrarLog } = await import("@/lib/notificar")
          await registrarLog({ tipo: "LOGIN", acao: "logar", descricao: `Login realizado via ${account?.provider || "credentials"}`, entidade: "Usuario", entidadeId: parseInt(String(user.id)), usuarioNome: user.name })
        } catch {}
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        ;(session.user as any).accessToken = token.accessToken
      }
      return session
    }
  },
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
}
