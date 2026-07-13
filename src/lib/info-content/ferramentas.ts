import type { InfoContent } from "./types"

export const ferramentasContent: Record<string, InfoContent> = {
  "/ferramentas": {
    title: "Ferramentas",
    description: "Central de ferramentas auxiliares do sistema para cálculos e operações do dia a dia.",
    rules: [
      "Cada ferramenta é independente e não afeta dados do sistema.",
      "Ferramentas estão disponíveis para todos os usuários autenticados.",
    ],
  },
  "/ferramentas/conversores": {
    title: "Numeração de Fio",
    description: "Conversor entre diferentes sistemas de numeração de fios: Ne, Nm, Tex, Dtex e Denier.",
    rules: [
      "A conversão é feita em tempo real conforme você digita.",
      "Os valores são aproximados devido a diferenças nos sistemas de medida.",
      "Ne (Cotton) é o sistema mais comum no Brasil para fios de algodão.",
    ],
  },
  "/ferramentas/regra-de-tres": {
    title: "Calculadora de Regra de Três",
    description: "Resolve regra de três simples (direta ou inversa) e composta para cálculos rápidos do dia a dia.",
    rules: [
      "Regra direta: grandezas que variam na mesma proporção.",
      "Regra inversa: grandezas que variam em proporção inversa.",
      "Regra composta: três ou mais grandezas relacionadas.",
    ],
  },
  "/ferramentas/consulta-cnpj": {
    title: "Consulta CNPJ",
    description: "Consulta dados de empresas na base da Receita Federal através do CNPJ.",
    rules: [
      "A consulta é feita em tempo real via API pública da Receita Federal.",
      "Os dados exibidos incluem razão social, endereço, CNAE, situação cadastral e sócios.",
      "A ferramenta é apenas para consulta — não altera nenhum dado no sistema.",
    ],
    fields: [
      { name: "CNPJ", desc: "Número do CNPJ a consultar (apenas dígitos)" },
      { name: "Resultado", desc: "Dados completos da empresa retornados pela Receita Federal" },
    ],
  },
}
