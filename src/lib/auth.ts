import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

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
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = user.role }
      return token
    },
    async session({ session, token }) {
      if (session.user) { session.user.id = token.id as string; session.user.role = token.role as string }
      return session
    }
  },
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
}
