import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { integracoes } from "@/lib/db/schema/integracoes"
import { eq } from "drizzle-orm"
export const dynamic = "force-dynamic"

function maskSensitive(value: string): string {
  if (value.length <= 6) return value.slice(0, 2) + "****"
  return value.slice(0, 4) + "****" + value.slice(-4)
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id: idStr } = await params
    const id = Number(idStr)
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
        if (key && location === "header") {
          headers[keyName] = key
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
          if (scope) bodyParams.append("scope", scope)

          // Credentials are sent via Basic Auth header (standard OAuth2)
          const encodedCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

          const tokenRes = await fetch(tokenUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Authorization": `Basic ${encodedCredentials}`,
            },
            body: bodyParams.toString(),
          })

          if (!tokenRes.ok) {
            const tokenError = await tokenRes.text()
            return NextResponse.json({
              success: false,
              status: tokenRes.status,
              time: Date.now() - startTime,
              error: `Falha ao obter token OAuth2`,
              responseBody: tokenError,
              request: { url: integracao.baseUrl, method: "GET" },
              requestHeaders: { Authorization: "Bearer <token_nao_obtido>" },
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

    if (integracao.tipoAuth === "api_key") {
      const location = (authConfig.in as string) || "header"
      if (location === "query") {
        const keyName = (authConfig.key_name as string) || "api_key"
        url.searchParams.set(keyName, (authConfig.key as string) || "")
      }
    }

    // build requestDetails for debug (mask sensitive values)
    const requestHeaders: Record<string, string> = {}
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === "authorization") {
        const parts = v.split(" ")
        requestHeaders[k] = parts[0] + " " + (parts[1] ? maskSensitive(parts[1]) : "")
      } else {
        requestHeaders[k] = v
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
        request: { url: url.toString(), method: "GET" },
        requestHeaders,
      })
    } catch (fetchError: unknown) {
      const elapsed = Date.now() - startTime
      const message = fetchError instanceof Error ? fetchError.message : "Erro de conexão"
      return NextResponse.json({
        success: false,
        status: 0,
        time: elapsed,
        error: `Falha na requisição: ${message}`,
        request: { url: url.toString(), method: "GET" },
        requestHeaders,
      })
    }
  } catch (error) {
    console.error("[GET /api/admin/integracoes/testar]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
