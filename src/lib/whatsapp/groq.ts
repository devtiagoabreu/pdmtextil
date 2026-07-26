import { buildSystemPrompt } from "./prompt"

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

export async function chamarGroq(
  userMessage: string,
  pushName: string,
  estado: string,
  dados: Record<string, any>,
  historico: Array<{ role: "user" | "assistant"; content: string }>,
  linhas: { numero: number; nome: string }[]
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey || apiKey === "cole-sua-chave-groq-aqui") {
    console.error("[Groq] GROQ_API_KEY não configurada")
    return "Desculpe, estou com dificuldades tecnicas no momento. Por favor, tente novamente em instantes."
  }

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile"

  const systemMessage = buildSystemPrompt(linhas).replace("{{pushName}}", pushName)
    .replace("{{estado}}", estado)
    .replace("{{dados}}", JSON.stringify(dados))

  const messages = [
    { role: "system" as const, content: systemMessage },
    ...historico.slice(-15),
    { role: "user" as const, content: userMessage },
  ]

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 300,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`[Groq] Erro ${res.status}:`, err)
    return "Desculpe, estou com dificuldades tecnicas no momento. Por favor, tente novamente em instantes."
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || "Desculpe, nao consegui processar sua mensagem."
}
