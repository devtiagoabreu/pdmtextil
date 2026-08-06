export type TipoAuth = "oauth2" | "basic" | "api_key" | "bearer"

export interface Integracao {
  id: number
  nome: string
  baseUrl: string
  tipoAuth: TipoAuth
  authConfig: Record<string, unknown>
  telas?: string[]
  mapping?: Record<string, unknown>
  ativo: boolean
}
