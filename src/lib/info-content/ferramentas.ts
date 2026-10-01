import type { InfoContent } from "./types"

export const ferramentasContent: Record<string, InfoContent> = {
  "/ferramentas": {
    title: "Ferramentas",
    description:
      "Central de ferramentas auxiliares do sistema para cálculos e operações do dia a dia.",
    rules: [
      "Cada ferramenta é independente e não afeta dados do sistema.",
      "Ferramentas estão disponíveis para todos os usuários autenticados.",
    ],
  },
  "/ferramentas/conversores": {
    title: "Numeração de Fio",
    description:
      "Conversor entre diferentes sistemas de numeração de fios: Ne, Nm, Tex, Dtex e Denier.",
    rules: [
      "A conversão é feita em tempo real conforme você digita.",
      "Os valores são aproximados devido a diferenças nos sistemas de medida.",
      "Ne (Cotton) é o sistema mais comum no Brasil para fios de algodão.",
    ],
  },
  "/ferramentas/regra-de-tres": {
    title: "Calculadora de Regra de Três",
    description:
      "Resolve regra de três simples (direta ou inversa) e composta para cálculos rápidos do dia a dia.",
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
  "/ferramentas/nfe-cte": {
    title: "NF-e → CT-e por Período",
    description:
      "Relatório que lista todas as NF-e que possuem CT-e em um período, com razão social da transportadora, do tomador e do fornecedor, e o percentual de cada NF-e no total do CT-e.",
    rules: [
      "A granularidade é NF-e: cada linha é uma nota, e os dados do CT-e são repetidos em suas linhas.",
      "O período filtra pela data de emissão da NF-e. Sem cabeçalho de NF-e, vale a data do CT-e.",
      "O percentual fecha em 100% por CT-e; arredondamento de centavos pode gerar 99,99% ou 100,01%.",
      "O total do CT-e é o valor do frete, não o valor da carga — por isso o percentual costuma ser baixo.",
      "NF-e sem cabeçalho aparece com data, valor e situação vazios, mas continua na lista.",
      "Nome de fornecedor pode vir vazio quando o CNPJ não está cadastrado no ERP de origem.",
      "A ferramenta é somente de leitura — não altera nenhum dado no sistema.",
    ],
    fields: [
      { name: "Período", desc: "Intervalo de datas (padrão: últimos 2 meses)" },
      { name: "CT-e", desc: "Número, série, emissão, frete, transportadora e tomador" },
      { name: "NF-e", desc: "Número, série, emissão, valor, frete rateado e fornecedor" },
      { name: "% NF-e no CT-e", desc: "Peso da nota no total do CT-e" },
      { name: "Frete sobre a mercadoria", desc: "Total do CT-e ÷ soma das NF-e do CT-e" },
      { name: "Frete médio", desc: "Média do frete % por CT-e do grupo" },
    ],
    examples: [
      {
        title: "Regra de faixa de frete",
        desc: "O frete deve ficar entre 1,5% e 2,0% da mercadoria. Até 1,5% fica verde, entre 1,5% e 2,0% fica laranja (é a faixa esperada) e acima de 2,0% fica vermelho.",
      },
      {
        title: "Por que a média e não o ratio total",
        desc: "O frete médio é a média do percentual CT-e a CT-e. Somar todo o frete e dividir por toda a mercadoria distorce, porque uma única NF-e muito grande puxa o resultado para baixo e mascara CT-es fora da faixa.",
      },
      {
        title: "Região do cliente",
        desc: "O agrupamento por região usa a região do cliente da ordem de despacho (nf_od_regiao), não a origem ou o destino do CT-e. CT-es sem essa informação aparecem como “Sem região”.",
      },
    ],
  },
}
