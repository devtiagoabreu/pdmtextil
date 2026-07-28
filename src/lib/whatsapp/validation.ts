export function extrairDoc(texto: string, tipoPessoaForcado?: string): { doc: string; tipo: string } | null {
  const numeros = texto.match(/\d{8,}/g) || []
  if (numeros.length === 0) return null

  const clean = numeros[0].replace(/\D/g, "")

  if (tipoPessoaForcado === "PF" || tipoPessoaForcado === "PJ") {
    return { doc: clean, tipo: tipoPessoaForcado }
  }

  if (clean.length === 14) return { doc: clean, tipo: "PJ" }
  if (clean.length === 11) return { doc: clean, tipo: "PF" }
  if (clean.length >= 8 && clean.length <= 13) return { doc: clean, tipo: "PF" }

  return null
}

export function detectarTipo(texto: string): string | null {
  if (/\b(1|pf|fisica|física)\b/.test(texto)) return "PF"
  if (/\b(2|pj|juridica|jurídica|cnpj)\b/.test(texto)) return "PJ"
  return null
}

export function pareceNome(texto: string): boolean {
  const alpha = texto.replace(/[^a-zA-ZÀ-ÿ ]/g, "").trim()
  return alpha.length > 2
}

export function confirmou(texto: string): boolean {
  return /\b(sim|s|ss|claro|ok|confirmo|correto|certo)\b/.test(texto)
}

export function parseLinhas(texto: string, maxNumero: number): number[] {
  const nums = texto.match(/\d/g)
  if (!nums) return []
  return [...new Set(nums.map(Number))].filter((n) => n >= 1 && n <= maxNumero).sort()
}

export function linhasNomes(nums: number[], linhaMap: Record<number, string>): string {
  return nums.map((n) => `${n} - ${linhaMap[n]}`).join(", ")
}

export function extrairNomeDaResposta(texto: string): string | null {
  const t = texto.toLowerCase().trim()
  const padroes = [
    /\b(?:meu\s+nome\s+e|me\s+chamo|pode\s+me\s+chamar\s+de|sou\s+a?o?\s+|me\s+informo\s+como)\s+(.+)/i,
    /^(.+?)(?:aqui|falando|escrevendo|contatando)/i,
  ]
  for (const padrao of padroes) {
    const m = texto.match(padrao)
    if (m && m[1]) {
      let nome = m[1].trim().replace(/[.,!?;:]+$/, "").trim()
      if (nome.length > 2 && nome.length < 60 && pareceNome(nome) && !rejeitarNome(nome)) {
        return nome
      }
    }
  }
  if (pareceNome(texto) && !rejeitarNome(texto) && texto.split(" ").length <= 4 && texto.length < 40) {
    return texto.trim()
  }
  return null
}

export function rejeitarNome(texto: string): string | null {
  const t = texto.toLowerCase().trim()
  if (/^\d+$/.test(t)) return "numero_puro"
  if (/\d/.test(t) && /\b(ano|mes|dia|hora|idade|ano|tel|cel|whatsapp)\b/.test(t)) return "idade_ou_info_pessoal"
  if (/^(tenho|possuo|sou|meu|minha|meu nome|meu nome e|minha nome)\b/.test(t) && t.split(" ").length <= 3) return "frase_incompleta"
  if (/^(nao sei|não sei|nao quero|não quero|deixa pra la|deixa pra la|se foda|foda-se|tanto faz|indiferente|whatever|ok|sim|nao|não|s|n)\b/.test(t)) return "resposta_evaziva"
  if (/^(cpf|cnpj|documento|doc|registro)\b/.test(t)) return "documento_no_nome"
  if (/^(preco|preço|valor|quanto|custa|frete)\b/.test(t)) return "pergunta_fora_do_fluxo"
  if (/^(oi|ola|olá|bom dia|boa tarde|boa noite|hello|hi|hey)\b/.test(t) && t.split(" ").length <= 3) return "saudacao_sem_nome"
  return null
}

export function negou(texto: string): boolean {
  return /\b(nao|não|errado|incorreto|alterar|corrigir|voltar|diferente|trocar|mudar)\b/.test(texto)
}

export function pediuAtendente(texto: string): boolean {
  const t = texto.toLowerCase().trim()
  return /\b(falar com|falar pra|atendente|humano|pessoa|representante|suporte|ajuda humana|atencao|admin|gerente)\b/.test(t)
}

export function pediuReiniciar(texto: string): boolean {
  const t = texto.toLowerCase().trim()
  return /\b(reiniciar|recomecar|comecar de novo|do zero|comecar do zero|recomecar do zero|resetar|reset|limpar)\b/.test(t)
}
