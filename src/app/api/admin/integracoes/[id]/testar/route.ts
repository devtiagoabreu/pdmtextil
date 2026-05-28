import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { integracoes } from "@/lib/db/schema/integracoes"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const id = Number(params.id)
    if (!id) {
      return NextResponse.json({ error: "id inválido" }, { status: 400 })
    }

    const [integracao] = await db.select().from(integracoes).where(eq(integracoes.id, id))
    if (!integracao) {
      return NextResponse.json({ error: "Integração não encontrada" }, { status: 404 })
    }

    const authConfig = (integracao.authConfig || {}) as Record<string, unknown>
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    }

    const startTime = Date.now()

    switch (integracao.tipoAuth) {
      case "bearer": {
        const token = authConfig.token as string
        if (token) headers["Authorization"] = `Bearer ${token}`
        break
      }
      case "basic": {
        const username = (authConfig.username as string) || ""
        const password = (authConfig.password as string) || ""
        const encoded = Buffer.from(`${username}:${password}`).toString("base64")
        headers["Authorization"] = `Basic ${encoded}`
        break
      }
      case "api_key": {
        const key = authConfig.key as string
        const keyName = (authConfig.key_name as string) || "x-api-key"
        const location = (authConfig.in as string) || "header"
        if (key) {
          if (location === "header") {
            headers[keyName] = key
          }
        }
        break
      }
      case "oauth2": {
        const grantType = (authConfig.grant_type as string) || "client_credentials"
        const clientId = authConfig.client_id as string
        const clientSecret = authConfig.client_secret as string
        const tokenUrl = authConfig.token_url as string
        const scope = authConfig.scope as string

        if (tokenUrl && clientId && clientSecret) {
          const bodyParams = new URLSearchParams()
          bodyParams.append("grant_type", grantType)
          bodyParams.append("client_id", clientId)
          bodyParams.append("client_secret", clientSecret)
          if (scope) bodyParams.append("scope", scope)

          const tokenRes = await fetch(tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: bodyParams.toString(),
          })

          if (!tokenRes.ok) {
            const tokenError = await tokenRes.text()
            return NextResponse.json({
              success: false,
              status: tokenRes.status,
              time: Date.now() - startTime,
              error: `Falha ao obter token OAuth2: ${tokenError}`,
              responseBody: tokenError,
            })
          }

          const tokenData = await tokenRes.json()
          const accessToken = tokenData.access_token
          if (accessToken) {
            headers["Authorization"] = `Bearer ${accessToken}`
          }
        }
        break
      }
    }

    const url = new URL(integracao.baseUrl)

    // api_key in query param
    if (integracao.tipoAuth === "api_key") {
      const authConfigApiKey = authConfig as Record<string, unknown>
      const location = (authConfigApiKey.in as string) || "header"
      if (location === "query") {
        const keyName = (authConfigApiKey.key_name as string) || "api_key"
        url.searchParams.set(keyName, (authConfigApiKey.key as string) || "")
      }
    }

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(15000),
      })

      const elapsed = Date.now() - startTime
      const responseText = await response.text()

      let responseJson: unknown = null
      try {
        responseJson = JSON.parse(responseText)
      } catch {
        // not JSON
      }

      return NextResponse.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        time: elapsed,
        responseBody: responseJson || responseText.slice(0, 2000),
        responseHeaders: Object.fromEntries(response.headers.entries()),
      })
    } catch (fetchError: unknown) {
      const elapsed = Date.now() - startTime
      const message = fetchError instanceof Error ? fetchError.message : "Erro de conexão"
      return NextResponse.json({
        success: false,
        status: 0,
        time: elapsed,
        error: `Falha na requisição: ${message}`,
      })
    }
  } catch (error) {
    console.error("[GET /api/admin/integracoes/testar]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
