export type EnderecoCampos = {
  endereco?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  uf?: string | null
}

export function montarEnderecoTexto(campos: EnderecoCampos): string {
  return [campos.endereco, campos.numero, campos.complemento, campos.bairro, campos.cidade, campos.uf]
    .filter(Boolean)
    .map((v) => String(v).trim())
    .join(", ")
}

export function temEndereco(campos: EnderecoCampos): boolean {
  return Boolean(campos.endereco || campos.numero || campos.complemento || campos.bairro || campos.cidade || campos.uf)
}