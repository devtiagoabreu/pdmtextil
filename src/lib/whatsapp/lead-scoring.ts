export interface LeadScore {
  score: number // 0-100
  prioridade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA"
  motivos: string[]
}

export function calcularLeadScore(dados: {
  tipoPessoa?: string | null
  documento?: string | null
  linhasInteresse?: number[]
  razaoSocial?: string
  _cnpjConsulta?: { situacao?: string; razaoSocial?: string }
}): LeadScore {
  let score = 0
  const motivos: string[] = []

  if (dados.tipoPessoa === "PJ") {
    score += 30
    motivos.push("Pessoa Juridica (+30)")
  }

  if (dados._cnpjConsulta?.situacao === "ATIVA" || dados._cnpjConsulta?.situacao === "Ativa") {
    score += 20
    motivos.push("CNPJ Ativo (+20)")
  }

  if (dados.linhasInteresse && dados.linhasInteresse.length > 1) {
    score += 15
    motivos.push(`${dados.linhasInteresse.length} linhas de interesse (+15)`)
  } else if (dados.linhasInteresse && dados.linhasInteresse.length === 1) {
    score += 5
    motivos.push("1 linha de interesse (+5)")
  }

  if (dados.razaoSocial) {
    score += 10
    motivos.push("Razao Social identificada (+10)")
  }

  if (dados.documento) {
    score += 10
    motivos.push("Documento informado (+10)")
  }

  score = Math.min(score, 100)

  let prioridade: LeadScore["prioridade"]
  if (score >= 70) prioridade = "CRITICA"
  else if (score >= 50) prioridade = "ALTA"
  else if (score >= 30) prioridade = "MEDIA"
  else prioridade = "BAIXA"

  return { score, prioridade, motivos }
}
