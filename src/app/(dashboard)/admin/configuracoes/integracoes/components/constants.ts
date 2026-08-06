import type { TipoAuth } from "./types"

export const TIPO_AUTH_LABEL: Record<string, string> = {
  oauth2: "OAuth2",
  basic: "Basic Auth",
  api_key: "API Key",
  bearer: "Bearer Token",
}

export const TIPO_AUTH_ICON: Record<string, string> = {
  oauth2: "text-purple-600 bg-purple-50 dark:bg-purple-950/50",
  basic: "text-blue-600 bg-blue-50 dark:bg-blue-950/50",
  api_key: "text-amber-600 bg-amber-50 dark:bg-amber-950/50",
  bearer: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50",
}

export const PDM_CAMPOS_POR_TELA: Record<string, { label: string; value: string }[]> = {
  default: [
    { label: "(não mapear)", value: "" },
    { label: "ID", value: "id" },
    { label: "Nome", value: "nome" },
    { label: "CNPJ", value: "cnpj" },
    { label: "Razão Social", value: "razaoSocial" },
    { label: "Email", value: "email" },
    { label: "Telefone", value: "telefone" },
    { label: "Contato", value: "contato" },
    { label: "Endereço", value: "endereco" },
    { label: "Cidade", value: "cidade" },
    { label: "UF", value: "uf" },
    { label: "ID Integração", value: "idIntegracao" },
    { label: "Ativo", value: "ativo" },
  ],
  romaneios: [
    { label: "(não mapear)", value: "" },
    { label: "Romaneio", value: "romaneio" },
    { label: "Pedido", value: "pedido" },
    { label: "CNPJ", value: "cnpj" },
    { label: "Nome Cliente", value: "nomeCliente" },
    { label: "Fantasia", value: "fantasia" },
    { label: "Cidade", value: "cidade" },
    { label: "UF", value: "uf" },
    { label: "Representante", value: "nomeRepresentante" },
    { label: "Região", value: "nomeRegiao" },
    { label: "Situação", value: "situacao" },
    { label: "Emissão", value: "emissao" },
    { label: "Entrega", value: "entrega" },
    { label: "Chegada", value: "chegada" },
    { label: "Período", value: "periodo" },
    { label: "Linha", value: "linha" },
    { label: "Grupo", value: "grupo" },
    { label: "Sub", value: "sub" },
    { label: "Cód. Rolo", value: "codigoRolo" },
    { label: "Produto", value: "produto" },
    { label: "Narrativa", value: "narrativa" },
    { label: "Lote", value: "lote" },
    { label: "Lote Produto", value: "loteProduto" },
    { label: "Quantidade (m)", value: "quantidade" },
    { label: "Peso Bruto", value: "pesoBruto" },
    { label: "Peso Líquido", value: "pesoLiquido" },
    { label: "Data Entrada", value: "dataEntrada" },
    { label: "OP", value: "op" },
    { label: "Operador", value: "nomeOperador" },
    { label: "Largura", value: "largura" },
    { label: "Gramatura", value: "gramatura" },
    { label: "Endereço Rolo", value: "enderecoRolo" },
    { label: "Nuance", value: "nuance" },
    { label: "Qualidade", value: "qualidade" },
    { label: "Pontuação", value: "pontuacao" },
    { label: "Cor", value: "cor" },
    { label: "Vendido", value: "vendido" },
    { label: "Saldo", value: "saldo" },
    { label: "Unitário", value: "unitario" },
    { label: "Valor Vendido", value: "valorVendido" },
    { label: "ID Integração", value: "idIntegracao" },
  ],
}

export function getPdmCampos(telas: string): { label: string; value: string }[] {
  const telasArr = telas.split(",").map((t: any) => t.trim()).filter(Boolean)
  const campos = new Map<string, { label: string; value: string }>()
  for (const c of PDM_CAMPOS_POR_TELA.default) campos.set(c.value, c)
  for (const t of telasArr) {
    const extra = PDM_CAMPOS_POR_TELA[t]
    if (extra) for (const c of extra) campos.set(c.value, c)
  }
  return Array.from(campos.values())
}

export function getAuthPlaceholder(tipo: TipoAuth): string {
  const examples: Record<TipoAuth, string> = {
    oauth2: JSON.stringify({ grant_type: "client_credentials", client_id: "xxx", client_secret: "xxx", token_url: "https://...", scope: "read" }, null, 2),
    basic: JSON.stringify({ username: "admin", password: "123456" }, null, 2),
    api_key: JSON.stringify({ key: "abc123", key_name: "x-api-key", in: "header" }, null, 2),
    bearer: JSON.stringify({ token: "abc123xyz" }, null, 2),
  }
  return examples[tipo]
}
