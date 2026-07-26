export async function consultarCNPJ(cnpj: string): Promise<{ razaoSocial: string; nomeFantasia: string; situacao: string; endereco: string; bairro: string; cidade: string; uf: string } | null> {
  try {
    const cnpjLimpo = cnpj.replace(/\D/g, "")
    const res = await fetch(`https://api.opencnpj.org/${cnpjLimpo}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data || !data.razao_social) return null
    const addr = data.logradouro || ""
    const num = data.numero || ""
    const bairro = data.bairro || ""
    const cidade = data.municipio || ""
    const uf = data.uf || ""
    const endereco = num ? `${addr}, ${num}` : addr
    return {
      razaoSocial: data.razao_social || "",
      nomeFantasia: data.nome_fantasia || "",
      situacao: data.situacao_cadastral || "",
      endereco,
      bairro,
      cidade,
      uf,
    }
  } catch (err) {
    console.error("[consultarCNPJ] Erro:", err)
    return null
  }
}
