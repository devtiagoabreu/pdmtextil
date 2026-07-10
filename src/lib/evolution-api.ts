const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ""
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ""
const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || ""

export function evolutionConfigurado() {
  return !!(EVOLUTION_API_URL && EVOLUTION_API_KEY && EVOLUTION_INSTANCE_NAME)
}

type EnviarResult = {
  sucesso: boolean
  externalId?: string
  erro?: string
}

export async function enviarMensagem(numero: string, texto: string): Promise<EnviarResult> {
  if (!evolutionConfigurado()) {
    return { sucesso: false, erro: "Evolution API não configurada" }
  }

  const numeroLimpo = numero.replace(/\D/g, "")
  if (numeroLimpo.length < 10) {
    return { sucesso: false, erro: "Número inválido" }
  }

  try {
    const url = `${EVOLUTION_API_URL.replace(/\/$/, "")}/message/sendText/${EVOLUTION_INSTANCE_NAME}`
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: numeroLimpo,
        text: texto,
        delay: 1,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { sucesso: false, erro: `Evolution API: ${res.status} - ${err}` }
    }

    const data = await res.json()
    return {
      sucesso: true,
      externalId: data?.key?.id || data?.key?.remoteJid || null,
    }
  } catch (error) {
    return { sucesso: false, erro: `Erro ao conectar com Evolution API: ${(error as Error).message}` }
  }
}
