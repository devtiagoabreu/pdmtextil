import { buildSystemPrompt } from "./prompt"
import { chamarIA, type ResultadoIA } from "@/lib/ai"

export async function chamarGroq(
  userMessage: string,
  pushName: string,
  estado: string,
  dados: Record<string, any>,
  historico: Array<{ role: "user" | "assistant"; content: string }>,
  linhas: { numero: number; nome: string }[]
): Promise<ResultadoIA> {
  const systemMessage = buildSystemPrompt(linhas)
    .replace("{{pushName}}", pushName)
    .replace("{{estado}}", estado)
    .replace("{{dados}}", JSON.stringify(dados))

  const messages = [
    { role: "system" as const, content: systemMessage },
    ...historico.slice(-15),
    { role: "user" as const, content: userMessage },
  ]

  return chamarIA(messages, { temperatura: 0.7, maxTokens: 300 })
}
